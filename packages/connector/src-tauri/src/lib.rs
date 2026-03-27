mod config;
mod fs_ops;
mod local_server;
mod pairing;

use std::sync::Arc;
use std::time::Duration;

use local_server::{ServerState, SharedState};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
struct StatusPayload {
    pairing_code: String,
    connected: bool,
    mainline_base_url: String,
    local_api_base: Option<String>,
    mounted_roots: Vec<String>,
    device_id: Option<String>,
}

#[tauri::command]
async fn get_status(state: tauri::State<'_, SharedState>) -> Result<StatusPayload, String> {
    let st = state.read().await;
    Ok(StatusPayload {
        pairing_code: st.config.pairing_code.clone(),
        connected: st.config.device_token.is_some(),
        mainline_base_url: st.config.mainline_base_url.clone(),
        local_api_base: st.local_api_base.clone(),
        mounted_roots: st.config.mounted_roots.clone(),
        device_id: st.config.device_id.clone(),
    })
}

#[tauri::command]
async fn set_mainline_base_url(
    state: tauri::State<'_, SharedState>,
    url: String,
) -> Result<(), String> {
    let mut st = state.write().await;
    st.config.mainline_base_url = url.trim_end_matches('/').to_string();
    config::save(&st.config).map_err(|e| e.to_string())
}

#[tauri::command]
async fn regenerate_pairing_code(state: tauri::State<'_, SharedState>) -> Result<(), String> {
    let mut st = state.write().await;
    st.config.pairing_code = pairing::generate_numeric_pairing_code();
    st.config.device_token = None;
    st.config.device_secret = None;
    st.config.device_id = None;
    config::save(&st.config).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_mount_directory(
    app: tauri::AppHandle,
    state: tauri::State<'_, SharedState>,
) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;
    {
        let st = state.read().await;
        if st.config.mounted_roots.len() >= 5 {
            return Err("最多挂载 5 个工作区根目录".to_string());
        }
    }
    let h = app.clone();
    let picked = tokio::task::spawn_blocking(move || h.dialog().file().blocking_pick_folder())
        .await
        .map_err(|e| e.to_string())?;
    let Some(file_path) = picked else {
        return Ok(());
    };
    let path = file_path
        .into_path()
        .map_err(|e| format!("无法解析所选目录: {e}"))?
        .to_string_lossy()
        .to_string();
    let mut st = state.write().await;
    if !st.config.mounted_roots.contains(&path) {
        st.config.mounted_roots.push(path);
    }
    config::save(&st.config).map_err(|e| e.to_string())
}

async fn pairing_poll_loop(shared: SharedState) {
    let client = reqwest::Client::new();
    loop {
        tokio::time::sleep(Duration::from_secs(2)).await;
        let (code, base, has_token) = {
            let st = shared.read().await;
            (
                st.config.pairing_code.clone(),
                st.config.mainline_base_url.clone(),
                st.config.device_token.is_some(),
            )
        };
        if has_token {
            continue;
        }
        let Ok(body) = pairing::fetch_pair_status(&client, &base, &code).await else {
            continue;
        };
        if !body.status.eq_ignore_ascii_case("completed") {
            continue;
        }
        let Some(t) = body.device_token else {
            continue;
        };
        let Some(s) = body.device_secret else {
            continue;
        };
        let Some(id) = body.device_id else {
            continue;
        };
        let mut st = shared.write().await;
        st.config.device_token = Some(t);
        st.config.device_secret = Some(s);
        st.config.device_id = Some(id);
        let _ = config::save(&st.config);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let shared: SharedState = Arc::new(tokio::sync::RwLock::new(ServerState {
        config: config::load(),
        local_api_base: None,
    }));

    let s_srv = shared.clone();
    tauri::async_runtime::spawn(async move {
        local_server::run_server(s_srv).await;
    });

    let s_poll = shared.clone();
    tauri::async_runtime::spawn(async move {
        pairing_poll_loop(s_poll).await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(shared.clone())
        .invoke_handler(tauri::generate_handler![
            get_status,
            set_mainline_base_url,
            regenerate_pairing_code,
            add_mount_directory,
        ])
        .setup(|app: &mut tauri::App| -> Result<(), Box<dyn std::error::Error>> {
            let handle = app.handle().clone();
            let show = MenuItem::with_id(&handle, "show", "显示窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(&handle, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(&handle, &[&show, &quit])?;
            let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))?;
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .icon(icon)
                .show_menu_on_left_click(true)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(&handle)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
