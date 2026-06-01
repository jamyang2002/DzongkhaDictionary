const enDzEntries = [
    {
        root: "mother",
        also: "mom, mama",
        type: "noun",
        plural: "mothers",
        verbalForm: "mothered",
        comparative: "more motherly",
        equivalent: "ཨ་མ་",
        source: "English → Dzongkha (common terms)"
    },
    {
        root: "father",
        also: "dad",
        type: "noun",
        plural: "fathers",
        verbalForm: "fathered",
        comparative: "more fatherly",
        equivalent: "ཕ་",
        source: "English → Dzongkha (family terms)"
    },
    {
        root: "hand",
        also: "palm",
        type: "noun",
        plural: "hands",
        verbalForm: "handed",
        comparative: "more handy",
        equivalent: "ལག་པ",
        source: "English → Dzongkha (body parts)"
    }
];

const dzEnEntries = [
    {
        root: "ཨ་མ་",
        type: "noun",
        tenses: "",
        short: "",
        also: "mother",
        syn: "",
        app: "",
        hon: "",
        equivalentTerm: "mother",
        source: "Dzongkha → English (family terms)"
    },
    {
        root: "ཕ་",
        type: "noun",
        tenses: "",
        short: "",
        also: "father",
        syn: "",
        app: "",
        hon: "",
        equivalentTerm: "father",
        source: "Dzongkha → English (family terms)"
    },
    {
        root: "ལག་པ",
        type: "noun",
        tenses: "",
        short: "",
        also: "hand",
        syn: "palm",
        app: "",
        hon: "",
        equivalentTerm: "hand",
        source: "Dzongkha → English (body parts)"
    }
];

const dzDzEntries = [];

const suggestions = document.getElementById('suggestions');
const resultElement = document.getElementById('result');
const inputElement = document.getElementById('searchBox');
const searchButton = document.getElementById('searchButton');
const directionButtons = document.querySelectorAll('[data-direction]');
const loadStatus = document.getElementById('loadStatus');
const autoDetectCheckbox = document.getElementById('autoDetect');
const themeToggle = document.getElementById('themeToggle');
const loadJsonButton = document.getElementById('loadJsonButton');
const jsonFileInput = document.getElementById('jsonFileInput');
const notificationBar = document.getElementById('notificationBar');
const wordOfDayEl = document.getElementById('wordOfDay');
const favoritesButton = document.getElementById('favoritesButton');
const favoritesPanel = document.getElementById('favoritesPanel');
const startLookupButton = document.getElementById('startLookupButton');
const welcomeThemeButton = document.getElementById('welcomeThemeButton');
const historyPanel = document.getElementById('historyPanel');
const notificationSummary = document.getElementById('notificationSummary');
const navLinks = document.querySelectorAll('.nav-link');
const screenPanels = document.querySelectorAll('[data-view-panel]');
const browseCards = document.querySelectorAll('[data-browse-direction]');
const browseTableTitle = document.getElementById('browseTableTitle');
const browseTableCount = document.getElementById('browseTableCount');
const browseTableWrap = document.getElementById('browseTableWrap');
const dictionaryCountEls = {
    dzEn: document.querySelectorAll('#homeDzEnCount, #lookupDzEnCount'),
    enDz: document.querySelectorAll('#homeEnDzCount, #lookupEnDzCount'),
    dzDz: document.querySelectorAll('#homeDzDzCount, #lookupDzDzCount'),
    browseDzEn: document.getElementById('browseDzEnCount'),
    browseEnDz: document.getElementById('browseEnDzCount'),
    browseDzDz: document.getElementById('browseDzDzCount')
};

function formatCount(count) {
    return count.toLocaleString();
}

function updateDictionaryCounts() {
    const dzEn = document.querySelectorAll('#homeDzEnCount, #splashDzEnCount');
    const enDz = document.querySelectorAll('#homeEnDzCount, #splashEnDzCount');
    const dzDz = document.querySelectorAll('#homeDzDzCount, #splashDzDzCount');

    dzEn.forEach(el => el.textContent = formatCount(dzEnEntries.length));
    enDz.forEach(el => el.textContent = formatCount(enDzEntries.length));
    dzDz.forEach(el => el.textContent = formatCount(dzDzEntries.length));

    if (dictionaryCountEls.browseDzEn) dictionaryCountEls.browseDzEn.textContent = `${formatCount(dzEnEntries.length)} entries`;
    if (dictionaryCountEls.browseEnDz) dictionaryCountEls.browseEnDz.textContent = `${formatCount(enDzEntries.length)} entries`;
    if (dictionaryCountEls.browseDzDz) dictionaryCountEls.browseDzDz.textContent = `${formatCount(dzDzEntries.length)} entries`;
}

function applyTheme(theme) {
    const themeLabel = themeToggle ? themeToggle.querySelector('[data-theme-label]') : null;
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            if (themeLabel) themeLabel.textContent = 'Light';
            themeToggle.setAttribute('aria-pressed', 'true');
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) {
            if (themeLabel) themeLabel.textContent = 'Dark';
            themeToggle.setAttribute('aria-pressed', 'false');
        }
    }
}

// initialize theme from localStorage
try {
    const saved = localStorage.getItem('dz_theme');
    if (saved === 'dark' || saved === 'light') applyTheme(saved);
} catch (e) {
    // ignore storage errors
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('dz_theme', next); } catch (e) {}
    });
}

