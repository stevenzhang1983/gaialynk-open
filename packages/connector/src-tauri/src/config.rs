//! 本地持久化配置（挂载根、主网 URL、device 凭据）。

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::pairing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedConfig {
    pub mainline_base_url: String,
    pub pairing_code: String,
    pub device_token: Option<String>,
    pub device_secret: Option<String>,
    pub device_id: Option<String>,
    pub mounted_roots: Vec<String>,
    pub allowed_web_origins: Vec<String>,
}

impl Default for PersistedConfig {
    fn default() -> Self {
        let mainline = std::env::var("GAIALYNK_MAINLINE_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:3000".to_string());
        Self {
            mainline_base_url: mainline,
            pairing_code: pairing::generate_numeric_pairing_code(),
            device_token: None,
            device_secret: None,
            device_id: None,
            mounted_roots: Vec::new(),
            allowed_web_origins: vec![
                "http://localhost:3000".to_string(),
                "http://127.0.0.1:3000".to_string(),
                "http://localhost:1420".to_string(),
                "http://127.0.0.1:1420".to_string(),
            ],
        }
    }
}

pub fn config_path() -> PathBuf {
    if let Some(p) = ProjectDirs::from("com", "GaiaLynk", "Connector") {
        return p.config_dir().join("config.json");
    }
    std::env::temp_dir().join("gaialynk-connector-config.json")
}

pub fn load() -> PersistedConfig {
    let path = config_path();
    if let Ok(bytes) = std::fs::read(&path) {
        if let Ok(c) = serde_json::from_slice::<PersistedConfig>(&bytes) {
            return c;
        }
    }
    let c = PersistedConfig::default();
    let _ = save(&c);
    c
}

pub fn save(c: &PersistedConfig) -> anyhow::Result<()> {
    let path = config_path();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(c)?)?;
    std::fs::rename(&tmp, &path)?;
    Ok(())
}
