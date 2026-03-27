//! 127.0.0.1 随机端口本地 HTTP：`/fs/*` 与 Bearer + Origin 策略。

use std::convert::Infallible;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::time::Duration;

use axum::extract::Query;
use axum::http::{HeaderMap, StatusCode};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::routing::{get, post};
use axum::{Json, Router};
use futures::stream::Stream;
use serde::Deserialize;
use serde_json::json;
use notify::Watcher;
use tower_http::cors::{Any, CorsLayer};

use crate::config::PersistedConfig;
use crate::fs_ops::{self, DirEntryJson};
use crate::pairing;

pub type SharedState = std::sync::Arc<tokio::sync::RwLock<ServerState>>;

#[derive(Debug, Clone)]
pub struct ServerState {
    pub config: PersistedConfig,
    pub local_api_base: Option<String>,
}

#[derive(Deserialize)]
pub struct PathQuery {
    pub path: Option<String>,
}

#[derive(Deserialize)]
pub struct WriteBody {
    pub path: String,
    #[serde(default)]
    pub content_base64: String,
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let v = headers.get(axum::http::header::AUTHORIZATION)?.to_str().ok()?;
    let rest = v.strip_prefix("Bearer ")?;
    Some(rest.trim().to_string())
}

fn write_confirmed(headers: &HeaderMap) -> bool {
    headers
        .get("X-Gaialynk-Confirmed")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.eq_ignore_ascii_case("true"))
        .unwrap_or(false)
}

fn check_origin_and_token(headers: &HeaderMap, config: &PersistedConfig) -> Result<(), StatusCode> {
    let token = bearer_token(headers).ok_or(StatusCode::UNAUTHORIZED)?;
    let expected = config.device_token.as_ref().ok_or(StatusCode::UNAUTHORIZED)?;
    if token != *expected {
        return Err(StatusCode::UNAUTHORIZED);
    }
    if let Some(origin) = headers.get(axum::http::header::ORIGIN).and_then(|v| v.to_str().ok()) {
        if !config
            .allowed_web_origins
            .iter()
            .any(|o| o.as_str() == origin)
        {
            return Err(StatusCode::FORBIDDEN);
        }
    }
    Ok(())
}

fn mounted_paths(config: &PersistedConfig) -> Vec<PathBuf> {
    config
        .mounted_roots
        .iter()
        .map(PathBuf::from)
        .collect()
}

fn schedule_receipt(
    shared: SharedState,
    action: &'static str,
    path: &std::path::Path,
    status: &'static str,
    error_code: Option<String>,
) {
    let ph = fs_ops::path_hash(path);
    let path_owned = path.to_path_buf();
    tokio::spawn(async move {
        let (mainline, token, secret, device_id) = {
            let st = shared.read().await;
            (
                st.config.mainline_base_url.clone(),
                st.config.device_token.clone(),
                st.config.device_secret.clone(),
                st.config.device_id.clone(),
            )
        };
        let (Some(token), Some(secret), Some(device_id)) = (token, secret, device_id) else {
            return;
        };
        let body = pairing::build_signed_receipt(
            &secret,
            &device_id,
            action,
            &ph,
            status,
            error_code.as_deref(),
        );
        let client = reqwest::Client::new();
        pairing::post_receipt_fire_and_forget(&client, &mainline, &token, &body).await;
        let _ = path_owned;
    });
}

async fn fs_list(
    axum::extract::State(shared): axum::extract::State<SharedState>,
    headers: HeaderMap,
    Query(q): Query<PathQuery>,
) -> Result<Json<Vec<DirEntryJson>>, StatusCode> {
    let path_str = q.path.unwrap_or_default();
    let roots = {
        let st = shared.read().await;
        check_origin_and_token(&headers, &st.config)?;
        mounted_paths(&st.config)
    };
    let p = fs_ops::resolve_within_roots(&roots, &path_str).map_err(|_| StatusCode::FORBIDDEN)?;
    let entries = fs_ops::list_dir(&p).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    schedule_receipt(shared.clone(), "file_list", &p, "ok", None);
    Ok(Json(entries))
}