if (welcomeThemeButton && themeToggle) {
    welcomeThemeButton.addEventListener('click', () => themeToggle.click());
}

if (startLookupButton && inputElement) {
    startLookupButton.addEventListener('click', () => {
        switchView('search');
        window.setTimeout(() => inputElement.focus(), 420);
    });
}

if (wordOfDayEl && inputElement) {
    wordOfDayEl.addEventListener('click', (event) => {
        const button = event.target.closest('[data-daily-word]');
        if (!button) return;
        switchView('search');
        inputElement.value = button.dataset.dailyWord || '';
        updateSuggestions();
        searchWord();
    });
}

navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        switchView(link.dataset.view || 'home');
    });
});

function switchView(viewName) {
    const topBar = document.querySelector('.app-topbar');
    if (topBar) {
        topBar.style.display = (viewName === 'home') ? 'flex' : 'none';
    }

    screenPanels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.viewPanel === viewName);
    });
    navLinks.forEach((item) => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    if (viewName === 'favorites') renderFavoritesPanel();
    if (viewName === 'history') renderHistoryPanel();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const LOCAL_EN_DZ_JSON = 'english_to_dzongkha.json';
const LOCAL_DZ_EN_JSON = 'dzongkha_to_english.json';
const LOCAL_DZ_DZ_JSON = 'dzongkha_to_dzongkha.json';
const LOCAL_DZ_DZ_COLLOQUIAL_JSON = 'colloquial_terminology.json';
const canFetchLocalJson = location.protocol === 'http:' || location.protocol === 'https:';

let direction = 'dz-en';
let currentEntries = dzEnEntries;

// Global indices for high-performance searching
let dzEnIndex = {};
let dzDzIndex = {};
let enDzIndex = {};

function inferDirectionFromFileName(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes('english_to_dzongkha') || lower.includes('en_dz') || lower.includes('english-to-dzongkha')) return 'en-dz';
    if (lower.includes('dzongkha_to_english') || lower.includes('dz_en') || lower.includes('dzongkha-to-english')) return 'dz-en';
    if (lower.includes('dzongkha_to_dzongkha') || lower.includes('dz_dz') || lower.includes('dzongkha-to-dzongkha')) return 'dz-dz';
    if (lower.includes('colloquial')) return 'dz-dz';
    return null;
}

function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(JSON.parse(reader.result));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, 'utf-8');
    });
}

async function fetchLocalJson(path) {
    try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.warn(`Local JSON ${path} did not contain an array.`);
            return null;
        }
        return data;
    } catch (error) {
        console.warn(`Could not load local JSON ${path}:`, error);
        return null;
    }
}

async function initializeLocalDictionaries() {
    const statusEl = document.getElementById('loadStatus');
    if (!canFetchLocalJson) {
        if (statusEl) statusEl.textContent = 'Browser security (file://) blocked auto-loading. Please use "Import JSON" or run a local server.';
        // Try to load from localStorage modifications even if fetch is blocked
        const localEnDz = JSON.parse(localStorage.getItem('dz_data_enDz') || '[]');
        const localDzEn = JSON.parse(localStorage.getItem('dz_data_dzEn') || '[]');
        const localDzDz = JSON.parse(localStorage.getItem('dz_data_dzDz') || '[]');
        
        if (localEnDz.length) loadDictionaryData(localEnDz, 'en-dz', 'Local Overrides');
        if (localDzEn.length) loadDictionaryData(localDzEn, 'dz-en', 'Local Overrides');
        if (localDzDz.length) loadDictionaryData(localDzDz, 'dz-dz', 'Local Overrides');

        if (localEnDz.length || localDzEn.length || localDzDz.length) {
            if (statusEl) statusEl.textContent = 'Loaded modified dictionary entries from browser storage.';
        }
        return;
    }

    if (statusEl) statusEl.textContent = 'Searching for local dictionary data...';

    const [enDzData, dzEnData, dzDzData, dzDzColloquialData] = await Promise.all([
        fetchLocalJson(LOCAL_EN_DZ_JSON),
        fetchLocalJson(LOCAL_DZ_EN_JSON),
        fetchLocalJson(LOCAL_DZ_DZ_JSON),
        fetchLocalJson(LOCAL_DZ_DZ_COLLOQUIAL_JSON)
    ]);

    if (enDzData) loadDictionaryData(enDzData, 'en-dz', LOCAL_EN_DZ_JSON);
    if (dzEnData) loadDictionaryData(dzEnData, 'dz-en', LOCAL_DZ_EN_JSON);
    if (dzDzData) loadDictionaryData(dzDzData, 'dz-dz', LOCAL_DZ_DZ_JSON);
    if (dzDzColloquialData) loadDictionaryData(dzDzColloquialData, 'dz-dz', LOCAL_DZ_DZ_COLLOQUIAL_JSON);

    // Merge with any manual edits from the Admin Panel
    const overrides = { enDz: 'en-dz', dzEn: 'dz-en', dzDz: 'dz-dz' };
    Object.entries(overrides).forEach(([key, direction]) => {
        const saved = JSON.parse(localStorage.getItem(`dz_data_${key}`) || '[]');
        if (saved.length) loadDictionaryData(saved, direction, 'Local Overrides');
    });

    const totalLoaded = (enDzData?.length || 0) + (dzEnData?.length || 0) + (dzDzData?.length || 0) + (dzDzColloquialData?.length || 0);
    
    if (statusEl) {
        statusEl.textContent = totalLoaded > 0 
            ? `Loaded ${formatCount(totalLoaded)} total entries from local files.` 
            : 'No local JSON files found. Dictionary is running with sample data only.';
    }

    updateDictionaryCounts();
    renderBrowseTable(direction);
    updateWordOfTheDay();
}

