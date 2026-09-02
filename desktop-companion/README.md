# Dzongkha Dictionary Desktop

This Tauri package wraps the existing dictionary without changing its UI or search implementation. It adds a native clipboard watcher so the same selected word copied twice can be looked up from Microsoft Word, native PDFs, browsers, and other desktop applications.

The native layer is cross-platform. It uses macOS pasteboard polling on macOS and Win32
`WM_CLIPBOARDUPDATE` notifications on Windows. The application icon is generated from
`../assets/app-logo.png`; `app-icon.png` is the square, transparent icon source used by Tauri.

## Local test

### macOS

```sh
cd desktop-companion
npm install
npm run dev
```

Select a short Dzongkha or English word in another application and press `Command+C` twice within 2.5 seconds. The app must remain running, but its main window may be hidden. Drag the popup's top bar to move it. Press Escape, click the close button, or click outside the popup to dismiss it.

### Windows 10/11

Install the Tauri Windows prerequisites (Microsoft C++ Build Tools, WebView2, Node.js, and
Rust), then run in PowerShell:

```powershell
cd desktop-companion
npm install
npm run dev
```

Select a short Dzongkha or English word in Word, a PDF reader, a browser, or another
application and press `Ctrl+C` twice within 2.5 seconds. The popup appears near the pointer and its top bar can be dragged to move it.
The tray menu can open the full dictionary, disable Quick Lookup, toggle start-at-login,
or quit the background app.

## Build installers

Installers must be built on their target operating system.

For quick testing on the current Mac only, use `npm run dev` or
`npm run build:macos:fast`. The fast build targets the current Mac architecture.
Use the universal command below only for the final DMG shared with other people,
because it must compile and link both Intel and Apple Silicon binaries.

macOS:

```sh
rustup target add aarch64-apple-darwin x86_64-apple-darwin
export TAURI_SIGNING_PRIVATE_KEY="$(<.tauri/dzongkha-updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(<.tauri/dzongkha-updater.key.password)"
npm run build:macos
unset TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

Windows (PowerShell):

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw .tauri/dzongkha-updater.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Get-Content -Raw .tauri/dzongkha-updater.key.password
npm run build:windows
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY, Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

Tauri writes output under `src-tauri/target`. The macOS command produces one universal
DMG for both Intel and Apple Silicon Macs. The Windows command produces one NSIS `.exe`
installer. The repository workflow `.github/workflows/desktop-windows.yml` can also build
the Windows installer manually or validate it on a pull request. The additional macOS
`.app.tar.gz` and `.sig` files are updater payloads generated for existing installations;
friends should download the DMG, not those internal update files.

Public Windows releases should be Authenticode-signed. Public macOS releases should be
code-signed and notarized.

## Automatic updates and releases

The production app checks the latest GitHub Release metadata after startup, every 30 minutes,
when the computer reconnects, and when the window becomes active. If a newer
signed version exists, the main window shows an Update Available dialog with the version,
release notes, Update Now, and Later. Update Now downloads through the official Tauri
updater, verifies the artifact signature, installs it, and restarts the app. The updater
does not delete local storage, user settings, favourites, history, or bundled dictionary
data.

Updater signing material is generated locally in the ignored `.tauri` directory:

- `.tauri/dzongkha-updater.key` — encrypted private signing key; keep secret and back it up.
- `.tauri/dzongkha-updater.key.password` — private-key password; keep secret and back it up separately.
- `UPDATER_PUBLIC_KEY.txt` — public verification key embedded in `tauri.conf.json`; safe to commit.

Before publishing, add the contents of the two private files as GitHub repository secrets
named `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Never commit the
private key or password. Losing either prevents shipping updates to already-installed apps.

Every relevant push to `main` now publishes the matching desktop update automatically.
The workflow reads the PWA release track from `manifest.json`, appends the GitHub Actions
run number (for example, PWA `3.6.0` becomes desktop `3.6.142`), builds a universal macOS
DMG and Windows EXE, signs their updater artifacts, generates release notes, publishes the
GitHub Release, and uploads `latest.json`. Vercel continues to deploy the same committed
web files as the PWA, while the desktop staging script bundles those exact files.

Friends can download the `.dmg` on a Mac or the `-setup.exe` on Windows from the latest
GitHub Release. Existing desktop installations receive the same release through the
in-app Update Available dialog.

The companion reads only text clipboard updates, rejects empty or overlong selections, and does not install a global keyboard hook. This avoids macOS Accessibility permission while retaining the double-copy gesture.