async fn fs_read(
    axum::extract::State(shared): axum::extract::State<SharedState>,
    headers: HeaderMap,
    Query(q): Query<PathQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let path_str = q.path.ok_or(StatusCode::BAD_REQUEST)?;
    let roots = {
        let st = shared.read().await;
        check_origin_and_token(&headers, &st.config)?;
        mounted_paths(&st.config)
    };
    let p = fs_ops::resolve_within_roots(&roots, &path_str).map_err(|_| StatusCode::FORBIDDEN)?;
    let bytes = fs_ops::read_file_bounded(&p).map_err(|e| match e {
        fs_ops::FsError::TooLarge => StatusCode::PAYLOAD_TOO_LARGE,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    })?;
    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    schedule_receipt(shared.clone(), "file_read", &p, "ok", None);
    Ok(Json(json!({ "encoding": "base64", "content": b64 })))
}

async fn fs_write(
    axum::extract::State(shared): axum::extract::State<SharedState>,
    headers: HeaderMap,
    Json(body): Json<WriteBody>,
) -> Result<StatusCode, StatusCode> {
    let confirmed = write_confirmed(&headers);
    let roots = {
        let st = shared.read().await;
        check_origin_and_token(&headers, &st.config)?;
        mounted_paths(&st.config)
    };
    let p = fs_ops::resolve_within_roots(&roots, &body.path).map_err(|_| StatusCode::FORBIDDEN)?;
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(body.content_base64.as_bytes())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    match fs_ops::write_file(&p, &bytes, confirmed) {
        Ok(()) => {
            schedule_receipt(shared.clone(), "file_write", &p, "ok", None);
            Ok(StatusCode::NO_CONTENT)
        }
        Err(fs_ops::FsError::WriteNotConfirmed) => Err(StatusCode::FORBIDDEN),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn fs_watch(
    axum::extract::State(shared): axum::extract::State<SharedState>,
    headers: HeaderMap,
    Query(q): Query<PathQuery>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, StatusCode> {
    let path_str = q.path.unwrap_or_default();
    let roots = {
        let st = shared.read().await;
        check_origin_and_token(&headers, &st.config)?;
        mounted_paths(&st.config)
    };
    let watch_path = fs_ops::resolve_within_roots(&roots, &path_str).map_err(|_| StatusCode::FORBIDDEN)?;
    if !watch_path.is_dir() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let p_clone = watch_path.clone();
    std::thread::spawn(move || {
        let mut watcher = match notify::RecommendedWatcher::new(
            move |res: notify::Result<notify::Event>| {
                let line = match res {
                    Ok(ev) => serde_json::to_string(&json!({ "kind": "notify", "event": format!("{ev:?}") }))
                        .unwrap_or_else(|_| "{}".to_string()),
                    Err(e) => json!({ "kind": "error", "message": e.to_string() }).to_string(),
                };
                let _ = tx.send(line);
            },
            notify::Config::default(),
        ) {
            Ok(w) => w,
            Err(_) => return,
        };
        if watcher
            .watch(&p_clone, notify::RecursiveMode::NonRecursive)
            .is_err()
        {
            return;
        }
        loop {
            std::thread::park_timeout(Duration::from_secs(3600));
        }
    });

    let stream = async_stream::stream! {
        while let Some(line) = rx.recv().await {
            yield Ok(Event::default().event("fs").data(line));
        }
    };

    Ok(
        Sse::new(stream).keep_alive(
            KeepAlive::new()
                .interval(Duration::from_secs(15))
                .text("keepalive"),
        ),
    )
}

fn build_app(shared: SharedState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/fs/list", get(fs_list))
        .route("/fs/read", get(fs_read))
        .route("/fs/write", post(fs_write))
        .route("/fs/watch", get(fs_watch))
        .layer(cors)
        .with_state(shared)
}

pub async fn run_server(shared: SharedState) {
    let addr = SocketAddr::from(([127, 0, 0, 1], 0));
    let app = build_app(shared.clone());
    let listener = tokio::net::TcpListener::bind(addr).await.ok();
    let Some(listener) = listener else {
        return;
    };
    let local = listener.local_addr().ok();
    if let Some(a) = local {
        let base = format!("http://127.0.0.1:{}/", a.port());
        {
            let mut st = shared.write().await;
            st.local_api_base = Some(base.clone());
        }
        eprintln!("gaialynk-connector: local HTTP {base}");
    }
    let _ = axum::serve(listener, app).await;
}
