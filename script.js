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
const tenseEntries = [];

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
    browseDzDz: document.getElementById('browseDzDzCount'),
    browseTenses: document.getElementById('browseTensesCount')
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
    if (dictionaryCountEls.browseTenses) dictionaryCountEls.browseTenses.textContent = `${formatCount(tenseEntries.length)} entries`;
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
    if (viewName === 'notification') {
        markNotificationsAsRead();
        renderNotificationSection();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const LOCAL_EN_DZ_JSON = 'english_to_dzongkha.json';
const LOCAL_COLLECTED_TERMINOLOGY_JSON = 'collected_terminology.json';
const LOCAL_COUNTRIES_JSON = 'countries_capitals.json';
const LOCAL_DZ_EN_JSON = 'dzongkha_to_english.json';
const LOCAL_DZ_DZ_JSON = 'dzongkha_to_dzongkha.json';
const LOCAL_DZ_DZ_COLLOQUIAL_JSON = 'colloquial_terminology.json';
const LOCAL_TENSE_JSON = 'final_tense.json';
const LOCAL_PUBLIC_SERVICE_JSON = 'public_service.json';
const LOCAL_PLACE_NAMES_JSON = 'place_names.json';

let direction = 'dz-en';
let currentEntries = dzEnEntries;

// Global indices for high-performance searching
let dzEnIndex = {};
let dzDzIndex = {};
let enDzIndex = {};
let countriesIndex = {};
let publicServiceIndex = {};
let placeNamesIndex = {};
let tenseIndex = {};
let countryEntries = [];
let publicServiceEntries = [];
let placeNamesEntries = [];
let isBulkLoadingDictionaries = false;

function inferDirectionFromFileName(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes('english_to_dzongkha') || lower.includes('en_dz') || lower.includes('english-to-dzongkha')) return 'en-dz';
    if (lower.includes('dzongkha_to_english') || lower.includes('dz_en') || lower.includes('dzongkha-to-english')) return 'dz-en';
    if (lower.includes('dzongkha_to_dzongkha') || lower.includes('dz_dz') || lower.includes('dzongkha-to-dzongkha')) return 'dz-dz';
    if (lower.includes('countries') || lower.includes('country') || lower.includes('capital')) return 'countries';
    if (lower.includes('places') || lower.includes('place') || lower.includes('dzongkhag') || lower.includes('gewog') || lower.includes('chiwog')) return 'place-names';
    if (lower.includes('public service') || lower.includes('public_service') || lower.includes('public-service')) return 'public-service';
    if (lower.includes('tense')) return 'tense';
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

function normalizeJsonArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        const candidates = ['data', 'entries', 'records', 'items', 'words'];
        for (const key of candidates) {
            if (Array.isArray(data[key])) return data[key];
        }
        for (const value of Object.values(data)) {
            if (Array.isArray(value)) return value;
        }
    }
    return null;
}

function fetchLocalJsonWithXHR(path) {
    return new Promise((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.timeout = 8000;
        request.overrideMimeType('application/json');
        request.onload = () => {
            if (request.status === 200 || request.status === 0) {
                try {
                    const data = JSON.parse(request.responseText);
                    const normalized = normalizeJsonArray(data);
                    if (normalized) {
                        resolve(normalized);
                        return;
                    }
                    console.warn(`Local JSON ${path} did not contain an array.`);
                } catch (error) {
                    console.warn(`Could not parse local JSON ${path}:`, error);
                }
            }
            resolve(null);
        };
        request.onerror = () => resolve(null);
        request.ontimeout = () => resolve(null);
        request.send();
    });
}

