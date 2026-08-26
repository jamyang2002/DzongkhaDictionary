const authPanel = document.getElementById('authPanel');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const secret = document.getElementById('secret');
const authStatus = document.getElementById('authStatus');
const publishStatus = document.getElementById('publishStatus');
const postNotif = document.getElementById('postNotif');
const notifText = document.getElementById('notifText');
const notifList = document.getElementById('notifList');
const dictSelector = document.getElementById('dictSelector');
const adminSearch = document.getElementById('adminSearch');
const entryList = document.getElementById('entryList');
const addNewBtn = document.getElementById('addNewBtn');
const editModal = document.getElementById('editModal');
const entryForm = document.getElementById('entryForm');
const formFields = document.getElementById('formFields');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const exportDataBtn = document.getElementById('exportDataBtn');

const schemas = {
    enDz: ['root', 'equivalent', 'type', 'also', 'plural', 'verbalForm', 'comparative'],
    dzEn: ['root', 'equivalentTerm', 'type', 'tenses', 'short', 'also', 'syn', 'app', 'hon'],
    dzDz: ['root', 'meaning'],
    kangdrang: ['root', 'meaning', 'dictionaryLabel'],
    tenses: ['root', 'past', 'present', 'future', 'imperative']
};

let currentEntries = [];
let currentSha = '';
let currentEditIndex = -1;
let currentNotifications = [];
let notificationsSha = '';

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function apiRequest(path, options = {}) {
    const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
}

function setStatus(message, isError = false) {
    publishStatus.textContent = message;
    publishStatus.style.color = isError ? 'var(--danger)' : '';
}

async function loadNotifications() {
    const result = await apiRequest('/api/notifications');
    currentNotifications = result.notifications || [];
    notificationsSha = result.sha || '';
    renderNotifications();
}

function renderNotifications() {
    notifList.innerHTML = currentNotifications.length
        ? currentNotifications.slice().reverse().map((notification, reverseIndex) => `<li><span class="dzongkha-word">${escapeHtml(notification.message)}</span><button class="load-json-button" data-notification-index="${currentNotifications.length - reverseIndex - 1}">Remove</button></li>`).join('')
        : '<li>No published notifications.</li>';
    notifList.querySelectorAll('[data-notification-index]').forEach((button) => button.addEventListener('click', () => removeNotification(Number(button.dataset.notificationIndex))));
}

async function saveNotifications() {
    const result = await apiRequest('/api/notifications', { method: 'PUT', body: JSON.stringify({ notifications: currentNotifications, sha: notificationsSha }) });
    notificationsSha = result.sha || notificationsSha;
    setStatus('Notification changes published to GitHub.');
    renderNotifications();
}

async function removeNotification(index) {
    if (!confirm('Remove this notification for users?')) return;
    const removed = currentNotifications.splice(index, 1)[0];
    try { await saveNotifications(); } catch (error) { currentNotifications.splice(index, 0, removed); setStatus(error.message, true); }
}

postNotif.addEventListener('click', async () => {
    const message = notifText.value.trim();
    if (!message) return setStatus('Enter a notification message first.', true);
    const notification = { id: `admin-${Date.now()}`, title: 'Dictionary update', message, createdAt: new Date().toISOString() };
    currentNotifications.push(notification);
    postNotif.disabled = true;
    try { await saveNotifications(); notifText.value = ''; } catch (error) { currentNotifications.pop(); setStatus(error.message, true); } finally { postNotif.disabled = false; }
});

async function loadDictionary() {
    setStatus('Loading the latest dictionary data...');
    const result = await apiRequest(`/api/dictionaries?key=${encodeURIComponent(dictSelector.value)}`);
    currentEntries = result.entries || [];
    currentSha = result.sha || '';
    renderEntries();
    setStatus(`${currentEntries.length.toLocaleString()} entries loaded from GitHub.`);
}

