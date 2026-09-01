use tauri::{
    utils::config::BackgroundThrottlingPolicy, AppHandle, LogicalSize, Manager, PhysicalPosition,
    WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

const QUICK_WINDOW_LABEL: &str = "quick";
const MAIN_WINDOW_LABEL: &str = "main";
const QUICK_WINDOW_WIDTH: f64 = 430.0;
const QUICK_WINDOW_HEIGHT: f64 = 560.0;
const CURSOR_MARGIN: i32 = 18;
const SCREEN_MARGIN: i32 = 12;

pub fn create_quick_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    WebviewWindowBuilder::new(
        app,
        QUICK_WINDOW_LABEL,
        WebviewUrl::App("index.html?quick=1".into()),
    )
    .title("Dzongkha Quick Lookup")
    .inner_size(QUICK_WINDOW_WIDTH, QUICK_WINDOW_HEIGHT)
    .min_inner_size(340.0, 420.0)
    .resizable(true)
    .decorations(false)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .skip_taskbar(true)
    .focused(false)
    .visible(false)
    .shadow(true)
    .background_throttling(BackgroundThrottlingPolicy::Disabled)
    .prevent_overflow()
    .build()
}

pub fn show_quick_lookup(app: &AppHandle, query: &str) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window(QUICK_WINDOW_LABEL) else {
        return Ok(());
    };

    position_near_cursor(app, &window)?;
    let serialized_query = serde_json::to_string(query).unwrap_or_else(|_| "\"\"".into());
    window.eval(format!(
        "window.postMessage({{ type: 'DZONGKHA_NATIVE_QUICK_LOOKUP', query: {serialized_query} }}, '*')"
    ))?;
    window.show()?;
    window.set_focus()?;
    #[cfg(debug_assertions)]
    eprintln!("Quick Lookup window shown.");
    Ok(())
}

pub fn hide_quick_lookup_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(QUICK_WINDOW_LABEL) {
        window.hide()?;
    }
    Ok(())
}

pub fn open_full_entry_window(app: &AppHandle, query: &str) -> tauri::Result<()> {
    hide_quick_lookup_window(app)?;
    let Some(main) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    let serialized_query = serde_json::to_string(query).unwrap_or_else(|_| "\"\"".into());
    main.show()?;
    main.unminimize()?;
    main.eval(format!(
        "window.postMessage({{ type: 'DZONGKHA_NATIVE_OPEN_FULL_ENTRY', query: {serialized_query} }}, '*')"
    ))?;
    main.set_focus()?;
    Ok(())
}

pub fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(main) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        main.show()?;
        main.unminimize()?;
        main.set_focus()?;
    }
    Ok(())
}

fn position_near_cursor(app: &AppHandle, window: &WebviewWindow) -> tauri::Result<()> {
    let cursor = app.cursor_position()?;
    let Some(monitor) = app.monitor_from_point(cursor.x, cursor.y)? else {
        return Ok(());
    };
    let size = window.outer_size()?;
    let work_area = monitor.work_area();
    let min_x = work_area.position.x + SCREEN_MARGIN;
    let min_y = work_area.position.y + SCREEN_MARGIN;
    let max_x =
        work_area.position.x + work_area.size.width as i32 - size.width as i32 - SCREEN_MARGIN;
    let max_y =
        work_area.position.y + work_area.size.height as i32 - size.height as i32 - SCREEN_MARGIN;

    let preferred_x = cursor.x.round() as i32 + CURSOR_MARGIN;
    let preferred_y = cursor.y.round() as i32 + CURSOR_MARGIN;
    let fallback_x = cursor.x.round() as i32 - size.width as i32 - CURSOR_MARGIN;
    let fallback_y = cursor.y.round() as i32 - size.height as i32 - CURSOR_MARGIN;
    let x = if preferred_x <= max_x {
        preferred_x
    } else {
        fallback_x
    }
    .clamp(min_x, max_x.max(min_x));
    let y = if preferred_y <= max_y {
        preferred_y
    } else {
        fallback_y
    }
    .clamp(min_y, max_y.max(min_y));

    window.set_position(PhysicalPosition::new(x, y))?;
    window.set_size(LogicalSize::new(QUICK_WINDOW_WIDTH, QUICK_WINDOW_HEIGHT))?;
    Ok(())
}
