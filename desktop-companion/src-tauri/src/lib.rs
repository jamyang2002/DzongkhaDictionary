mod clipboard;
mod detector;
mod tray;
mod updates;
mod windows;

use std::sync::{atomic::AtomicBool, Arc};
use tauri::WindowEvent;
use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;

#[derive(Clone)]
pub struct SharedState {
    scan_enabled: Arc<AtomicBool>,
}

#[tauri::command]
fn hide_quick_lookup(app: tauri::AppHandle) -> Result<(), String> {
    windows::hide_quick_lookup_window(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn start_quick_lookup_drag(window: tauri::WebviewWindow) -> Result<(), String> {
    windows::start_quick_lookup_drag(&window).map_err(|error| error.to_string())
}

#[tauri::command]
fn open_full_entry(app: tauri::AppHandle, query: String) -> Result<(), String> {
    windows::open_full_entry_window(&app, &query).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = SharedState {
        scan_enabled: Arc::new(AtomicBool::new(true)),
    };
    let watcher_state = state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(state)
        .manage(updates::PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            hide_quick_lookup,
            start_quick_lookup_drag,
            open_full_entry,
            updates::check_for_update,
            updates::install_pending_update
        ])
        .setup(move |app| {
            windows::create_quick_window(app.handle())?;

            #[cfg(not(debug_assertions))]
            if !app.autolaunch().is_enabled().unwrap_or(false) {
                let _ = app.autolaunch().enable();
            }

            tray::create_tray(app)?;

            clipboard::start_clipboard_watcher(
                app.handle().clone(),
                watcher_state.scan_enabled.clone(),
            );
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } if window.label() == "main" => {
                api.prevent_close();
                let _ = window.hide();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Dzongkha Dictionary desktop companion");
}