const fieldLabels = {
    enDz: [
        { key: 'root', label: 'Root word' },
        { key: 'also', label: 'Also' },
        { key: 'type', label: 'Type' },
        { key: 'plural', label: 'Plural' },
        { key: 'verbalForm', label: 'Verbal form' },
        { key: 'comparative', label: 'Comparative form' },
        { key: 'equivalent', label: 'Dzongkha translation' }
    ],
    dzEn: [
        { key: 'root', label: 'Root word' },
        { key: 'type', label: 'Type' },
        { key: 'tenses', label: 'Tenses' },
        { key: 'short', label: 'Short' },
        { key: 'also', label: 'Also' },
        { key: 'syn', label: 'Syn.' },
        { key: 'app', label: 'App.' },
        { key: 'hon', label: 'Hon.' },
        { key: 'equivalentTerm', label: 'English equivalent' }
    ],
    dzDz: [
        { key: 'root', label: 'Root word' },
        { key: 'meaning', label: 'Meaning' }
    ]
};

function normalizeEnglish(value) {
    return value.trim().toLowerCase();
}

function normalizeDzongkha(value) {
    return String(value)
        .trim()
        .replace(/[་།\s]+$/g, '');
}

// --- Favorites storage ---
function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('dz_favorites') || '[]'); } catch (e) { return []; }
}

function saveFavorites(list) { try { localStorage.setItem('dz_favorites', JSON.stringify(list)); } catch (e) {} }

function loadHistory() {
    try { return JSON.parse(localStorage.getItem('dz_search_history') || '[]'); } catch (e) { return []; }
}

function saveHistory(list) {
    try { localStorage.setItem('dz_search_history', JSON.stringify(list)); } catch (e) {}
}

function addSearchHistory(query, searchDirection) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    const label = searchDirection === 'en-dz' ? 'English → Dzongkha' : (searchDirection === 'dz-dz' ? 'Dzongkha → Dzongkha' : 'Dzongkha → English');
    const list = loadHistory().filter((item) => item.query !== cleanQuery);
    list.unshift({ query: cleanQuery, direction: searchDirection, label, savedAt: Date.now() });
    saveHistory(list.slice(0, 8));
    renderHistoryPanel();
}

function renderHistoryPanel() {
    if (!historyPanel) return;
    const list = loadHistory();
    if (!list.length) {
        historyPanel.innerHTML = '<div class="empty-state">No recent searches yet.</div>';
        return;
    }

    historyPanel.innerHTML = `
        <div class="panel-actions">
            <button id="clearHistory" class="load-json-button" type="button">Clear history</button>
        </div>
        ${list.map((item) => {
            const queryClass = /[\u0F00-\u0FFF]/.test(item.query) ? 'dzongkha-word' : 'english-word';
            return `
                <button class="history-item" type="button" data-history-query="${escapeHtml(item.query)}" data-history-direction="${escapeHtml(item.direction)}">
                    <span class="${queryClass}">${escapeHtml(item.query)}</span>
                    <small>${escapeHtml(item.label)}</small>
                </button>
            `;
        }).join('')}
    `;
}

function isFavorited(root) {
    const list = loadFavorites();
    return list.some((it) => it.root === root);
}

function toggleFavorite(entry) {
    const list = loadFavorites();
    const idx = list.findIndex((it) => it.root === entry.root);
    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.unshift({ root: entry.root, source: entry.source || 'local', savedAt: Date.now() });
    }
    saveFavorites(list);
    renderFavoritesPanel();
}

function renderFavoritesPanel() {
    const list = loadFavorites();
    if (!favoritesPanel) return;
    if (list.length === 0) {
        favoritesPanel.innerHTML = '<div class="empty-state">No favourites yet. Open a result and click the star to save words here.</div>';
        return;
    }
    favoritesPanel.innerHTML = `
        <div class="panel-actions">
            <button id="exportFavs" class="load-json-button">Export favourites</button>
            <button id="clearFavs" class="load-json-button">Clear all</button>
        </div>
        <div class="fav-list">${list.map((f) => `<div class="fav-item">${escapeHtml(f.root)} <button data-root="${escapeHtml(f.root)}" class="similar-link remove-fav">Remove</button></div>`).join('')}</div>
    `;

    const exportBtn = document.getElementById('exportFavs');
    if (exportBtn) exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'dzongkha_favorites.json';
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    const clearBtn = document.getElementById('clearFavs');
    if (clearBtn) clearBtn.addEventListener('click', () => { if (confirm('Clear all favorites?')) { saveFavorites([]); renderFavoritesPanel(); } });

    favoritesPanel.querySelectorAll('.remove-fav').forEach((b) => b.addEventListener('click', (e) => {
        const root = b.dataset.root; const l = loadFavorites(); const idx = l.findIndex(x=>x.root===root); if (idx>=0) { l.splice(idx,1); saveFavorites(l); renderFavoritesPanel(); }
    }));
}

