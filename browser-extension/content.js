(() => {
    'use strict';

    const DOUBLE_COPY_WINDOW_MS = 1800;
    const MAX_QUERY_LENGTH = 160;
    let lastCopiedText = '';
    let lastCopyTime = 0;
    let popupHost = null;
    let lookupFrame = null;
    let isDictionaryPage = false;

    function storageGet(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (value) => {
                if (chrome.runtime.lastError) resolve({});
                else resolve(value || {});
            });
        });
    }

    function storageSet(value) {
        return new Promise((resolve) => {
            chrome.storage.local.set(value, () => resolve());
        });
    }

    function normalizeSelectedText(value) {
        return String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
    }

    function getSelectedText() {
        const active = document.activeElement;
        if ((active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
            && typeof active.selectionStart === 'number'
            && active.selectionStart !== active.selectionEnd) {
            return active.value.slice(active.selectionStart, active.selectionEnd);
        }
        return window.getSelection()?.toString() || '';
    }

    function getShortcutLabel() {
        const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
        return /mac/i.test(platform) ? '⌘ C C' : 'Ctrl C C';
    }

    function isAllowedDictionaryUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' || url.protocol === 'http:';
        } catch (error) {
            return false;
        }
    }

    function removePopup() {
        popupHost?.remove();
        popupHost = null;
        lookupFrame = null;
    }

    function createPopupHost() {
        removePopup();
        popupHost = document.createElement('div');
        popupHost.setAttribute('data-dzongkha-quick-lookup-host', '');
        popupHost.style.setProperty('all', 'initial', 'important');
        popupHost.style.setProperty('position', 'fixed', 'important');
        popupHost.style.setProperty('right', '16px', 'important');
        popupHost.style.setProperty('bottom', '16px', 'important');
        popupHost.style.setProperty('z-index', '2147483647', 'important');
        popupHost.style.setProperty('width', 'min(420px, calc(100vw - 24px))', 'important');
        popupHost.style.setProperty('height', 'min(520px, calc(100vh - 24px))', 'important');
        popupHost.style.setProperty('pointer-events', 'none', 'important');
        (document.documentElement || document.body).appendChild(popupHost);
        return popupHost.attachShadow({ mode: 'closed' });
    }

    function showSetupNotice() {
        const shadow = createPopupHost();
        const style = document.createElement('style');
        style.textContent = `
            :host { color-scheme: light dark; }
            .notice {
                position: absolute; right: 0; bottom: 0; box-sizing: border-box;
                width: 100%; padding: 18px; border: 1px solid rgba(32, 53, 92, .18);
                border-radius: 18px; background: #fff; color: #101828;
                box-shadow: 0 24px 70px rgba(8, 20, 44, .25);
                pointer-events: auto; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
            .brand { color: #2948a5; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
            button { border: 0; cursor: pointer; font: inherit; }
            .close { width: 30px; height: 30px; border-radius: 9px; background: #f0f3f8; color: #56637a; font-size: 19px; }
            h2 { margin: 16px 0 7px; font-size: 19px; letter-spacing: -.02em; }
            p { margin: 0; color: #56637a; font-size: 13px; line-height: 1.55; }
            .open { width: 100%; min-height: 42px; margin-top: 15px; border-radius: 11px; background: #2948a5; color: #fff; font-size: 13px; font-weight: 800; }
            .hint { margin-top: 11px; color: #7c899f; font-size: 11px; text-align: center; }
            @media (prefers-color-scheme: dark) {
                .notice { border-color: rgba(226,233,246,.16); background: #111a2b; color: #f6f8fc; }
                p { color: #a9b5c9; } .close { background: #1a2740; color: #a9b5c9; }
            }
        `;
        const notice = document.createElement('section');
        notice.className = 'notice';
        notice.innerHTML = `
            <div class="top"><span class="brand">Dzongkha Quick Lookup</span><button class="close" type="button" aria-label="Close">×</button></div>
            <h2>Connect your dictionary</h2>
            <p>Open the Dzongkha Dictionary once in a browser tab. Quick Lookup will remember its address automatically. You can also enter the address in extension settings.</p>
            <button class="open" type="button">Open extension settings</button>
            <div class="hint">After setup, select a word and press ${getShortcutLabel()}.</div>`;
        notice.querySelector('.close').addEventListener('click', removePopup);
        notice.querySelector('.open').addEventListener('click', () => chrome.runtime.openOptionsPage());
        shadow.append(style, notice);
        popupHost.style.setProperty('height', '300px', 'important');
    }

    function showLookupFrame(dictionaryUrl, query) {
        const shadow = createPopupHost();
        const style = document.createElement('style');
        style.textContent = `
            iframe {
                box-sizing: border-box; width: 100%; height: 100%; border: 0; border-radius: 22px;
                background: transparent; pointer-events: auto; color-scheme: light dark;
            }
        `;
        const url = new URL(dictionaryUrl);
        url.searchParams.set('quick', '1');
        url.searchParams.set('lookup', query);
        url.hash = '';

        lookupFrame = document.createElement('iframe');
        lookupFrame.src = url.href;
        lookupFrame.title = `Dzongkha Dictionary quick lookup for ${query}`;
        lookupFrame.setAttribute('referrerpolicy', 'no-referrer');
        shadow.append(style, lookupFrame);
    }

    async function openQuickLookup(query) {
        const stored = await storageGet('dictionaryUrl');
        if (!isAllowedDictionaryUrl(stored.dictionaryUrl)) {
            showSetupNotice();
            return;
        }
        showLookupFrame(stored.dictionaryUrl, query);
    }

    function handleCopy() {
        if (isDictionaryPage) return;
        const text = normalizeSelectedText(getSelectedText());
        if (!text || text.length > MAX_QUERY_LENGTH) {
            lastCopiedText = '';
            lastCopyTime = 0;
            return;
        }

        const now = performance.now();
        const isDoubleCopy = text === lastCopiedText && now - lastCopyTime <= DOUBLE_COPY_WINDOW_MS;
        lastCopiedText = text;
        lastCopyTime = now;
        if (isDoubleCopy) openQuickLookup(text);
    }

    window.addEventListener('message', (event) => {
        if (event.source === window && event.data?.type === 'DZONGKHA_DICTIONARY_APP_READY') {
            const hasAppSignature = Boolean(
                document.getElementById('searchBox')
                && document.querySelector('script[src*="quick-lookup.js"]')
            );
            if (!hasAppSignature || !isAllowedDictionaryUrl(event.data.dictionaryUrl)) return;

            const dictionaryUrl = new URL(event.data.dictionaryUrl);
            if (dictionaryUrl.origin !== window.location.origin) return;
            isDictionaryPage = true;
            storageSet({ dictionaryUrl: dictionaryUrl.href });
            return;
        }

        if (event.data?.type === 'DZONGKHA_QUICK_LOOKUP_CLOSE'
            && lookupFrame
            && event.source === lookupFrame.contentWindow) {
            removePopup();
        }
    });

    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && popupHost) removePopup();
    }, true);
    document.addEventListener('pointerdown', (event) => {
        if (popupHost && !event.composedPath().includes(popupHost)) removePopup();
    }, true);
})();