async function fetchLocalJson(path) {
    const candidates = [path];
    if (!path.startsWith('./') && !path.startsWith('/') && !path.match(/^https?:\/\//i)) {
        candidates.push(`./${path}`);
    }

    // Try XHR first because local file loading can be blocked for fetch in some browsers.
    for (const candidate of candidates) {
        const xhrData = await fetchLocalJsonWithXHR(candidate);
        if (xhrData) return xhrData;
    }

    for (const candidate of candidates) {
        try {
            const response = await fetch(candidate, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                const normalized = normalizeJsonArray(data);
                if (normalized) return normalized;
                console.warn(`Local JSON ${candidate} did not contain an array.`);
            }
        } catch (error) {
            console.warn(`Could not load local JSON ${candidate} with fetch:`, error);
        }
    }

    return null;
}

function withTimeout(promise, timeoutMs, fallback = null) {
    let timeoutId;
    const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function loadLocalDataset(path) {
    return withTimeout(fetchLocalJson(path), 10000, null);
}

async function initializeLocalDictionaries() {
    const statusEl = document.getElementById('loadStatus');

    const [enDzData, collectedData, countriesData, publicServiceData, placeNamesData, dzEnData, dzDzData, dzDzColloquialData, tenseData] = await Promise.all([
        loadLocalDataset(LOCAL_EN_DZ_JSON),
        loadLocalDataset(LOCAL_COLLECTED_TERMINOLOGY_JSON),
        loadLocalDataset(LOCAL_COUNTRIES_JSON),
        loadLocalDataset(LOCAL_PUBLIC_SERVICE_JSON),
        loadLocalDataset(LOCAL_PLACE_NAMES_JSON),
        loadLocalDataset(LOCAL_DZ_EN_JSON),
        loadLocalDataset(LOCAL_DZ_DZ_JSON),
        loadLocalDataset(LOCAL_DZ_DZ_COLLOQUIAL_JSON),
        loadLocalDataset(LOCAL_TENSE_JSON)
    ]);

    const totalLoaded = (enDzData?.length || 0) + (collectedData?.length || 0) + (countriesData?.length || 0) + (publicServiceData?.length || 0) + (placeNamesData?.length || 0) + (dzEnData?.length || 0) + (dzDzData?.length || 0) + (dzDzColloquialData?.length || 0) + (tenseData?.length || 0);

    if (totalLoaded > 0) {
        enDzEntries.length = 0;
        dzEnEntries.length = 0;
        dzDzEntries.length = 0;
        tenseEntries.length = 0;
    }

    isBulkLoadingDictionaries = true;
    if (enDzData) loadDictionaryData(enDzData, 'en-dz', LOCAL_EN_DZ_JSON);
    if (collectedData) loadDictionaryData(collectedData, 'en-dz', LOCAL_COLLECTED_TERMINOLOGY_JSON);
    if (countriesData) loadDictionaryData(countriesData, 'countries', LOCAL_COUNTRIES_JSON);
    if (publicServiceData) loadDictionaryData(publicServiceData, 'public-service', LOCAL_PUBLIC_SERVICE_JSON);
    if (placeNamesData) loadDictionaryData(placeNamesData, 'place-names', LOCAL_PLACE_NAMES_JSON);
    if (dzEnData) loadDictionaryData(dzEnData, 'dz-en', LOCAL_DZ_EN_JSON);
    if (dzDzData) loadDictionaryData(dzDzData, 'dz-dz', LOCAL_DZ_DZ_JSON);
    if (dzDzColloquialData) loadDictionaryData(dzDzColloquialData, 'dz-dz', LOCAL_DZ_DZ_COLLOQUIAL_JSON);
    if (tenseData) loadDictionaryData(tenseData, 'tense', LOCAL_TENSE_JSON);

    // Merge with any manual edits from the Admin Panel
    const overrides = { enDz: 'en-dz', dzEn: 'dz-en', dzDz: 'dz-dz', tenses: 'tense' };
    Object.entries(overrides).forEach(([key, savedDirection]) => {
        const saved = readSavedEntries(key);
        if (saved.length) loadDictionaryData(saved, savedDirection, 'Local Overrides');
    });
    isBulkLoadingDictionaries = false;
    rebuildSearchIndices();
    currentEntries = getEntriesForDirection(direction);

    if (statusEl) {
        statusEl.style.display = 'none';
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
    countries: [
        { key: 'root', label: 'Country' },
        { key: 'countryDz', label: 'Country (Dzongkha)' },
        { key: 'equivalent', label: 'Capital' },
        { key: 'capitalDz', label: 'Capital (Dzongkha)' }
    ],
    publicService: [
        { key: 'root', label: 'English term' },
        { key: 'equivalent', label: 'Dzongkha translation' }
    ],
    placeNames: [
        { key: 'root', label: 'Village (Standardized)' },
        { key: 'equivalent', label: 'Village (Dzongkha)' },
        { key: 'chiwog', label: 'Chiwog (Standardized)' },
        { key: 'chiwogDz', label: 'Chiwog (Dzongkha)' },
        { key: 'gewog', label: 'Gewog (Standardized)' },
        { key: 'gewogDz', label: 'Gewog (Dzongkha)' },
        { key: 'dzongkhag', label: 'Dzongkhag' }
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
    ],
    tense: [
        { key: 'past', label: 'Past' },
        { key: 'present', label: 'Present' },
        { key: 'future', label: 'Future' },
        { key: 'imperative', label: 'Imperative' }
    ]
};

function normalizeEnglish(value) {
    return String(value).trim().toLowerCase();
}

function normalizeDzongkha(value) {
    return String(value)
        .trim()
        .replace(/[་།\s]+$/g, '');
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesNormalizedQuery(text, normalizedQuery, hasDz, exactOnly = false) {
    if (!text || !normalizedQuery) return false;
    const normalizedText = hasDz ? normalizeDzongkha(text) : normalizeEnglish(text);
    if (!normalizedText) return false;

    if (normalizedText === normalizedQuery) return true;
    if (hasDz) {
        if (exactOnly) return false;
        const pattern = new RegExp(`(?:^|[་།\\s])${escapeRegExp(normalizedQuery)}(?:$|[་།\\s])`);
        return pattern.test(normalizedText);
    }

    if (exactOnly) return false;
    const pattern = new RegExp(`(?:^|\\W)${escapeRegExp(normalizedQuery)}(?:$|\\W)`);
    return pattern.test(normalizedText);
}

function getDirectionLabel(searchDirection) {
    if (searchDirection === 'all') return 'All dictionaries';
    if (searchDirection === 'en-dz') return 'English → Dzongkha';
    if (searchDirection === 'countries') return 'Names of countries and capital';
    if (searchDirection === 'public-service') return 'Public Service Terminology';
    if (searchDirection === 'place-names') return 'Place names of Bhutan';
    if (searchDirection === 'dz-dz') return 'Dzongkha → Dzongkha';
    if (searchDirection === 'tense') return 'Tenses';
    return 'Dzongkha → English';
}

function getEntriesForDirection(directionKey) {
    if (directionKey === 'en-dz') return enDzEntries;
    if (directionKey === 'countries') return countryEntries;
    if (directionKey === 'public-service') return publicServiceEntries;
    if (directionKey === 'place-names') return placeNamesEntries;
    if (directionKey === 'dz-dz') return dzDzEntries;
    if (directionKey === 'tense') return tenseEntries;
    return dzEnEntries;
}

function readSavedEntries(key) {
    try {
        const saved = JSON.parse(localStorage.getItem(`dz_data_${key}`) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn(`Ignoring invalid saved ${key} entries:`, error);
        return [];
    }
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
    const label = getDirectionLabel(searchDirection);
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
        const combined = [...dzDzEntries, ...dzEnEntries, ...enDzEntries, ...tenseEntries].filter(Boolean);
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

function updateNotificationBadge() {
    const list = getNotifications();
    const readCount = parseInt(localStorage.getItem('dz_notif_read_count') || '0');
    const unreadCount = Math.max(0, list.length - readCount);
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.hidden = unreadCount === 0;
    }
}

function markNotificationsAsRead() {
    const list = getNotifications();
    localStorage.setItem('dz_notif_read_count', list.length);
    updateNotificationBadge();
}

function renderNotificationSection() {
    const list = getNotifications().slice().reverse(); // Newest first
    if (!notificationSummary) return;

    if (!list.length) {
        notificationSummary.innerHTML = '<div class="empty-state">No notifications yet. Admin updates will appear here.</div>';
        return;
    }

    notificationSummary.innerHTML = list.map(n => {
        const isDzongkha = /[\u0F00-\u0FFF]/.test(n.message);
        const fontClass = isDzongkha ? 'dzongkha-word' : 'english-word';
        return `
        <div class="notif-item">
            <div class="notif-icon">
                <svg class="icon" viewBox="0 0 24 24"><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Zm-8 5h4a2 2 0 0 1-4 0Z"/></svg>
            </div>
            <div class="notif-body">
                <p class="notif-msg ${fontClass}">${escapeHtml(n.message)}</p>
                <span class="notif-time">${new Date(n.createdAt).toLocaleDateString()} at ${new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
    `;
    }).join('');
}

function showLatestNotification() {
    updateNotificationBadge();
    renderNotificationSection();
}

function loadDictionaryData(data, directionKey, fileName) {
    const normalized = normalizeJsonArray(data);
    if (!normalized) return;

    const cleaned = [];
    for (const entry of normalized) {
        try {
            if (!entry.root && !(entry.present || entry.future || entry.past || entry.imperative)) {
                continue; // Skip invalid entries without crashing
            }
            const e = { ...entry };
            if (!e.root) e.root = e.present || e.future || e.past || e.imperative;
            if (!e.source) e.source = fileName;
            if (fileName === LOCAL_COLLECTED_TERMINOLOGY_JSON) {
                e.dictionaryLabel = 'Collected terminology';
            }
            if (fileName === LOCAL_PUBLIC_SERVICE_JSON) {
                e.dictionaryLabel = 'Public Service Terminology';
            }
            if (fileName === LOCAL_PLACE_NAMES_JSON) {
                e.dictionaryLabel = 'Place names of Bhutan';
            }
            cleaned.push(e);
        } catch (err) {
            console.warn(`Skipping invalid entry in ${fileName}:`, err);
        }
    }

    if (directionKey === 'en-dz') {
        cleaned.forEach(item => enDzEntries.push(item));
    } else if (directionKey === 'countries') {
        cleaned.forEach(item => countryEntries.push(item));
    } else if (directionKey === 'public-service') {
        cleaned.forEach(item => publicServiceEntries.push(item));
    } else if (directionKey === 'place-names') {
        cleaned.forEach(item => placeNamesEntries.push(item));
    } else if (directionKey === 'dz-dz') {
        cleaned.forEach(item => dzDzEntries.push(item));
    } else if (directionKey === 'tense') {
        cleaned.forEach(item => tenseEntries.push(item));
    } else {
        cleaned.forEach(item => dzEnEntries.push(item));
    }

    if (isBulkLoadingDictionaries) return;

    rebuildSearchIndices();

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
                const directionKey = inferDirectionFromFileName(file.name) || (Array.isArray(data) && data[0] && ('past' in data[0] || 'future' in data[0] || 'imperative' in data[0]) ? 'tense' : (Array.isArray(data) && data[0] && 'equivalentTerm' in data[0] ? 'dz-en' : 'dz-dz'));
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
    currentEntries = getEntriesForDirection(direction);
    directionButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.direction === newDirection);
    });

    if (newDirection === 'dz-en') {
        inputElement.placeholder = 'Enter Dzongkha Word (e.g. རྫོང་ཁ།)';
    } else if (newDirection === 'dz-dz') {
        inputElement.placeholder = 'Enter a Dzongkha word for Dzongkha definitions';
    } else if (newDirection === 'tense') {
        inputElement.placeholder = 'Search any tense form';
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

function toLabel(key) {
    return String(key)
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getFieldDefinitions(entry, entryType) {
    const fields = fieldLabels[entryType] ? [...fieldLabels[entryType]] : [];
    const knownKeys = new Set(fields.map((field) => field.key).concat(['root', 'source']));
    Object.keys(entry)
        .filter((key) => !knownKeys.has(key))
        .sort()
        .forEach((key) => fields.push({ key, label: toLabel(key) }));
    return fields;
}

function renderCard(entry, entryType) {
    const fields = getFieldDefinitions(entry, entryType);
    
    // Determine flags based on direction
    const rootFlag = entryType === 'enDz' ? '🇬🇧' : '🇧🇹';
    const transFlag = entryType === 'enDz' ? '🇧🇹' : (entryType === 'dzEn' ? '🇬🇧' : '');

    const details = fields
        .filter((field) => field.key !== 'root' && entry[field.key] && entry[field.key].toString().trim().length > 0)
        .map((field) => {
            let valueClass = entryType === 'enDz' ? (field.key === 'equivalent' ? 'dzongkha-word' : 'english-word') : 'dzongkha-word';
            if (entryType === 'dzEn' && field.key === 'equivalentTerm') valueClass = 'english-word';
            if (entryType === 'dzDz') valueClass = 'dzongkha-word';
            if (entryType === 'tense') valueClass = 'dzongkha-word';

            const rawValue = entry[field.key];
            const clickableKeys = ['equivalent', 'equivalentTerm', 'also', 'past', 'present', 'future', 'imperative'];
            const rawDisplay = (clickableKeys.includes(field.key) || (field.key === 'meaning' && entryType !== 'dzDz'))
                ? renderClickableText(rawValue, valueClass)
                : `<span class="${valueClass}">${rawValue}</span>`;
            const displayValue = field.key === 'meaning'
                ? `<span class="meaning-text ${valueClass}">${rawDisplay}</span>`
                : rawDisplay;

            // Render 'Type' as a badge, others as standard items
            if (field.key === 'type') {
                return `<div class="details-item"><strong>${field.label}</strong><span class="type-badge">${displayValue}</span></div>`;
            }

            return `<div class="details-item"><strong>${field.label}</strong><span>${displayValue}</span></div>`;
        })
        .join('');

    const directionLabel = entry.dictionaryLabel
        || (entryType === 'enDz'
            ? 'English → Dzongkha'
            : entryType === 'countries'
                ? 'Names of countries and capital'
                : entryType === 'publicService'
                    ? 'Public Service Terminology'
                    : entryType === 'placeNames'
                        ? 'Place names of Bhutan'
                        : (entryType === 'dzEn' ? 'Dzongkha → English' : (entryType === 'tense' ? 'Tenses' : 'Dzongkha → Dzongkha')));
    const mainWordClass = entryType === 'enDz' || entryType === 'countries' || entryType === 'publicService' || entryType === 'placeNames' ? 'english-word' : 'uchen-word';
    const caption = entryType === 'enDz'
        ? (entry.equivalent || '')
        : entryType === 'countries'
            ? (entry.equivalent || '')
            : (entryType === 'dzEn' ? (entry.equivalentTerm || '') : (entryType === 'tense' ? 'Verb tense forms' : ''));
    const captionClass = entryType === 'dzDz'
        ? 'dzongkha-word'
        : (entryType === 'enDz' || entryType === 'countries' ? 'dzongkha-word' : 'english-word');

    return `
        <section class="dictionary-entry">
            <h2 class="word ${mainWordClass}">
                <span class="lang-flag">${rootFlag}</span> ${entry.root}
                <button type="button" class="audio-btn" data-root-audio="${entry.root}" title="Play English pronunciation">🔊</button>
                <button type="button" class="fav-btn ${isFavorited(entry.root)?'favorited':''}" data-root-fav="${entry.root}" title="Save favorite">☆</button>
            </h2>
            ${caption ? `<p class="translation-caption ${captionClass}"><span class="lang-flag">${transFlag}</span> ${caption}</p>` : ''}
            <div class="dictionary-details">
                ${details}
                <div class="details-item">
                    <strong>Dictionary direction</strong>
                    <span>${directionLabel}</span>
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
                { key: 'comparative', label: 'Comparative', className: 'english-word' }
            ]
        };
    }

    if (directionKey === 'countries') {
        const keys = new Set();
        countryEntries.forEach((entry) => Object.keys(entry).forEach((key) => keys.add(key)));
        const orderedKeys = ['root', 'equivalent', ...Array.from(keys).filter((key) => !['root', 'equivalent', 'source'].includes(key)).sort()];

        return {
            title: 'Country and capital entries',
            entries: countryEntries,
            type: 'countries',
            columns: orderedKeys
                .filter((key) => key !== 'source')
                .map((key) => ({
                    key,
                    label: key === 'root' ? 'Country'
                        : key === 'equivalent' ? 'Capital'
                        : key === 'countryDz' ? 'Country (Dzongkha)'
                        : key === 'capitalDz' ? 'Capital (Dzongkha)'
                        : toLabel(key),
                    className: key === 'equivalent' || key === 'root' ? 'english-word' : 'dzongkha-word wide'
                }))
        };
    }

    if (directionKey === 'public-service') {
        const keys = new Set();
        publicServiceEntries.forEach((entry) => Object.keys(entry).forEach((key) => keys.add(key)));
        const orderedKeys = ['root', 'equivalent', ...Array.from(keys).filter((key) => !['root', 'equivalent', 'source', 'no'].includes(key)).sort()];

        return {
            title: 'Public Service Terminology',
            entries: publicServiceEntries,
            type: 'publicService',
            columns: orderedKeys
                .filter((key) => key !== 'source')
                .map((key) => ({
                    key,
                    label: key === 'root' ? 'English term'
                        : key === 'equivalent' ? 'Dzongkha translation'
                        : toLabel(key),
                    className: key === 'equivalent' ? 'dzongkha-word wide' : 'english-word'
                }))
        };
    }

    if (directionKey === 'place-names') {
        const keys = new Set();
        placeNamesEntries.forEach((entry) => Object.keys(entry).forEach((key) => keys.add(key)));
        const orderedKeys = ['root', 'equivalent', ...Array.from(keys).filter((key) => !['root', 'equivalent', 'source', 'no'].includes(key)).sort()];

        return {
            title: 'Place names of Bhutan',
            entries: placeNamesEntries,
            type: 'placeNames',
            columns: orderedKeys
                .filter((key) => key !== 'source')
                .map((key) => ({
                    key,
                    label: key === 'root' ? 'Village (Standardized)'
                        : key === 'equivalent' ? 'Village (Dzongkha)'
                        : key === 'chiwog' ? 'Chiwog (Standardized)'
                        : key === 'chiwogDz' ? 'Chiwog (Dzongkha)'
                        : key === 'gewog' ? 'Gewog (Standardized)'
                        : key === 'gewogDz' ? 'Gewog (Dzongkha)'
                        : key === 'dzongkhag' ? 'Dzongkhag' : toLabel(key),
                    className: key === 'equivalent' || key === 'chiwogDz' || key === 'gewogDz' ? 'dzongkha-word wide' : 'english-word'
                }))
        };
    }

    if (directionKey === 'dz-dz') {
        return {
            title: 'Dzongkha definition entries',
            entries: dzDzEntries,
            type: 'dzDz',
            columns: [
                { key: 'root', label: 'Root word', className: 'uchen-word' },
                { key: 'meaning', label: 'Meaning', className: 'dzongkha-word wide' }
            ]
        };
    }

    if (directionKey === 'tense') {
        return {
            title: 'Tense entries',
            entries: tenseEntries,
            type: 'tense',
            columns: [
                { key: 'past', label: 'Past', className: 'dzongkha-word' },
                { key: 'present', label: 'Present', className: 'dzongkha-word' },
                { key: 'future', label: 'Future', className: 'dzongkha-word' },
                { key: 'imperative', label: 'Imperative', className: 'dzongkha-word' }
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
                { key: 'hon', label: 'Hon.', className: 'dzongkha-word' }
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
    tableContainer.style.overflowX = 'auto'; // Force horizontal scroll for wide tables on mobile

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

function addIndexedEntry(map, key, entry) {
    const cleanKey = String(key).trim();
    if (!cleanKey) return;
    if (!map[cleanKey]) map[cleanKey] = [];
    if (!map[cleanKey].includes(entry)) map[cleanKey].push(entry);
}

function getIndexedMatches(index, ...keys) {
    const matches = [];
    keys.forEach((key) => {
        (index[key] || []).forEach((entry) => {
            if (!matches.includes(entry)) matches.push(entry);
        });
    });
    return matches;
}

function getEntrySignature(entry, entryType) {
    const fields = entryType === 'tense'
        ? ['past', 'present', 'future', 'imperative']
        : ['root', 'equivalent', 'equivalentTerm', 'meaning', 'type', 'also'];
    return fields.map((field) => entry[field] || '').join('|');
}

function uniqueEntries(entries, entryType) {
    const seen = new Set();
    return entries.filter((entry) => {
        const signature = getEntrySignature(entry, entryType);
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    });
}

function uniqueEntriesByLabel(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
        const label = String(entry.root || entry.present || entry.future || entry.past || entry.imperative || '').trim();
        if (!label) return false;
        const key = label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function indexEntryField(map, entry, value) {
    if (!value) return;
    const text = String(value).trim();
    if (!text) return;

    const dzKey = normalizeDzongkha(text);
    const enKey = normalizeEnglish(text);

    if (dzKey) addIndexedEntry(map, dzKey, entry);
    if (enKey) addIndexedEntry(map, enKey, entry);
    if (text !== dzKey && text !== enKey) addIndexedEntry(map, text, entry);
}

function buildIndex(entries, directionKey) {
    return entries.reduce((map, entry) => {
        if (!entry.root) return map;

        const fieldsToIndex = directionKey === 'en-dz'
            ? ['root', 'also', 'plural', 'verbalForm', 'comparative', 'equivalent']
            : directionKey === 'countries' || directionKey === 'public-service' || directionKey === 'place-names'
                ? Object.keys(entry).filter((key) => !['source', 'no'].includes(key))
                : directionKey === 'dz-dz'
                    ? ['root']
                    : ['root', 'also', 'syn', 'short', 'app', 'hon', 'equivalentTerm'];

        fieldsToIndex.forEach((field) => indexEntryField(map, entry, entry[field]));
        return map;
    }, {});
}

function buildTenseIndex(entries) {
    return entries.reduce((map, entry) => {
        ['root', 'past', 'present', 'future', 'imperative', 'meaning'].forEach((field) => {
            const value = entry[field];
            if (!value) return;
            const values = String(value).split(/[\s,;|/]+/).filter(Boolean);
            values.push(String(value));
            values.forEach((item) => {
                const dzKey = normalizeDzongkha(item);
                const enKey = normalizeEnglish(item);
                if (dzKey) addIndexedEntry(map, dzKey, entry);
                if (enKey && enKey !== dzKey) addIndexedEntry(map, enKey, entry);
            });
        });
        return map;
    }, {});
}

function rebuildSearchIndices() {
    dzEnIndex = buildIndex(dzEnEntries, 'dz-en');
    enDzIndex = buildIndex(enDzEntries, 'en-dz');
    countriesIndex = buildIndex(countryEntries, 'countries');
    publicServiceIndex = buildIndex(publicServiceEntries, 'public-service');
    placeNamesIndex = buildIndex(placeNamesEntries, 'place-names');
    dzDzIndex = buildIndex(dzDzEntries, 'dz-dz');
    tenseIndex = buildTenseIndex(tenseEntries);
}

function findTenseMatches(query) {
    const dzNorm = normalizeDzongkha(query);
    const enNorm = normalizeEnglish(query);
    const keys = [dzNorm, enNorm, query].filter(Boolean);
    const matches = getIndexedMatches(tenseIndex, ...keys);
    if (matches.length) return uniqueEntries(matches, 'tense');
    return searchEntriesByQuery(tenseEntries, 'tense', query, dzNorm || enNorm, /[\u0F00-\u0FFF]/.test(query));
}

function entryMatchesQuery(entry, normalizedQuery, hasDz, directionKey) {
    const fields = directionKey === 'en-dz'
        ? ['root', 'also', 'plural', 'verbalForm', 'comparative']
        : directionKey === 'countries' || directionKey === 'public-service'
            ? Object.keys(entry).filter((key) => !['source', 'no'].includes(key))
            : directionKey === 'dz-dz'
                ? ['root']
                : ['root', 'also', 'syn', 'short', 'app', 'hon', 'equivalentTerm'];

    return fields.some((field) => {
        const value = entry[field];
        if (!value) return false;
        return matchesNormalizedQuery(value, normalizedQuery, hasDz, directionKey === 'dz-dz');
    });
}

function suggestionMatchesQuery(entry, normalizedQuery, hasDz) {
    const fields = hasDz
        ? ['root', 'past', 'present', 'future', 'imperative', 'meaning', 'equivalent', 'also', 'syn', 'short', 'app', 'hon', 'equivalentTerm', 'countryDz', 'capitalDz', 'chiwogDz', 'gewogDz']
        : ['root', 'also', 'plural', 'verbalForm', 'comparative', 'equivalent', 'chiwog', 'gewog', 'dzongkhag'];

    return fields.some((field) => {
        const value = entry[field];
        if (!value) return false;
        return matchesNormalizedQuery(value, normalizedQuery, hasDz);
    });
}

function searchEntriesByQuery(entries, directionKey, query, normalizedQuery, hasDz) {
    const index = directionKey === 'dz-en'
        ? dzEnIndex
        : directionKey === 'countries'
            ? countriesIndex
            : directionKey === 'public-service'
                ? publicServiceIndex
                : directionKey === 'place-names'
                    ? placeNamesIndex
                    : directionKey === 'dz-dz'
                        ? dzDzIndex
                        : directionKey === 'en-dz'
                            ? enDzIndex
                            : tenseIndex;

    const exactMatches = uniqueEntries(
        getIndexedMatches(index, normalizedQuery, query),
        directionKey === 'dz-en' ? 'dzEn' : directionKey === 'countries' ? 'countries' : directionKey === 'public-service' ? 'publicService' : directionKey === 'place-names' ? 'placeNames' : directionKey === 'dz-dz' ? 'dzDz' : directionKey === 'en-dz' ? 'enDz' : 'tense'
    );
    if (exactMatches.length) return exactMatches;

    const filtered = entries.filter((entry) => entryMatchesQuery(entry, normalizedQuery, hasDz, directionKey));
    return uniqueEntries(filtered, directionKey === 'dz-en' ? 'dzEn' : directionKey === 'countries' ? 'countries' : directionKey === 'public-service' ? 'publicService' : directionKey === 'place-names' ? 'placeNames' : directionKey === 'dz-dz' ? 'dzDz' : directionKey === 'en-dz' ? 'enDz' : 'tense');
}

function getSearchGroups(query, normalizedQuery) {
    return {
        dzEn: searchEntriesByQuery(dzEnEntries, 'dz-en', query, normalizedQuery, /[\u0F00-\u0FFF]/.test(query)),
        dzDz: searchEntriesByQuery(dzDzEntries, 'dz-dz', query, normalizedQuery, /[\u0F00-\u0FFF]/.test(query)),
        enDz: searchEntriesByQuery(enDzEntries, 'en-dz', query, normalizedQuery, /[\u0F00-\u0FFF]/.test(query)),
        countries: searchEntriesByQuery(countryEntries, 'countries', query, normalizedQuery, false),
        publicService: searchEntriesByQuery(publicServiceEntries, 'public-service', query, normalizedQuery, false),
        placeNames: searchEntriesByQuery(placeNamesEntries, 'place-names', query, normalizedQuery, false),
        tense: findTenseMatches(query)
    };
}

function renderSearchCards(query, groups, similarDirection) {
    const cards = [];
    groups.forEach(({ entries, type }) => {
        entries.slice(0, 20).forEach((entry) => cards.push(renderCard(entry, type)));
    });

    if (!cards.length) return false;
    resultElement.innerHTML = cards.join('');
    const similar = renderSimilar(query, similarDirection || direction);
    if (similar) resultElement.appendChild(similar);
    scrollToResults();
    return true;
}

function searchWord() {
    const query = inputElement.value.trim();
    if (!query) {
        renderMessage('Please enter a word to search.', true);
        scrollToResults();
        return;
    }
    addSearchHistory(query, 'all');

    const hasDz = /[\u0F00-\u0FFF]/.test(query);
    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);
    const groups = getSearchGroups(query, normalizedQuery);

    const searchGroups = hasDz
        ? [
            { entries: groups.dzEn, type: 'dzEn' },
            { entries: groups.dzDz, type: 'dzDz' },
            { entries: groups.tense, type: 'tense' }
        ]
        : [
            { entries: groups.enDz, type: 'enDz' },
            { entries: groups.publicService, type: 'publicService' },
            { entries: groups.placeNames, type: 'placeNames' },
            { entries: groups.countries, type: 'countries' }
        ];

    if (renderSearchCards(query, searchGroups, hasDz ? 'all-dz' : 'en-dz')) return;

    renderMessage(`No entry found for "${query}". Try a different spelling or check the source data.`, true);
    scrollToResults();
}

/**
 * Smoothly scrolls to the results area on mobile devices
 */
function scrollToResults() {
    if (document.documentElement.clientWidth <= 1040) {
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
    if (inputElement.classList.contains('dzongkha-word') !== hasDz) {
        inputElement.classList.toggle('dzongkha-word', hasDz);
        inputElement.classList.toggle('english-word', !hasDz);
        searchButton.classList.toggle('dzongkha-word', hasDz);
        searchButton.classList.toggle('english-word', !hasDz);
    }

    const sourceList = hasDz 
        ? [...dzEnEntries, ...dzDzEntries, ...tenseEntries, ...countryEntries, ...publicServiceEntries, ...placeNamesEntries] 
        : [...enDzEntries, ...countryEntries, ...publicServiceEntries, ...placeNamesEntries];

    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);
    const matches = uniqueEntriesByLabel(sourceList.filter((entry) => suggestionMatchesQuery(entry, normalizedQuery, hasDz))).slice(0, 8);

    if (matches.length === 0) {
        suggestions.hidden = true;
        return;
    }

    suggestions.hidden = false;
    suggestions.innerHTML = matches.map((entry) => {
        const label = entry.root || entry.present || entry.future || entry.past || entry.imperative;
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
    inputElement.value = val;
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
    let sourceList;
    const suggestionDirection = effectiveDirection || direction;
    if (suggestionDirection === 'en-dz') {
        sourceList = enDzEntries;
    } else if (suggestionDirection === 'dz-dz') {
        sourceList = dzDzEntries;
    } else if (suggestionDirection === 'tense') {
        sourceList = tenseEntries;
    } else {
        sourceList = hasDz ? [...dzEnEntries, ...dzDzEntries, ...tenseEntries] : enDzEntries;
    }
    const normalizedQuery = hasDz ? normalizeDzongkha(query) : normalizeEnglish(query);
    const matches = uniqueEntriesByLabel(sourceList.filter((entry) => {
        if (!hasDz) {
            const key = normalizeEnglish(entry.root || '');
            return key !== normalizedQuery && matchesNormalizedQuery(entry.root || '', normalizedQuery, false);
        }
        return ['root', 'past', 'present', 'future', 'imperative', 'meaning', 'equivalentTerm']
            .some((field) => {
                const value = entry[field];
                if (!value) return false;
                const normalized = normalizeDzongkha(value);
                return normalized !== normalizedQuery && matchesNormalizedQuery(value, normalizedQuery, true);
            });
    })).slice(0, 8);

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
updateWordOfTheDay();
showLatestNotification();
renderHistoryPanel();
initializeLocalDictionaries();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registered');
            })
            .catch(err => console.error('Service Worker registration failed', err));
    });

    // Automatically reload the page when a new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}