if (favoritesButton) {
    favoritesButton.addEventListener('click', () => {
        switchView('favorites');
        renderFavoritesPanel();
    });
}

// --- Word of the Day ---
function updateWordOfTheDay() {
    try {
        const combined = [...dzDzEntries, ...dzEnEntries, ...enDzEntries].filter(Boolean);
        if (!combined.length || !wordOfDayEl) return;
        const days = Math.floor(Date.now() / 86400000);
        const idx = days % combined.length;
        const w = combined[idx];
        const root = w.root || 'རྫོང་ཁ།';
        const hasDz = /[\u0F00-\u0FFF]/.test(root);
        const rootClass = hasDz ? 'uchen-word' : 'english-word';
        const translation = w.equivalent || w.equivalentTerm || w.meaning || 'Dzongkha language';
        const translationClass = /[\u0F00-\u0FFF]/.test(translation) ? 'dzongkha-word' : 'english-word';
        const source = w.source || 'Bilingual Dictionary';
        wordOfDayEl.innerHTML = `
            <div class="daily-label">Word of the day</div>
            <div class="daily-word ${rootClass}">${escapeHtml(root)}</div>
            <div class="daily-translation ${translationClass}">${escapeHtml(translation)}</div>
            <div class="daily-meta">
                <span>Daily learning</span>
                <span>${escapeHtml(source)}</span>
            </div>
            <button class="daily-action" type="button" data-daily-word="${escapeHtml(root)}">Search this word</button>
        `;
    } catch (e) {}
}

// --- Notifications ---
function getNotifications() { try { return JSON.parse(localStorage.getItem('dz_notifications') || '[]'); } catch (e) { return []; } }
function saveNotifications(list) { try { localStorage.setItem('dz_notifications', JSON.stringify(list)); } catch (e) {} }
function showLatestNotification() {
    const list = getNotifications();
    if (!notificationBar) return;
    if (!list.length) { notificationBar.hidden = true; return; }
    const latest = list[list.length - 1];
    notificationBar.hidden = false;
    notificationBar.innerHTML = `<span>${escapeHtml(latest.message)}</span> <button id="dismissNotif" class="load-json-button" style="margin-left:12px">Dismiss</button>`;
    if (notificationSummary) {
        notificationSummary.textContent = latest.message;
    }
    const btn = document.getElementById('dismissNotif');
    if (btn) btn.addEventListener('click', () => { notificationBar.hidden = true; });
}

function loadDictionaryData(data, directionKey, fileName) {
    if (!Array.isArray(data)) {
        throw new Error('Imported file must contain a JSON array.');
    }

    const cleaned = data.map((entry) => {
        if (!entry.root) {
            throw new Error('Each entry must include a root property.');
        }
        const e = { ...entry };
        if (!e.source) e.source = fileName;
        return e;
    });

    if (directionKey === 'en-dz') {
        enDzEntries.length = 0;
        enDzEntries.push(...cleaned);
    } else if (directionKey === 'dz-dz') {
        dzDzEntries.push(...cleaned);
    } else {
        dzEnEntries.length = 0;
        dzEnEntries.push(...cleaned);
    }

    currentEntries = direction === 'dz-en' ? dzEnEntries : (direction === 'dz-dz' ? dzDzEntries : enDzEntries);
    
    // Pre-calculate indices for instant search results
    dzEnIndex = buildIndex(dzEnEntries, false);
    dzDzIndex = buildIndex(dzDzEntries, false);
    enDzIndex = buildIndex(enDzEntries, true);

    updateDictionaryCounts();
    renderBrowseTable(directionKey);

    try {
        if (autoDetectCheckbox && !autoDetectCheckbox.checked && direction !== directionKey) {
            setDirection(directionKey, true);
        }
    } catch (e) {}
}

if (loadJsonButton && jsonFileInput) {
    loadJsonButton.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                const data = await readJsonFile(file);
                const directionKey = inferDirectionFromFileName(file.name) || (Array.isArray(data) && data[0] && 'equivalentTerm' in data[0] ? 'dz-en' : 'dz-dz');
                loadDictionaryData(data, directionKey, file.name);
            } catch (error) {
                renderMessage(`Could not parse ${file.name}: ${error.message}`, true);
            }
        }
        jsonFileInput.value = '';
    });
}

function setDirection(newDirection, skipDefaultMessage = false) {
    direction = newDirection;
    currentEntries = direction === 'dz-en' ? dzEnEntries : (direction === 'dz-dz' ? dzDzEntries : enDzEntries);
    directionButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.direction === newDirection);
    });

    if (newDirection === 'dz-en') {
        inputElement.placeholder = 'Enter Dzongkha Word (e.g. རྫོང་ཁ།)';
    } else if (newDirection === 'dz-dz') {
        inputElement.placeholder = 'Enter a Dzongkha word for Dzongkha definitions';
    } else {
        inputElement.placeholder = 'Enter English word (e.g. mother)';
    }

    inputElement.value = '';
    suggestions.hidden = true;
    
    if (!skipDefaultMessage) {
        renderMessage('Search for a word to see its translation and term details.');
    }

    // Toggle search button font for Dzongkha vs English searches
    searchButton.classList.toggle('dzongkha-word', newDirection !== 'en-dz');
    searchButton.classList.toggle('english-word', newDirection === 'en-dz');
}

