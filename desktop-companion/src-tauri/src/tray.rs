use crate::{windows, SharedState};
use std::sync::atomic::Ordering;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::ManagerExt;

pub fn create_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Dzongkha Dictionary", true, None::<&str>)?;
    let scan = CheckMenuItem::with_id(
        app,
        "scan",
        "Quick Lookup (double-copy)",
        true,
        true,
        None::<&str>,
    )?;
    let start_at_login = CheckMenuItem::with_id(
        app,
        "autostart",
        "Start at login",
        true,
        app.autolaunch().is_enabled().unwrap_or(false),
        None::<&str>,
    )?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &scan, &start_at_login, &separator, &quit])?;

    let scan_item = scan.clone();
    let autostart_item = start_at_login.clone();
    let mut builder = TrayIconBuilder::with_id("dzongkha-dictionary-tray")
        .tooltip("Dzongkha Dictionary Quick Lookup")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "open" => {
                let _ = windows::show_main_window(app);
            }
            "scan" => {
                let state = app.state::<SharedState>();
                let enabled = !state.scan_enabled.load(Ordering::Relaxed);
                state.scan_enabled.store(enabled, Ordering::Relaxed);
                let _ = scan_item.set_checked(enabled);
                if !enabled {
                    let _ = windows::hide_quick_lookup_window(app);
                }
            }
            "autostart" => {
                let autostart = app.autolaunch();
                let enabled = autostart.is_enabled().unwrap_or(false);
                let result = if enabled {
                    autostart.disable()
                } else {
                    autostart.enable()
                };
                if result.is_ok() {
                    let _ = autostart_item.set_checked(!enabled);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = windows::show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}
