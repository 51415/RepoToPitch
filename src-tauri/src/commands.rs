use crate::LicenceState;
use dirs;
use serde_json::{self, json};
use tokio::sync::Mutex;

fn get_installed_plugins() -> Vec<String> {
    let mut plugins = Vec::new();
    if let Some(config) = dirs::config_dir() {
        let plugins_dir = config
            .join("growthvariable")
            .join("RepoToPitch")
            .join("plugins");
        if let Ok(entries) = std::fs::read_dir(plugins_dir) {
            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_file() {
                        if let Some(ext) = entry.path().extension() {
                            if ext == "json" {
                                if let Some(name) =
                                    entry.path().file_stem().and_then(|s| s.to_str())
                                {
                                    plugins.push(name.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    plugins
}

/// Status — FORCE Community tier in open-source version
#[tauri::command]
pub fn get_licence_status(state: tauri::State<'_, Mutex<LicenceState>>) -> serde_json::Value {
    let activated_plugins = get_installed_plugins();

    // We try to lock to ensure thread safety, even if we return hardcoded community tier
    if let Ok(_) = state.try_lock() {
        json!({
            "tier": "community",
            "activated":           false,
            "product_name":        "Community Edition",
            "user_name":           "",
            "user_email":          "",
            "deep_dive_bundled":   false,
            "plugins_enabled":     true,
            "activated_plugins":   activated_plugins,
        })
    } else {
        json!({
            "tier": "community",
            "activated": false,
            "product_name": "Community Edition",
            "user_name": "",
            "user_email": "",
            "deep_dive_bundled": false,
            "plugins_enabled": true,
            "activated_plugins": activated_plugins
        })
    }
}

/// Activate a plugin — stubbed for Community Edition stability
#[tauri::command]
pub async fn activate_plugin_licence(plugin_id: String, _key: String) -> Result<String, String> {
    // Stub: Always succeed in Community Edition
    Ok(format!("Plugin {} activated successfully.", plugin_id))
}

/// Deactivate a plugin — stubbed for Community Edition stability
#[tauri::command]
pub async fn deactivate_plugin_licence(plugin_id: String) -> Result<String, String> {
    // Stub: Always succeed in Community Edition
    Ok(format!("Plugin {} deactivated and removed.", plugin_id))
}
