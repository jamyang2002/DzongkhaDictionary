(() => {
    'use strict';

    const api = window.DzongkhaDictionary;
    const isTauri = Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__?.core?.invoke);
    if (!api?.lookup || api.isQuickLookupMode || isTauri) return;

    const MAX_QUERY_LENGTH = 160;
    const trigger = document.createElement('button');
    const overlay = document.createElement('div');
    let activeQuery = '';
    let lastFocusedElement = null;
    let interactionId = 0;

    trigger.id = 'pwaQuickLookupTrigger';
    trigger.className = 'pwa-quick-lookup-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'pwaQuickLookupOverlay');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span aria-hidden="true">⚡🔍</span><span>Quick Lookup</span>';

    overlay.id = 'pwaQuickLookupOverlay';
    overlay.className = 'pwa-quick-lookup-overlay';
    overlay.hidden = true;
    document.body.append(trigger, overlay);

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cleanQuery(value) {
        return String(value || '')
            .normalize('NFC')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/gu, ' ')
            .trim();
    }

    function closeLookup() {
        if (overlay.hidden) return;
        interactionId += 1;
        overlay.hidden = true;
        overlay.innerHTML = '';
        activeQuery = '';
        trigger.setAttribute('aria-expanded', 'false');
        lastFocusedElement?.focus?.({ preventScroll: true });
    }

    function renderDialog(content, label = 'Quick Lookup') {
        overlay.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        overlay.innerHTML = `
            <section class="pwa-quick-lookup-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}">
                <header class="pwa-quick-lookup-header">
                    <span><span aria-hidden="true">⚡</span> Quick Lookup</span>
                    <button type="button" class="pwa-quick-lookup-close" data-pwa-quick-close aria-label="Close Quick Lookup">×</button>
                </header>
                ${content}
            </section>`;
    }

    function renderLoading(message = 'Reading your clipboard…') {
        renderDialog(`
            <div class="pwa-quick-lookup-loading" role="status">
                <span class="pwa-quick-lookup-spinner" aria-hidden="true"></span>
                <span>${escapeHtml(message)}</span>
            </div>`);
    }

    function renderFallback(message) {
        renderDialog(`
            <div class="pwa-quick-lookup-fallback">
                <strong>Paste a word to look it up</strong>
                <p>${escapeHtml(message)}</p>
                <form data-pwa-quick-form>
                    <label class="visually-hidden" for="pwaQuickLookupInput">Dzongkha or English word</label>
                    <div class="pwa-quick-lookup-input-row">
                        <input id="pwaQuickLookupInput" name="pwaQuickLookupInput" type="text" inputmode="text" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="${MAX_QUERY_LENGTH}" placeholder="Paste or type a word">
                        <button type="submit">Look up</button>
                    </div>
                </form>
                <span class="pwa-quick-lookup-fallback-hint">Pasting starts the lookup automatically.</span>
            </div>`, 'Quick Lookup clipboard fallback');
        window.setTimeout(() => document.getElementById('pwaQuickLookupInput')?.focus(), 60);
    }

    function renderResultItem(result, index, query) {
        const headwordClass = result.headwordHasDzongkha ? 'dzongkha-word' : 'english-word';
        const definitionClass = result.definitionHasDzongkha ? 'dzongkha-word' : 'english-word';
        const headword = result.headword || query;

        return `
            <article class="pwa-quick-lookup-result" role="listitem">
                <div class="pwa-quick-lookup-heading">
                    <div>
                        <span>${escapeHtml(result.direction || 'Dictionary')}</span>
                        <h2 ${index === 0 ? 'id="pwaQuickLookupResultTitle"' : ''} class="${headwordClass}">${escapeHtml(headword)}</h2>
                    </div>
                    ${result.type ? `<em>${escapeHtml(result.type)}</em>` : ''}
                </div>
                <div class="pwa-quick-lookup-detail">
                    <span>Definition</span>
                    <p class="${definitionClass}">${escapeHtml(result.definition || 'Definition unavailable.')}</p>
                </div>
                ${result.source ? `<div class="pwa-quick-lookup-source"><span>Source</span><strong>${escapeHtml(result.source)}</strong></div>` : ''}
            </article>`;
    }

    function renderResult(payload) {
        const results = Array.isArray(payload.results) ? payload.results : [];
        const primary = results[0];
        const query = payload.query || activeQuery;

        if (!primary) {
            renderDialog(`
                <div class="pwa-quick-lookup-empty">
                    <span class="pwa-quick-lookup-query">${escapeHtml(query)}</span>
                    <h2>No entry found</h2>
                    <p>Try a different spelling or open the full dictionary search.</p>
                    <button type="button" class="pwa-quick-lookup-primary" data-pwa-open-full>Open Full Search</button>
                </div>`, `No Quick Lookup result for ${query}`);
            return;
        }

        const canPronounce = payload.language === 'english' && typeof api.playPronunciation === 'function';
        const resultCount = Number(payload.resultCount) || results.length;
        const countLabel = `${resultCount.toLocaleString()} matching ${resultCount === 1 ? 'entry' : 'entries'}`;

        renderDialog(`
            <div class="pwa-quick-lookup-result-summary">
                <span>Matches for “${escapeHtml(query)}”</span>
                <strong>${escapeHtml(countLabel)}</strong>
            </div>
            ${canPronounce ? `
                <div class="pwa-quick-lookup-pronunciation" data-pronunciation>
                    <button type="button" data-pwa-pronounce data-root="${escapeHtml(primary.headword || query)}" aria-label="Play pronunciation of ${escapeHtml(primary.headword || query)}">🔊 Pronounce</button>
                    <span data-pronunciation-status aria-live="polite"></span>
                </div>` : ''}
            <div class="pwa-quick-lookup-results" role="list" aria-label="${escapeHtml(countLabel)}" tabindex="0">
                ${results.map((result, index) => renderResultItem(result, index, query)).join('')}
            </div>
            <button type="button" class="pwa-quick-lookup-primary" data-pwa-open-full>Open Full Entry <span aria-hidden="true">→</span></button>
        `, `Quick Lookup result for ${primary.headword || query}`);
    }

    async function lookup(queryValue) {
        const query = cleanQuery(queryValue);
        if (!query) {
            renderFallback('The clipboard is empty or unavailable on this browser.');
            return;
        }
        if (query.length > MAX_QUERY_LENGTH) {
            renderFallback('Copy one word or a short term, then try again.');
            return;
        }

        activeQuery = query;
        const requestId = ++interactionId;
        renderLoading(`Looking up “${query}”…`);
        try {
            const payload = await api.lookup(query, { all: true, balanced: true });
            if (requestId === interactionId) renderResult(payload);
        } catch (error) {
            if (requestId !== interactionId) return;
            console.error('PWA Quick Lookup failed:', error);
            renderFallback('The dictionaries could not be loaded. Paste the word below to retry.');
        }
    }

    async function readClipboardAndLookup() {
        lastFocusedElement = document.activeElement;
        const requestId = ++interactionId;
        renderLoading();

        if (!window.isSecureContext || typeof navigator.clipboard?.readText !== 'function') {
            renderFallback('Clipboard reading is not supported here.');
            return;
        }

        try {
            const clipboardText = await navigator.clipboard.readText();
            if (requestId === interactionId) await lookup(clipboardText);
        } catch (error) {
            if (requestId === interactionId) renderFallback('Your browser blocked clipboard access.');
        }
    }

    function openFullEntry() {
        const query = activeQuery;
        closeLookup();
        document.getElementById('appSplash')?.classList.add('hidden');
        document.getElementById('appSplash')?.setAttribute('aria-hidden', 'true');
        document.querySelector('[data-view="search"]')?.click();
        const searchInput = document.getElementById('searchBox');
        if (!searchInput || !query) return;
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('searchButton')?.click();
    }

    trigger.addEventListener('click', readClipboardAndLookup);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('[data-pwa-quick-close]')) {
            closeLookup();
            return;
        }
        if (event.target.closest('[data-pwa-open-full]')) {
            openFullEntry();
            return;
        }
        const pronunciationButton = event.target.closest('[data-pwa-pronounce]');
        if (pronunciationButton) {
            api.playPronunciation(pronunciationButton.dataset.root, 'en-US', pronunciationButton);
        }
    });

    overlay.addEventListener('submit', (event) => {
        if (!event.target.matches('[data-pwa-quick-form]')) return;
        event.preventDefault();
        lookup(event.target.elements.pwaQuickLookupInput?.value);
    });

    overlay.addEventListener('paste', (event) => {
        const input = event.target.closest('#pwaQuickLookupInput');
        if (!input) return;
        window.setTimeout(() => lookup(input.value), 0);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !overlay.hidden) closeLookup();
    });
})();
