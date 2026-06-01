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
const exportNotifBtn = document.createElement('button');

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

exportNotifBtn.className = 'secondary-button';
exportNotifBtn.textContent = 'Export Notifications JSON';
exportNotifBtn.style.marginTop = '12px';
if (document.getElementById('notifSection')) document.getElementById('notifSection').appendChild(exportNotifBtn);

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

postNotif.addEventListener('click', () => {
    const msg = (notifText.value||'').trim(); if (!msg) return; const list = getNotifications(); list.push({ message: msg, createdAt: Date.now() }); saveNotifications(list); notifText.value = ''; renderList();
});

exportNotifBtn.addEventListener('click', () => {
    const list = getNotifications();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications.json`;
    a.click();
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
