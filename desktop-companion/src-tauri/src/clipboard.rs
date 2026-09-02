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
    time::{Duration, Instant},
};
use tauri::AppHandle;

const CLIPBOARD_READ_ATTEMPTS: usize = 4;
const CLIPBOARD_RETRY_DELAY: Duration = Duration::from_millis(20);

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

        // Clipboard notifications can arrive before the source application has
        // fully released the clipboard. Retry briefly instead of losing the
        // first half of a deliberate double-copy gesture.
        let mut text = None;
        for attempt in 0..CLIPBOARD_READ_ATTEMPTS {
            match self.clipboard.get_text() {
                Ok(value) => {
                    text = Some(value);
                    break;
                }
                Err(_) if attempt + 1 < CLIPBOARD_READ_ATTEMPTS => {
                    thread::sleep(CLIPBOARD_RETRY_DELAY);
                }
                Err(_) => return,
            }
        }
        let Some(text) = text else {
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
