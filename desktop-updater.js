(() => {
    'use strict';

    const invoke = window.__TAURI__?.core?.invoke;
    const isQuickWindow = new URLSearchParams(window.location.search).get('quick') === '1';
    if (typeof invoke !== 'function' || isQuickWindow) return;

    const DEFERRED_VERSION_KEY = 'dzongkha-desktop-deferred-update';
    let activeUpdate = null;
    let refreshBeforeInstall = false;
    let overlay = null;

    function removeDialog() {
        overlay?.remove();
        overlay = null;
    }

    function deferUpdate() {
        if (activeUpdate?.version) {
            sessionStorage.setItem(DEFERRED_VERSION_KEY, activeUpdate.version);
        }
        removeDialog();
    }

    function createDialog(update) {
        removeDialog();
        overlay = document.createElement('div');
        overlay.className = 'desktop-update-overlay';
        overlay.innerHTML = `
            <section class="desktop-update-dialog" role="dialog" aria-modal="true" aria-labelledby="desktopUpdateTitle" aria-describedby="desktopUpdateNotes">
                <div class="desktop-update-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 8.5 6h-2.2A7 7 0 1 1 16 6.7L13 10h8V2l-3.5 3.5A9 9 0 0 0 12 3Zm1 5h-2v6.2l4.4 2.5 1-1.7-3.4-2V8Z"/></svg>
                </div>
                <div class="desktop-update-copy">
                    <p class="desktop-update-kicker">Dzongkha Dictionary</p>
                    <h2 id="desktopUpdateTitle">Update Available</h2>
                    <p class="desktop-update-version"></p>
                </div>
                <div id="desktopUpdateNotes" class="desktop-update-notes"></div>
                <div class="desktop-update-progress" hidden aria-hidden="true"><span></span></div>
                <p class="desktop-update-status" role="status" aria-live="polite"></p>
                <div class="desktop-update-actions">
                    <button class="desktop-update-later" type="button">Later</button>
                    <button class="desktop-update-now" type="button">Update Now</button>
                </div>
            </section>`;

        const version = overlay.querySelector('.desktop-update-version');
        const notes = overlay.querySelector('.desktop-update-notes');
        const laterButton = overlay.querySelector('.desktop-update-later');
        const updateButton = overlay.querySelector('.desktop-update-now');
        version.textContent = `Version ${update.version} is ready (currently ${update.currentVersion}).`;
        notes.textContent = update.notes.trim() || 'This release includes improvements and fixes for the desktop dictionary.';
        laterButton.addEventListener('click', deferUpdate);
        updateButton.addEventListener('click', installUpdate);
        document.body.appendChild(overlay);
        window.setTimeout(() => updateButton.focus(), 50);
    }

    async function installUpdate() {
        if (!overlay || !activeUpdate) return;
        const laterButton = overlay.querySelector('.desktop-update-later');
        const updateButton = overlay.querySelector('.desktop-update-now');
        const progress = overlay.querySelector('.desktop-update-progress');
        const status = overlay.querySelector('.desktop-update-status');

        laterButton.disabled = true;
        updateButton.disabled = true;
        updateButton.textContent = 'Updating…';
        progress.hidden = false;
        progress.setAttribute('aria-hidden', 'false');
        status.classList.remove('is-error');
        status.textContent = 'Downloading and verifying the signed update…';

        try {
            if (refreshBeforeInstall) {
                const refreshed = await invoke('check_for_update');
                if (!refreshed) {
                    removeDialog();
                    return;
                }
                activeUpdate = refreshed;
                refreshBeforeInstall = false;
            }
            await invoke('install_pending_update');
            status.textContent = 'Update installed. Restarting Dzongkha Dictionary…';
        } catch (error) {
            refreshBeforeInstall = true;
            laterButton.disabled = false;
            updateButton.disabled = false;
            updateButton.textContent = 'Try Again';
            progress.hidden = true;
            progress.setAttribute('aria-hidden', 'true');
            status.classList.add('is-error');
            status.textContent = `The update could not be installed. ${String(error || 'Please try again.')}`;
        }
    }

    async function checkForUpdate() {
        try {
            const update = await invoke('check_for_update');
            if (!update || sessionStorage.getItem(DEFERRED_VERSION_KEY) === update.version) return;
            activeUpdate = update;
            refreshBeforeInstall = false;
            createDialog(update);
        } catch (error) {
            console.warn('Automatic update check failed:', error);
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay) deferUpdate();
    });

    window.setTimeout(checkForUpdate, 2500);
})();
