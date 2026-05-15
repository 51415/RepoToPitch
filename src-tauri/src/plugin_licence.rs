// plugin_licence.rs
//
// Each commercial plugin owns its own licence check.
// Same LS pattern as the app — just a different product/key.
//
// Plugin licence files live alongside the app licence:
//   %APPDATA%\growthvariable\RepoToPitch\plugins\deep-dive.json
//   %APPDATA%\growthvariable\RepoToPitch\plugins\report-brand.json

#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};

const LS_ACTIVATE_URL:   &str = "https://api.lemonsqueezy.com/v1/licenses/activate";
const LS_VALIDATE_URL:   &str = "https://api.lemonsqueezy.com/v1/licenses/validate";
const LS_DEACTIVATE_URL: &str = "https://api.lemonsqueezy.com/v1/licenses/deactivate";

fn token_path(plugin_id: &str) -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("growthvariable")
        .join("RepoToPitch")
        .join("plugins")
        .join(format!("{}.json", plugin_id))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginToken {
    pub plugin_id:    String,
    pub licence_key:  String,
    pub instance_id:  String,
    pub activated_at: DateTime<Utc>,
    pub last_checked: DateTime<Utc>,
}

impl PluginToken {
    pub fn save(&self) -> Result<(), String> {
        let path = token_path(&self.plugin_id);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        std::fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load(plugin_id: &str) -> Result<Self, String> {
        let path = token_path(plugin_id);
        let json = std::fs::read_to_string(&path)
            .map_err(|_| format!("No licence found for plugin: {}", plugin_id))?;
        serde_json::from_str(&json)
            .map_err(|_| "Plugin licence file corrupt. Please re-activate.".to_string())
    }

    pub fn delete(plugin_id: &str) -> Result<(), String> {
        let path = token_path(plugin_id);
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn needs_remote_check(&self) -> bool {
        let age = chrono::Utc::now() - self.last_checked;
        age.num_days() >= 7
    }
}

/// Activate a plugin licence key against LS.
pub async fn activate_plugin(
    plugin_id: &str,
    licence_key: &str,
) -> Result<PluginToken, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(LS_ACTIVATE_URL)
        .form(&[
            ("license_key",   licence_key),
            ("instance_name", &format!("r2p-plugin-{}", plugin_id)),
        ])
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    #[derive(Deserialize)]
    struct LsResp {
        activated: bool,
        instance:  Option<LsInstance>,
        error:     Option<String>,
    }
    #[derive(Deserialize)]
    struct LsInstance { id: String }

    let ls: LsResp = response.json().await
        .map_err(|e| format!("Response error: {}", e))?;

    if !ls.activated {
        return Err(ls.error.unwrap_or_else(|| "Activation failed".into()));
    }

    let token = PluginToken {
        plugin_id:    plugin_id.to_string(),
        licence_key:  licence_key.to_string(),
        instance_id:  ls.instance.map(|i| i.id).unwrap_or_default(),
        activated_at: chrono::Utc::now(),
        last_checked: chrono::Utc::now(),
    };

    token.save()?;
    Ok(token)
}

/// Deactivate a plugin licence against LS and purge local configuration directory.
pub async fn deactivate_plugin(plugin_id: &str) -> Result<(), String> {
    if let Ok(token) = PluginToken::load(plugin_id) {
        let client = reqwest::Client::new();
        let _ = client
            .post(LS_DEACTIVATE_URL)
            .form(&[
                ("license_key", token.licence_key.as_str()),
                ("instance_id", token.instance_id.as_str()),
            ])
            .send()
            .await;
    }
    
    let _ = PluginToken::delete(plugin_id);
    
    if let Some(config) = dirs::config_dir() {
        let plugin_dir = config.join("growthvariable").join("RepoToPitch").join("plugins").join(plugin_id);
        if plugin_dir.exists() {
            let _ = std::fs::remove_dir_all(plugin_dir);
        }
    }
    Ok(())
}
