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

Select a short Dzongkha or English word in another application and press `Command+C` twice within 950 ms. The app must remain running, but its main window may be hidden. Press Escape, click the close button, or click outside the popup to dismiss it.

### Windows 10/11

Install the Tauri Windows prerequisites (Microsoft C++ Build Tools, WebView2, Node.js, and
Rust), then run in PowerShell:

```powershell
cd desktop-companion
npm install
npm run dev
```

Select a short Dzongkha or English word in Word, a PDF reader, a browser, or another
application and press `Ctrl+C` twice within 950 ms. The popup appears near the pointer.
The tray menu can open the full dictionary, disable Quick Lookup, toggle start-at-login,
or quit the background app.

## Build installers

Installers must be built on their target operating system.

macOS:

```sh
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

Tauri writes all output under `src-tauri/target/release/bundle`. The Windows command
produces both an NSIS `.exe` installer and an MSI installer. The repository workflow
`.github/workflows/desktop-windows.yml` also runs the Rust tests and creates both Windows
installers on a Windows runner; it can be started manually from GitHub Actions.

Public Windows releases should be Authenticode-signed. Public macOS releases should be
code-signed and notarized.

## Automatic updates and releases

The production app checks the latest GitHub Release metadata after startup. If a newer
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

To publish a release:

1. Set the same semantic version in `package.json`, `src-tauri/Cargo.toml`, and
   `src-tauri/tauri.conf.json`.
2. Commit and push the version change.
3. Create and push the matching tag, for example `desktop-v1.1.0`.

The `desktop-release.yml` workflow validates the version, runs the Rust tests, builds Intel
and Apple Silicon macOS bundles plus Windows NSIS/MSI installers, signs updater artifacts,
publishes the GitHub Release, and uploads `latest.json` for update checks. The existing web
and PWA deployment is not part of this workflow.

The companion reads only text clipboard updates, rejects empty or overlong selections, and does not install a global keyboard hook. This avoids macOS Accessibility permission while retaining the double-copy gesture.
