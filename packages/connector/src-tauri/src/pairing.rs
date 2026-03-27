//! 配对码生成、主网轮询与收据 HMAC（与 E-20 契约对齐，见 `packages/connector/PROTOCOL.md`）。

use hmac::{Hmac, Mac};
use rand::Rng;
use serde::Deserialize;
use serde::Serialize;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_numeric_pairing_code() -> String {
    let n: u32 = rand::thread_rng().gen_range(0..1_000_000);
    format!("{n:06}")
}

#[derive(Debug, Deserialize, Clone)]
pub struct PairStatusBody {
    pub status: String,
    pub device_token: Option<String>,
    pub device_secret: Option<String>,
    pub device_id: Option<String>,
}

pub async fn fetch_pair_status(
    client: &reqwest::Client,
    mainline_base: &str,
    pairing_code: &str,
) -> anyhow::Result<PairStatusBody> {
    let base = mainline_base.trim_end_matches('/');
    let url = format!(
        "{base}/api/v1/connectors/desktop/pair-status?pairing_code={pairing_code}"
    );
    let res = client.get(&url).send().await?.error_for_status()?;
    Ok(res.json().await?)
}

#[derive(Debug, Serialize, Clone)]
struct ReceiptSignEnvelope {
    pub action: String,
    pub device_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    pub path_hash: String,
    pub status: String,
    pub ts: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ReceiptPayload {
    pub device_id: String,
    pub action: String,
    pub path_hash: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,
    pub ts: String,
    pub env_signature: String,
}

pub fn build_signed_receipt(
    device_secret: &str,
    device_id: &str,
    action: &str,
    path_hash: &str,
    status: &str,
    error_code: Option<&str>,
) -> ReceiptPayload {
    let ts = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
    build_signed_receipt_at(
        device_secret,
        device_id,
        action,
        path_hash,
        status,
        error_code,
        &ts,
    )
}

fn build_signed_receipt_at(
    device_secret: &str,
    device_id: &str,
    action: &str,
    path_hash: &str,
    status: &str,
    error_code: Option<&str>,
    ts: &str,
) -> ReceiptPayload {
    let envelope = ReceiptSignEnvelope {
        action: action.to_string(),
        device_id: device_id.to_string(),
        error_code: error_code.map(String::from),
        path_hash: path_hash.to_string(),
        status: status.to_string(),
        ts: ts.to_string(),
    };
    let sign_input = serde_json::to_string(&envelope).unwrap_or_default();
    let sig = hmac_hex(device_secret.as_bytes(), sign_input.as_bytes());
    ReceiptPayload {
        device_id: device_id.to_string(),
        action: action.to_string(),
        path_hash: path_hash.to_string(),
        status: status.to_string(),
        error_code: error_code.map(String::from),
        ts: ts.to_string(),
        env_signature: sig,
    }
}

fn hmac_hex(key: &[u8], msg: &[u8]) -> String {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC key length");
    mac.update(msg);
    hex::encode(mac.finalize().into_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn receipt_signature_stable_for_same_inputs() {
        let ts = "2026-03-24T00:00:00Z";
        let a = build_signed_receipt_at("sec", "dev1", "file_read", "abc", "ok", None, ts);
        let b = build_signed_receipt_at("sec", "dev1", "file_read", "abc", "ok", None, ts);
        assert_eq!(a.env_signature, b.env_signature);
        assert_eq!(a.action, "file_read");
    }

    #[test]
    fn receipt_signature_changes_with_secret() {
        let ts = "2026-03-24T00:00:00Z";
        let a = build_signed_receipt_at("sec1", "dev1", "file_list", "h", "ok", None, ts);
        let b = build_signed_receipt_at("sec2", "dev1", "file_list", "h", "ok", None, ts);
        assert_ne!(a.env_signature, b.env_signature);
    }
}

pub async fn post_receipt_fire_and_forget(
    client: &reqwest::Client,
    mainline_base: &str,
    device_token: &str,
    body: &ReceiptPayload,
) {
    let base = mainline_base.trim_end_matches('/');
    let url = format!("{base}/api/v1/connectors/desktop/receipts");
    let _ = client
        .post(url)
        .header("Authorization", format!("Bearer {device_token}"))
        .json(body)
        .send()
        .await;
}