function renderMessage(message, isError = false) {
    const errorClass = isError ? 'error' : '';
    resultElement.innerHTML = `<div class="message ${errorClass}">${message}</div>`;
}

function renderClickableText(value, valueClass) {
    let text = String(value);
    text = text.replace(/\s+([.,;:!?।།])/g, '$1');
    const isDzongkha = valueClass.includes('dzongkha-word');
    const wordRegex = /([ༀ-࿿]+(?:[་།]+)?|[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)?)([.,;:!?।།]*)/g;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
        const [fullMatch, wordPart, punctuation] = match;
        result += escapeHtml(text.slice(lastIndex, match.index));

        if (isDzongkha && /[ༀ-࿿]/.test(wordPart)) {
            const rootValue = normalizeDzongkha(wordPart);
            result += `<button type="button" class="inline-link ${valueClass}" data-root="${rootValue}">${escapeHtml(wordPart)}</button>${escapeHtml(punctuation)}`;
        } else if (!isDzongkha && /[A-Za-z0-9]/.test(wordPart)) {
            const rootValue = normalizeEnglish(wordPart);
            result += `<button type="button" class="inline-link ${valueClass}" data-root="${rootValue}">${escapeHtml(wordPart)}</button>${escapeHtml(punctuation)}`;
        } else {
            result += escapeHtml(fullMatch);
        }

        lastIndex = match.index + fullMatch.length;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderCard(entry, entryType) {
    const source = entry.source || 'Unknown source';
    const fields = fieldLabels[entryType];
    const details = fields
        .filter((field) => entry[field.key] && entry[field.key].toString().trim().length > 0)
        .map((field) => {
            let valueClass = entryType === 'enDz' ? (field.key === 'equivalent' ? 'dzongkha-word' : 'english-word') : 'dzongkha-word';
            if (entryType === 'dzEn' && field.key === 'equivalentTerm') valueClass = 'english-word';
            if (entryType === 'dzDz') valueClass = 'dzongkha-word';

            const rawValue = entry[field.key];
            const clickableKeys = ['equivalent', 'equivalentTerm', 'also'];
            const rawDisplay = (clickableKeys.includes(field.key) || (field.key === 'meaning' && entryType !== 'dzDz'))
                ? renderClickableText(rawValue, valueClass)
                : `<span class="${valueClass}">${rawValue}</span>`;
            const displayValue = field.key === 'meaning'
                ? `<span class="meaning-text ${valueClass}">${rawDisplay}</span>`
                : rawDisplay;

            return `
            <div class="details-item">
                <strong>${field.label}</strong>
                <span>${displayValue}</span>
            </div>
        `;
        })
        .join('');

    const directionLabel = entryType === 'enDz' ? 'English → Dzongkha' : (entryType === 'dzEn' ? 'Dzongkha → English' : 'Dzongkha → Dzongkha');
    const mainWordClass = entryType === 'enDz' ? 'english-word' : 'uchen-word';
    const caption = entryType === 'enDz' ? (entry.equivalent || '') : (entryType === 'dzEn' ? (entry.equivalentTerm || '') : '');
    const captionClass = entryType === 'dzDz' ? 'dzongkha-word' : (entryType === 'enDz' ? 'dzongkha-word' : 'english-word');

    return `
        <section class="dictionary-entry">
            <h2 class="word ${mainWordClass}">${entry.root}
                <button type="button" class="audio-btn" data-root-audio="${entry.root}" title="Play English pronunciation">🔊</button>
                <button type="button" class="fav-btn ${isFavorited(entry.root)?'favorited':''}" data-root-fav="${entry.root}" title="Save favorite">☆</button>
            </h2>
            ${caption ? `<p class="translation-caption ${captionClass}">${caption}</p>` : ''}
            <div class="dictionary-details">
                ${details}
                <div class="details-item">
                    <strong>Dictionary direction</strong>
                    <span>${directionLabel}</span>
                </div>
                <div class="details-item">
                    <strong>Source</strong>
                    <span>${source}</span>
                </div>
            </div>
        </section>
    `;
}

function getBrowseConfig(directionKey) {
    if (directionKey === 'en-dz') {
        return {
            title: 'English → Dzongkha entries',
            entries: enDzEntries,
            type: 'enDz',
            columns: [
                { key: 'root', label: 'Root word', className: 'english-word' },
                { key: 'equivalent', label: 'Dzongkha translation', className: 'dzongkha-word wide' },
                { key: 'type', label: 'Type', className: 'english-word' },
                { key: 'also', label: 'Also', className: 'english-word' },
                { key: 'plural', label: 'Plural', className: 'english-word' },
                { key: 'verbalForm', label: 'Verbal form', className: 'english-word' },
                { key: 'comparative', label: 'Comparative', className: 'english-word' },
                { key: 'source', label: 'Source', className: 'english-word' }
            ]
        };
    }

    if (directionKey === 'dz-dz') {
        return {
            title: 'Dzongkha definition entries',
            entries: dzDzEntries,
            type: 'dzDz',
            columns: [
                { key: 'root', label: 'Root word', className: 'uchen-word' },
                { key: 'meaning', label: 'Meaning', className: 'dzongkha-word wide' },
                { key: 'source', label: 'Source', className: 'english-word' }
            ]
        };
    }

    return {
        title: 'Dzongkha → English entries',
        entries: dzEnEntries,
        type: 'dzEn',
            columns: [
                { key: 'root', label: 'Root word', className: 'uchen-word' },
                { key: 'equivalentTerm', label: 'English equivalent', className: 'english-word' },
                { key: 'type', label: 'Type', className: 'english-word' },
                { key: 'tenses', label: 'Tenses', className: 'dzongkha-word' },
                { key: 'short', label: 'Short', className: 'dzongkha-word' },
                { key: 'also', label: 'Also', className: 'english-word' },
                { key: 'syn', label: 'Syn.', className: 'dzongkha-word' },
                { key: 'app', label: 'App.', className: 'dzongkha-word' },
                { key: 'hon', label: 'Hon.', className: 'dzongkha-word' },
                { key: 'source', label: 'Source', className: 'english-word' }
            ]
    };
}

let browseTableState = {
    currentDirection: 'dz-en',
    sortKey: 'root',
    sortOrder: 'asc',
    filterText: '',
    displayRows: 50,
    currentPage: 1
};

function filterAndSortBrowseEntries(entries, config, filterText, sortKey, sortOrder) {
    let filtered = entries;
    if (filterText.trim()) {
        const searchTerm = filterText.toLowerCase();
        filtered = entries.filter((entry) => {
            return config.columns.some((col) => {
                const value = entry[col.key] || '';
                return value.toString().toLowerCase().includes(searchTerm);
            });
        });
    }

    // Sort entries
    const sorted = [...filtered].sort((a, b) => {
        const aVal = (a[sortKey] || '').toString();
        const bVal = (b[sortKey] || '').toString();
        const comparison = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

function renderBrowseTableHeader(config, sortKey, sortOrder) {
    return config.columns.map((column) => {
        const isSorted = sortKey === column.key;
        const icon = isSorted ? (sortOrder === 'asc' ? '↑' : '↓') : '';
        return `<th scope="col" class="browse-header ${isSorted ? 'sorted' : 'sortable'}" data-sort-key="${column.key}">${escapeHtml(column.label)} <span class="sort-icon">${icon}</span></th>`;
    }).join('');
}

function renderBrowseTable(directionKey = 'dz-en') {
    if (!browseTableWrap) return;
    const config = getBrowseConfig(directionKey);
    const rows = config.entries || [];

    browseTableState.currentDirection = directionKey;
    browseTableState.sortKey = 'root';
    browseTableState.sortOrder = 'asc';
    browseTableState.filterText = '';
    browseTableState.currentPage = 1;

    if (browseTableTitle) browseTableTitle.textContent = config.title;
    if (browseTableCount) browseTableCount.textContent = `${formatCount(rows.length)} entries`;

    if (!rows.length) {
        browseTableWrap.innerHTML = '<div class="notice">No entries loaded for this collection yet.</div>';
        return;
    }

    // Create table toolbar with search and controls
    const toolbar = document.createElement('div');
    toolbar.className = 'browse-table-search-bar';
    toolbar.innerHTML = `
        <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 19.1-4.6-4.6a7 7 0 1 0-1.4 1.4l4.6 4.6 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"/></svg>
            <input type="text" class="browse-table-search" placeholder="Filter entries..." aria-label="Filter dictionary entries">
        </div>
        <div class="browse-table-info">
            <span class="browse-results-count">Showing <strong>0</strong> of <strong>${formatCount(rows.length)}</strong> entries</span>
        </div>
    `;
    browseTableWrap.innerHTML = '';
    browseTableWrap.appendChild(toolbar);

    // Create scrollable table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'browse-table-container';

    const table = document.createElement('table');
    table.className = 'dictionary-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = renderBrowseTableHeader(config, 'root', 'asc');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'browse-table-body';
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    browseTableWrap.appendChild(tableContainer);

    // Render initial rows
    renderBrowseTableRows(config, rows, tbody, browseTableWrap);

    // Add event listeners
    const searchInput = browseTableWrap.querySelector('.browse-table-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            browseTableState.filterText = e.target.value;
            browseTableState.currentPage = 1;
            renderBrowseTableRows(config, rows, tbody, browseTableWrap);
        });
    }

    // Add header click listeners for sorting
    const headers = thead.querySelectorAll('.browse-header');
    headers.forEach((header) => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            if (browseTableState.sortKey === sortKey) {
                browseTableState.sortOrder = browseTableState.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                browseTableState.sortKey = sortKey;
                browseTableState.sortOrder = 'asc';
            }
            browseTableState.currentPage = 1;
            // Update header display
            headers.forEach((h) => {
                h.classList.remove('sorted');
                h.classList.add('sortable');
                h.querySelector('.sort-icon').textContent = '';
            });
            header.classList.remove('sortable');
            header.classList.add('sorted');
            header.querySelector('.sort-icon').textContent = browseTableState.sortOrder === 'asc' ? '↑' : '↓';
            renderBrowseTableRows(config, rows, tbody, browseTableWrap);
        });
    });
}