function renderEntries() {
    const query = adminSearch.value.trim().toLowerCase();
    const filtered = currentEntries.map((entry, index) => ({ entry, index })).filter(({ entry }) => JSON.stringify(entry).toLowerCase().includes(query)).slice(0, 100);
    entryList.innerHTML = filtered.map(({ entry, index }) => `
        <tr>
            <td class="${dictSelector.value === 'enDz' ? 'english-word' : 'uchen-word'}">${escapeHtml(entry.root)}</td>
            <td>${escapeHtml(entry.equivalent || entry.equivalentTerm || entry.meaning || entry.present || '')}</td>
            <td class="action-btns"><button class="icon-button btn-edit" data-edit-index="${index}">Edit</button><button class="icon-button btn-del" data-delete-index="${index}">Delete</button></td>
        </tr>
    `).join('') || '<tr><td colspan="3">No matching entries.</td></tr>';
    entryList.querySelectorAll('[data-edit-index]').forEach((button) => button.addEventListener('click', () => openEdit(Number(button.dataset.editIndex))));
    entryList.querySelectorAll('[data-delete-index]').forEach((button) => button.addEventListener('click', () => deleteEntry(Number(button.dataset.deleteIndex))));
}

function openEdit(index) {
    const item = index === -1 ? {} : currentEntries[index];
    currentEditIndex = index;
    modalTitle.textContent = index === -1 ? 'Add new entry' : 'Edit entry';
    formFields.innerHTML = schemas[dictSelector.value].map((field) => `<label>${escapeHtml(field)}</label><textarea name="${escapeHtml(field)}" rows="${field === 'meaning' ? 4 : 2}">${escapeHtml(item[field] || '')}</textarea>`).join('');
    editModal.hidden = false;
}

async function publishDictionary() {
    const result = await apiRequest(`/api/dictionaries?key=${encodeURIComponent(dictSelector.value)}`, { method: 'PUT', body: JSON.stringify({ entries: currentEntries, sha: currentSha }) });
    currentSha = result.sha || currentSha;
    setStatus(`${result.count.toLocaleString()} entries published to GitHub.`);
}

async function deleteEntry(index) {
    if (!confirm('Delete this entry and publish the change?')) return;
    const removed = currentEntries.splice(index, 1)[0];
    try { await publishDictionary(); renderEntries(); } catch (error) { currentEntries.splice(index, 0, removed); setStatus(error.message, true); }
}

entryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const entry = Object.fromEntries(new FormData(entryForm).entries());
    if (!entry.root.trim()) return setStatus('Root word is required.', true);
    const oldEntry = currentEditIndex === -1 ? null : currentEntries[currentEditIndex];
    if (currentEditIndex === -1) currentEntries.unshift(entry); else currentEntries[currentEditIndex] = entry;
    try { await publishDictionary(); editModal.hidden = true; renderEntries(); } catch (error) { if (oldEntry) currentEntries[currentEditIndex] = oldEntry; else currentEntries.shift(); setStatus(error.message, true); }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authStatus.textContent = 'Signing in...';
    try {
        await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: secret.value }) });
        authPanel.hidden = true;
        adminPanel.hidden = false;
        await Promise.all([loadNotifications(), loadDictionary()]);
    } catch (error) { authStatus.textContent = error.message; }
});

dictSelector.addEventListener('change', () => loadDictionary().catch((error) => setStatus(error.message, true)));
adminSearch.addEventListener('input', renderEntries);
addNewBtn.addEventListener('click', () => openEdit(-1));
closeModal.addEventListener('click', () => { editModal.hidden = true; });
exportDataBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(currentEntries, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dictSelector.value}_updated.json`;
    link.click();
    URL.revokeObjectURL(link.href);
});

apiRequest('/api/auth/me').then(async () => {
    authPanel.hidden = true;
    adminPanel.hidden = false;
    await Promise.all([loadNotifications(), loadDictionary()]);
}).catch(() => {});
