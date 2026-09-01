(() => {
    'use strict';

    const api = window.DzongkhaDictionary;
    if (!api?.lookup) return;

    const params = new URLSearchParams(window.location.search);
    const isQuickDocument = api.isQuickLookupMode;
    const initialQuery = String(params.get('lookup') || '').normalize('NFC').trim();
    const lookupChannel = typeof BroadcastChannel === 'function'
        ? new BroadcastChannel('dzongkha-dictionary-quick-lookup')
        : null;
    const root = document.createElement('div');
    let lastCopiedText = '';
    let lastCopyTime = 0;
    let activeQuery = '';

    root.id = 'quickLookupRoot';
    root.hidden = true;
    root.setAttribute('aria-live', 'polite');
    document.body.appendChild(root);

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getDictionaryBaseUrl() {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        if (url.pathname.endsWith('/index.html')) url.pathname = url.pathname.slice(0, -'index.html'.length);
        return url.href;
    }

    function getFullEntryUrl(query) {
        const url = new URL(getDictionaryBaseUrl());
        url.searchParams.set('lookup', query);
        return url.href;
    }

    function getPlatformShortcut() {
        const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
        return /mac/i.test(platform) ? '⌘ C C' : 'Ctrl C C';
    }

    function closeQuickLookup({ notifyParent = isQuickDocument } = {}) {
        root.hidden = true;
        root.innerHTML = '';
        if (notifyParent && window.parent !== window) {
            window.parent.postMessage({ type: 'DZONGKHA_QUICK_LOOKUP_CLOSE' }, '*');
        }
    }

    function renderLoading(query) {
        root.hidden = false;
        root.innerHTML = `
            <section class="quick-lookup-card is-loading" role="dialog" aria-modal="false" aria-label="Quick lookup for ${escapeHtml(query)}">
                <div class="quick-lookup-topline">
                    <span class="quick-lookup-brand">Quick Lookup</span>
                    <button class="quick-lookup-close" type="button" data-quick-close aria-label="Close quick lookup">×</button>
                </div>
                <div class="quick-lookup-loading" role="status">
                    <span class="quick-lookup-spinner" aria-hidden="true"></span>
                    <span>Looking up “${escapeHtml(query)}”…</span>
                </div>
            </section>`;
    }

    function renderLookupResult(payload) {
        const result = payload.results?.[0];
        const resultCount = Number(payload.resultCount) || 0;
        const shortcut = getPlatformShortcut();

        if (!result) {
            root.hidden = false;
            root.innerHTML = `
                <section class="quick-lookup-card" role="dialog" aria-modal="false" aria-labelledby="quickLookupTitle">
                    <div class="quick-lookup-topline">
                        <span class="quick-lookup-brand">Quick Lookup</span>
                        <button class="quick-lookup-close" type="button" data-quick-close aria-label="Close quick lookup">×</button>
                    </div>
                    <div class="quick-lookup-empty">
                        <span class="quick-lookup-query">${escapeHtml(payload.query)}</span>
                        <h2 id="quickLookupTitle">No entry found</h2>
                        <p>Try a different spelling or open the full dictionary.</p>
                    </div>
                    <a class="quick-lookup-open" href="${escapeHtml(getFullEntryUrl(payload.query))}" ${isQuickDocument ? 'target="_blank" rel="noopener noreferrer"' : ''} data-open-full-entry>
                        Open Full Dictionary
                    </a>
                    <div class="quick-lookup-hint"><kbd>${shortcut}</kbd><span>Double-copy another selected word</span></div>
                </section>`;
            return;
        }

        const headwordClass = result.headwordHasDzongkha ? 'dzongkha-word' : 'english-word';
        const definitionClass = result.definitionHasDzongkha ? 'dzongkha-word' : 'english-word';
        const additionalCount = Math.max(0, resultCount - 1);

        root.hidden = false;
        root.innerHTML = `
            <section class="quick-lookup-card" role="dialog" aria-modal="false" aria-labelledby="quickLookupTitle">
                <div class="quick-lookup-topline">
                    <span class="quick-lookup-brand">Quick Lookup</span>
                    <button class="quick-lookup-close" type="button" data-quick-close aria-label="Close quick lookup">×</button>
                </div>
                <div class="quick-lookup-heading">
                    <div>
                        <span class="quick-lookup-direction">${escapeHtml(result.direction)}</span>
                        <h2 id="quickLookupTitle" class="${headwordClass}">${escapeHtml(result.headword)}</h2>
                    </div>
                    ${result.type ? `<span class="quick-lookup-type">${escapeHtml(result.type)}</span>` : ''}
                </div>
                <div class="quick-lookup-definition ${definitionClass}">${escapeHtml(result.definition || 'Definition unavailable.')}</div>
                <div class="quick-lookup-source">
                    <span>Source</span>
                    <strong>${escapeHtml(result.source)}</strong>
                </div>
                ${additionalCount ? `<div class="quick-lookup-more">+${additionalCount.toLocaleString()} more matching ${additionalCount === 1 ? 'entry' : 'entries'}</div>` : ''}
                <a class="quick-lookup-open" href="${escapeHtml(getFullEntryUrl(payload.query))}" ${isQuickDocument ? 'target="_blank" rel="noopener noreferrer"' : ''} data-open-full-entry>
                    Open Full Entry
                    <span aria-hidden="true">↗</span>
                </a>
                <div class="quick-lookup-hint"><kbd>${shortcut}</kbd><span>Double-copy another selected word</span></div>
            </section>`;
    }

    function renderLookupError(query) {
        root.hidden = false;
        root.innerHTML = `
            <section class="quick-lookup-card" role="dialog" aria-modal="false" aria-label="Quick lookup unavailable">
                <div class="quick-lookup-topline">
                    <span class="quick-lookup-brand">Quick Lookup</span>
                    <button class="quick-lookup-close" type="button" data-quick-close aria-label="Close quick lookup">×</button>
                </div>
                <div class="quick-lookup-empty">
                    <span class="quick-lookup-query">${escapeHtml(query)}</span>
                    <h2>Lookup unavailable</h2>
                    <p>Keep the dictionary open and check your connection, then try again.</p>
                </div>
            </section>`;
    }

    function createRequestId() {
        return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function lookupFromOpenDictionary(query, timeoutMs = 900) {
        if (!lookupChannel) return Promise.resolve(null);
        const requestId = createRequestId();

        return new Promise((resolve) => {
            const timeoutId = window.setTimeout(() => {
                lookupChannel.removeEventListener('message', handleResponse);
                resolve(null);
            }, timeoutMs);

            function handleResponse(event) {
                if (event.data?.type !== 'lookup-response' || event.data.requestId !== requestId) return;
                window.clearTimeout(timeoutId);
                lookupChannel.removeEventListener('message', handleResponse);
                resolve(event.data.payload || null);
            }

            lookupChannel.addEventListener('message', handleResponse);
            lookupChannel.postMessage({ type: 'lookup-request', requestId, query });
        });
    }

    async function performLookup(queryValue, { preferOpenDictionary = false } = {}) {
        const query = String(queryValue || '').normalize('NFC').trim().replace(/\s+/g, ' ');
        if (!query) return;
        activeQuery = query;
        renderLoading(query);

        try {
            const sharedResult = preferOpenDictionary ? await lookupFromOpenDictionary(query) : null;
            const payload = sharedResult || await api.lookup(query, { limit: 8 });
            renderLookupResult(payload);
        } catch (error) {
            console.error('Quick lookup failed:', error);
            renderLookupError(query);
        }
    }

    function openFullEntryInsideApp(query) {
        closeQuickLookup({ notifyParent: false });
        const splash = document.getElementById('appSplash');
        splash?.classList.add('hidden');
        splash?.setAttribute('aria-hidden', 'true');
        document.querySelector('[data-view="search"]')?.click();
        const searchInput = document.getElementById('searchBox');
        if (!searchInput) return;
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('searchButton')?.click();
        window.setTimeout(() => searchInput.focus(), 100);
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

    function handleCopy() {
        const selectedText = getSelectedText().normalize('NFC').trim().replace(/\s+/g, ' ');
        if (!selectedText || selectedText.length > 160) {
            lastCopiedText = '';
            lastCopyTime = 0;
            return;
        }

        const now = performance.now();
        const isDoubleCopy = selectedText === lastCopiedText && now - lastCopyTime <= 950;
        lastCopiedText = selectedText;
        lastCopyTime = now;
        if (isDoubleCopy) performLookup(selectedText);
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-quick-close]')) {
            closeQuickLookup();
            return;
        }

        const openLink = event.target.closest('[data-open-full-entry]');
        if (!openLink) return;
        if (isQuickDocument) {
            window.setTimeout(() => closeQuickLookup(), 0);
            return;
        }
        event.preventDefault();
        openFullEntryInsideApp(activeQuery);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !root.hidden) closeQuickLookup();
    });

    if (!isQuickDocument) {
        document.addEventListener('copy', handleCopy);
        document.addEventListener('pointerdown', (event) => {
            if (!root.hidden && !root.contains(event.target)) closeQuickLookup({ notifyParent: false });
        }, true);
    }

    if (lookupChannel && !isQuickDocument) {
        lookupChannel.addEventListener('message', async (event) => {
            if (event.data?.type !== 'lookup-request' || !event.data.requestId) return;
            try {
                const payload = await api.lookup(event.data.query, { limit: 8 });
                lookupChannel.postMessage({
                    type: 'lookup-response',
                    requestId: event.data.requestId,
                    payload
                });
            } catch (error) {
                lookupChannel.postMessage({
                    type: 'lookup-response',
                    requestId: event.data.requestId,
                    payload: null
                });
            }
        });
    }

    window.postMessage({
        type: 'DZONGKHA_DICTIONARY_APP_READY',
        dictionaryUrl: getDictionaryBaseUrl()
    }, window.location.origin === 'null' ? '*' : window.location.origin);

    if (isQuickDocument) {
        document.documentElement.classList.add('quick-lookup-document');
        performLookup(initialQuery, { preferOpenDictionary: true });
    } else if (initialQuery) {
        api.ensureReady().then(() => openFullEntryInsideApp(initialQuery)).catch(() => {});
    }
})();