function renderBrowseTableRows(config, allRows, tbody, browseTableWrap) {
    const filtered = filterAndSortBrowseEntries(
        allRows,
        config,
        browseTableState.filterText,
        browseTableState.sortKey,
        browseTableState.sortOrder
    );

    // Update result count
    const countSpan = browseTableWrap.querySelector('.browse-results-count');
    if (countSpan) {
        const resultCount = filtered.length;
        countSpan.innerHTML = `Showing <strong>${formatCount(resultCount)}</strong> of <strong>${formatCount(allRows.length)}</strong> entries`;
    }

    tbody.innerHTML = filtered.map((entry) => `
        <tr class="browse-table-row" data-browse-row="${escapeHtml(entry.root || '')}" data-browse-type="${config.type}">
            ${config.columns.map((column) => {
                const value = entry[column.key] || '';
                return `<td class="${column.className || ''}">${escapeHtml(value)}</td>`;
            }).join('')}
        </tr>
    `).join('');

    // Add row click listeners
    const rows = tbody.querySelectorAll('.browse-table-row');
    rows.forEach((row) => {
        row.addEventListener('click', () => {
            const root = row.dataset.browseRow;
            if (root && inputElement) {
                switchView('search');
                inputElement.value = root;
                window.setTimeout(() => searchWord(), 100);
            }
        });
    });
}

