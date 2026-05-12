use crate::LicenceState;
use tokio::sync::Mutex;

/// Status — FORCE Community tier in open-source version
#[tauri::command]
pub fn get_licence_status(
    state: tauri::State<'_, Mutex<LicenceState>>,
) -> serde_json::Value {
    if let Ok(_app_state) = state.try_lock() {
        serde_json::json!({
            "tier":                "community",
            "activated":           false,
            "product_name":        "Community Edition",
            "user_name":           "",
            "user_email":          "",
            "deep_dive_bundled":   false,
            "plugins_enabled":     true,
        })
    } else {
        serde_json::json!({ "tier": "community", "activated": false, "plugins_enabled": true })
    }
}

/// Activate a plugin — allowed in open-source
#[tauri::command]
pub async fn activate_plugin_licence(
    plugin_id: String,
    key: String,
) -> Result<String, String> {
    // This requires a plugin_licence module which we'll restore if needed
    // For now, we'll just mock the success to verify the command path
    println!("[OS-BUILD] Activating plugin {} with key {}", plugin_id, key);
    Ok(format!("Plugin {} activation initiated.", plugin_id))
}
