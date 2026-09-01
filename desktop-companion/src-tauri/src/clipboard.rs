use crate::{detector::DoubleCopyDetector, windows};
use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext,
};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Instant,
};
use tauri::AppHandle;

struct LookupClipboardHandler {
    app: AppHandle,
    clipboard: ClipboardContext,
    detector: DoubleCopyDetector,
    scan_enabled: Arc<AtomicBool>,
}

impl ClipboardHandler for LookupClipboardHandler {
    fn on_clipboard_change(&mut self) {
        if !self.scan_enabled.load(Ordering::Relaxed) {
            self.detector.reset();
            return;
        }

        let Ok(text) = self.clipboard.get_text() else {
            self.detector.reset();
            return;
        };

        let Some(query) = self.detector.observe(&text, Instant::now()) else {
            return;
        };

        #[cfg(debug_assertions)]
        eprintln!("Quick Lookup detected a double-copy for: {query}");

        let app = self.app.clone();
        let callback_app = app.clone();
        let _ = app.run_on_main_thread(move || {
            if let Err(error) = windows::show_quick_lookup(&callback_app, &query) {
                eprintln!("Unable to show Quick Lookup: {error}");
            }
        });
    }
}

pub fn start_clipboard_watcher(app: AppHandle, scan_enabled: Arc<AtomicBool>) {
    thread::Builder::new()
        .name("dzongkha-clipboard-watcher".into())
        .spawn(move || {
            let Ok(clipboard) = ClipboardContext::new() else {
                eprintln!("Unable to access the system clipboard.");
                return;
            };

            let handler = LookupClipboardHandler {
                app,
                clipboard,
                detector: DoubleCopyDetector::default(),
                scan_enabled,
            };

            let Ok(mut watcher) = ClipboardWatcherContext::new() else {
                eprintln!("Unable to start the system clipboard watcher.");
                return;
            };

            watcher.add_handler(handler);
            watcher.start_watch();
        })
        .expect("failed to spawn clipboard watcher");
}