function renderEntry(entry, entryType) {
    resultElement.innerHTML = renderCard(entry, entryType);
}

function buildIndex(entries, isEnglish = false) {
    return entries.reduce((map, entry) => {
        if (!entry.root) return map;
        const raw = entry.root.trim();
        const key = isEnglish ? normalizeEnglish(raw) : normalizeDzongkha(raw);
        map[key] = entry;
        if (!isEnglish) {
            map[raw] = entry;
        }
        if (isEnglish) {
            const norm = normalizeEnglish(entry.root);
            map[norm] = entry;
        }
        return map;
    }, {});
}

function searchWord() {
    const query = inputElement.value.trim();
    if (!query) {
        renderMessage('Please enter a word to search.', true);
        scrollToResults();
        return;
    }
    addSearchHistory(query, direction);

    const hasDz = /[\u0F00-\u0FFF]/.test(query);
    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);

    if (hasDz) {
        const dzEnEntry = dzEnIndex[normalizedQuery] || dzEnIndex[query];
        const dzDzEntry = dzDzIndex[normalizedQuery] || dzDzIndex[query];

        if (dzEnEntry && dzDzEntry) {
            resultElement.innerHTML = renderCard(dzEnEntry, 'dzEn') + renderCard(dzDzEntry, 'dzDz');
            const similar = renderSimilar(query, 'dz-en');
            if (similar) resultElement.appendChild(similar);
            scrollToResults();
            return;
        }

        if (dzEnEntry) {
            renderEntry(dzEnEntry, 'dzEn');
            const similar = renderSimilar(query, 'dz-en');
            if (similar) resultElement.appendChild(similar);
            scrollToResults();
            return;
        }

        if (dzDzEntry) {
            renderEntry(dzDzEntry, 'dzDz');
            const similar = renderSimilar(query, 'dz-dz');
            if (similar) resultElement.appendChild(similar);
            scrollToResults();
            return;
        }

        renderMessage(`No Dzongkha entry found for “${query}”. Try a different spelling or check the source data.`, true);
        scrollToResults();
        return;
    }

    const enDzEntry = enDzIndex[normalizedQuery] || enDzIndex[query];
    if (enDzEntry) {
        renderEntry(enDzEntry, 'enDz');
        const similar = renderSimilar(query, 'en-dz');
        if (similar) resultElement.appendChild(similar);
        scrollToResults();
        return;
    }

    renderMessage(`No entry found for “${query}”. Try a different spelling or check the source data.`, true);
    scrollToResults();
}

/**
 * Smoothly scrolls to the results area on mobile devices
 */
