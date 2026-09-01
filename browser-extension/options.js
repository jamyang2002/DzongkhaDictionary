(() => {
    'use strict';

    const form = document.getElementById('settingsForm');
    const input = document.getElementById('dictionaryUrl');
    const status = document.getElementById('status');

    function normalizeUrl(value) {
        const url = new URL(value);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            throw new Error('Use an http:// or https:// address.');
        }
        url.hash = '';
        url.search = '';
        if (url.pathname.endsWith('/index.html')) {
            url.pathname = url.pathname.slice(0, -'index.html'.length);
        }
        if (!url.pathname.endsWith('/')) url.pathname += '/';
        return url.href;
    }

    chrome.storage.local.get('dictionaryUrl', (stored) => {
        if (stored?.dictionaryUrl) input.value = stored.dictionaryUrl;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
            const dictionaryUrl = normalizeUrl(input.value.trim());
            chrome.storage.local.set({ dictionaryUrl }, () => {
                if (chrome.runtime.lastError) {
                    status.textContent = 'The address could not be saved.';
                    return;
                }
                input.value = dictionaryUrl;
                status.textContent = 'Dictionary address saved.';
            });
        } catch (error) {
            status.textContent = error.message || 'Enter a valid dictionary address.';
        }
    });
})();
