pub mod licence;
pub mod commands;


use licence::Tier;
use tokio::sync::Mutex;

pub struct LicenceState {
    pub tier:  Tier,
    pub token: Option<licence::LicenceToken>,
}

pub fn initialise_licence() -> LicenceState {
    // In Open Source, we load but force Community
    match licence::load_local() {
        Ok(token) => {
            LicenceState { tier: Tier::Community, token: Some(token) }
        }
        _ => {
            LicenceState { tier: Tier::Community, token: None }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Mutex::new(initialise_licence());

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_licence_status,
            commands::activate_plugin_licence,
            commands::deactivate_plugin_licence

        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