function scrollToResults() {
    if (window.innerWidth <= 1040) {
        const resultsArea = document.querySelector('.results-area');
        if (resultsArea) {
            const offset = 72; // Account for the sticky top bar
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = resultsArea.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
}

function updateSuggestions() {
    const query = inputElement.value.trim();
    if (!query) {
        suggestions.hidden = true;
        return;
    }

    // Toggle input/search button font dynamically when the user types Dzongkha
    const hasDz = /[\u0F00-\u0FFF]/.test(query);
    inputElement.classList.toggle('dzongkha-word', hasDz);
    inputElement.classList.toggle('english-word', !hasDz);
    searchButton.classList.toggle('dzongkha-word', hasDz);
    searchButton.classList.toggle('english-word', !hasDz);

    const sourceList = hasDz ? [...dzEnEntries, ...dzDzEntries] : enDzEntries;
    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);
    const matches = sourceList.filter((entry) => {
        const key = hasDz ? normalizeDzongkha(entry.root) : normalizeEnglish(entry.root);
        return key.includes(normalizedQuery);
    }).slice(0, 8);

    if (matches.length === 0) {
        suggestions.hidden = true;
        return;
    }

    suggestions.hidden = false;
    suggestions.innerHTML = matches.map((entry) => {
        const label = entry.root;
        const display = hasDz ? `<span class="dzongkha-word">${label}</span>` : `<span class="english-word">${label}</span>`;
        return `<button type="button" class="suggestion-item" data-value="${label}">${display}</button>`;
    }).join('');
}

function handleSuggestionClick(event) {
    const button = event.target.closest('.suggestion-item');
    if (!button) return;
    inputElement.value = button.dataset.value;
    suggestions.hidden = true;
    searchWord();
}

// Handle clicks on inline links inside result cards (equivalent/meaning)
resultElement.addEventListener('click', (e) => {
    const btn = e.target.closest('.inline-link');
    if (!btn) return;
    const val = btn.dataset.root;
    if (!val) return;
    const hasDz = /[\u0F00-\u0FFF]/.test(val);
    suggestions.hidden = true;
    try {
        const previousValue = inputElement.value;
        if (hasDz) setDirection('dz-en');
        else setDirection('en-dz');
        inputElement.value = val;
    } catch (e) {
        inputElement.value = val;
    }
    searchWord();
});

// Handle audio and favorite clicks
resultElement.addEventListener('click', (e) => {
    const audioBtn = e.target.closest('.audio-btn');
    if (audioBtn) {
        const root = audioBtn.dataset.rootAudio;
        if (!root) return;
        // Only support English pronunciation for now
        if (/^[A-Za-z0-9\s'’-]+$/.test(root)) {
            const u = new SpeechSynthesisUtterance(root);
            u.lang = 'en-US';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        } else {
            renderMessage('Dzongkha pronunciation coming soon.', false);
        }
        return;
    }

    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
        const root = favBtn.dataset.rootFav;
        if (!root) return;
        // Try to find entry object
        const entry = [...dzDzEntries, ...dzEnEntries, ...enDzEntries].find((it) => it.root === root) || { root };
        toggleFavorite(entry);
        favBtn.classList.toggle('favorited', isFavorited(root));
        return;
    }
});

function renderSimilar(query, effectiveDirection) {
    const container = document.createElement('div');
    container.className = 'similar-container';
    const heading = document.createElement('h3');
    heading.textContent = 'Suggested words';
    heading.className = 'similar-heading';
    container.appendChild(heading);

    const hasDz = /[\u0F00-\u0FFF]/.test(query);
    const sourceList = hasDz ? [...dzEnEntries, ...dzDzEntries] : enDzEntries;
    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);
    const matches = sourceList.filter((entry) => {
        const key = hasDz ? normalizeDzongkha(entry.root) : normalizeEnglish(entry.root);
        return key !== normalizedQuery && key.includes(normalizedQuery);
    }).slice(0, 8);

    if (matches.length === 0) return null;

    const list = document.createElement('div');
    list.className = 'similar-list';

    matches.forEach((m) => {
        const link = document.createElement('a');
        link.href = 'javascript:void(0)';
        link.className = 'similar-link';
        if (hasDz) link.classList.add('dzongkha-word');
        link.dataset.value = m.root;
        link.textContent = m.root;
        link.addEventListener('click', () => {
            inputElement.value = m.root;
            searchWord();
        });
        list.appendChild(link);
    });

    container.appendChild(list);
    return container;
}

searchButton.addEventListener('click', searchWord);
inputElement.addEventListener('input', updateSuggestions);
inputElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchWord();
    }
});

// Handle Splash Screen Actions
const splashOverlay = document.getElementById('appSplash');
const splashStartBtn = document.getElementById('splashStartBtn');
const splashThemeBtn = document.getElementById('splashThemeBtn');

if (splashStartBtn) {
    splashStartBtn.addEventListener('click', () => {
        splashOverlay.classList.add('hidden');
        switchView('search');
        if (inputElement) window.setTimeout(() => inputElement.focus(), 420);
    });
}

if (splashThemeBtn) {
    splashThemeBtn.addEventListener('click', () => {
        if (themeToggle) themeToggle.click();
    });
}

suggestions.addEventListener('click', handleSuggestionClick);

directionButtons.forEach((button) => {
    button.addEventListener('click', () => setDirection(button.dataset.direction));
});

browseCards.forEach((card) => {
    card.addEventListener('click', () => {
        const nextDirection = card.dataset.browseDirection || 'dz-en';
        setDirection(nextDirection);
        renderBrowseTable(nextDirection);
        if (browseTableWrap) {
            browseTableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

if (browseTableWrap) {
    browseTableWrap.addEventListener('click', (event) => {
        const row = event.target.closest('[data-browse-row]');
        if (!row) return;
        const root = row.dataset.browseRow || '';
        if (!root) return;
        inputElement.value = root;
        searchWord();
        switchView('search');
    });
}

if (historyPanel) {
    historyPanel.addEventListener('click', (event) => {
        const clearButton = event.target.closest('#clearHistory');
        if (clearButton) {
            saveHistory([]);
            renderHistoryPanel();
            return;
        }

        const button = event.target.closest('.history-item');
        if (!button) return;
        setDirection(button.dataset.historyDirection || 'dz-en');
        inputElement.value = button.dataset.historyQuery || '';
        searchWord();
    });
}

setDirection(direction, true);
updateDictionaryCounts();
renderBrowseTable(direction);
initializeLocalDictionaries();
updateWordOfTheDay();
showLatestNotification();
renderHistoryPanel();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed', err));
    });
}
