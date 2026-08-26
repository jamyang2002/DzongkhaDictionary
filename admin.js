function getNotifications() { try { return JSON.parse(localStorage.getItem('dz_notifications') || '[]'); } catch (e) { return []; } }
function saveNotifications(list) { try { localStorage.setItem('dz_notifications', JSON.stringify(list)); } catch (e) {} }

// Load dictionary data from localStorage (saved overrides) or use empty
function getDictData(key) { try { return JSON.parse(localStorage.getItem(`dz_data_${key}`) || '[]'); } catch (e) { return []; } }
function saveDictData(key, list) { try { localStorage.setItem(`dz_data_${key}`, JSON.stringify(list)); } catch (e) {} }

const secret = document.getElementById('secret');
const adminPanel = document.getElementById('adminPanel');
const authPanel = document.getElementById('authPanel');
const postNotif = document.getElementById('postNotif');
const notifText = document.getElementById('notifText');
const notifList = document.getElementById('notifList');
const githubToken = document.getElementById('githubToken');
const publishStatus = document.getElementById('publishStatus');

const GITHUB_REPO = 'jamyang2002/DzongkhaDictionary';
const GITHUB_BRANCH = 'main';
const NOTIFICATIONS_PATH = 'notifications.json';

// Dictionary management elements
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

let currentEditIndex = -1;

if (secret) {
    secret.placeholder = 'Enter password';
}

secret.addEventListener('input', () => {
    if (secret.value === 'jamyangloday143') {
        adminPanel.hidden = false;
        authPanel.hidden = true;
    }
});

// Tab Switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('notifSection').hidden = tab.dataset.target !== 'notifSection';
        document.getElementById('entrySection').hidden = tab.dataset.target !== 'entrySection';
        if (tab.dataset.target === 'entrySection') renderEntries();
    });
});

function renderList() {
    const list = getNotifications();
    notifList.innerHTML = list.map((n, i) => `<li>${n.message} <button class="load-json-button" data-i="${i}">Remove</button></li>`).join('');
    notifList.querySelectorAll('.load-json-button').forEach((b) => b.addEventListener('click', (e) => {
        const idx = Number(b.dataset.i);
        const l = getNotifications(); l.splice(idx,1); saveNotifications(l); renderList();
    }));
}

postNotif.addEventListener('click', async () => {
    const msg = (notifText.value || '').trim();
    const token = (githubToken.value || '').trim();
    if (!msg || !token) {
        publishStatus.textContent = 'Enter a message and GitHub access token first.';
        return;
    }
    postNotif.disabled = true;
    publishStatus.textContent = 'Publishing notification to GitHub...';
    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${NOTIFICATIONS_PATH}`;
        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
        const currentResponse = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers });
        if (!currentResponse.ok) throw new Error(`Could not read notifications (${currentResponse.status})`);
        const current = await currentResponse.json();
        const existing = JSON.parse(decodeURIComponent(escape(atob(current.content.replace(/\s/g, '')))));
        const notification = { id: `admin-${Date.now()}`, title: 'Dictionary update', message: msg, createdAt: new Date().toISOString() };
        existing.push(notification);
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(existing.slice(-50), null, 2) + '\n')));
        const updateResponse = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify({ message: `Publish notification: ${msg.slice(0, 50)}`, content, sha: current.sha, branch: GITHUB_BRANCH }) });
        if (!updateResponse.ok) throw new Error(`GitHub rejected the update (${updateResponse.status})`);
        const list = getNotifications(); list.push(notification); saveNotifications(list.slice(-50));
        notifText.value = ''; renderList(); publishStatus.textContent = 'Published. All users will receive it after their app refreshes.';
    } catch (error) {
        publishStatus.textContent = error.message || 'Could not publish notification.';
    } finally {
        postNotif.disabled = false;
    }
});

// --- Dictionary CRUD ---

const schemas = {
    enDz: ['root', 'equivalent', 'type', 'also', 'plural', 'verbalForm', 'comparative'],
    dzEn: ['root', 'equivalentTerm', 'type', 'tenses', 'short', 'also', 'syn', 'app', 'hon'],
    dzDz: ['root', 'meaning']
};

function renderEntries() {
    const dictKey = dictSelector.value;
    const list = getDictData(dictKey);
    const query = adminSearch.value.toLowerCase();
    
    const filtered = list.filter(item => 
        (item.root || '').toLowerCase().includes(query) || 
        (item.equivalent || item.equivalentTerm || item.meaning || '').toLowerCase().includes(query)
    ).slice(0, 100); // Limit UI for performance

    entryList.innerHTML = filtered.map((item, idx) => `
        <tr>
            <td class="${dictKey === 'enDz' ? 'english-word' : 'uchen-word'}">${item.root}</td>
            <td>${item.equivalent || item.equivalentTerm || item.meaning || ''}</td>
            <td class="action-btns">
                <button class="icon-button btn-edit" onclick="openEdit(${idx})">Edit</button>
                <button class="icon-button btn-del" onclick="deleteEntry(${idx})">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.openEdit = (index) => {
    const dictKey = dictSelector.value;
    const list = getDictData(dictKey);
    const item = index === -1 ? {} : list[index];
    currentEditIndex = index;
    modalTitle.textContent = index === -1 ? 'Add New Entry' : 'Edit Entry';
    
    formFields.innerHTML = schemas[dictKey].map(field => `
        <label>${field.charAt(0).toUpperCase() + field.slice(1)}</label>
        <input type="text" name="${field}" value="${item[field] || ''}">
    `).join('');
    
    editModal.hidden = false;
};

window.deleteEntry = (index) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    const dictKey = dictSelector.value;
    const list = getDictData(dictKey);
    list.splice(index, 1);
    saveDictData(dictKey, list);
    renderEntries();
};

entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dictKey = dictSelector.value;
    const list = getDictData(dictKey);
    const formData = new FormData(entryForm);
    const entry = {};
    formData.forEach((value, key) => { entry[key] = value.trim(); });

    if (!entry.root) return alert('Root word is required');

    if (currentEditIndex === -1) {
        list.unshift(entry);
    } else {
        list[currentEditIndex] = entry;
    }

    saveDictData(dictKey, list);
    editModal.hidden = true;
    renderEntries();
});

dictSelector.addEventListener('change', renderEntries);
adminSearch.addEventListener('input', renderEntries);
addNewBtn.addEventListener('click', () => openEdit(-1));
closeModal.addEventListener('click', () => editModal.hidden = true);

exportDataBtn.addEventListener('click', () => {
    const dictKey = dictSelector.value;
    const list = getDictData(dictKey);
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dictKey}_updated.json`;
    a.click();
});

renderList();
renderEntries();
