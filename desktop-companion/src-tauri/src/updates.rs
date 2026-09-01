use serde::Serialize;
use std::{sync::Mutex, time::Duration};
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

pub struct PendingUpdate(pub Mutex<Option<Update>>);

impl Default for PendingUpdate {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMetadata {
    version: String,
    current_version: String,
    notes: String,
}

#[tauri::command]
pub async fn check_for_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let update = app
        .updater_builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let metadata = update.as_ref().map(|available| UpdateMetadata {
        version: available.version.clone(),
        current_version: available.current_version.clone(),
        notes: available.body.clone().unwrap_or_default(),
    });

    let mut pending = pending_update
        .0
        .lock()
        .map_err(|_| "update state is unavailable".to_string())?;
    *pending = update;
    Ok(metadata)
}

#[tauri::command]
pub async fn install_pending_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "update state is unavailable".to_string())?
        .take()
        .ok_or_else(|| "there is no pending update".to_string())?;

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())?;

    app.restart();
}
