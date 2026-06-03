import { LETTER_TEXT } from './letter-content.js';

const MEMORIES_KEY = 'piyu-memories';
const MIGRATED_KEY = 'piyu-server-migrated';

let serverAvailable = null;

async function checkServer() {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

async function migrateFromBrowserStorage() {
  if (sessionStorage.getItem(MIGRATED_KEY)) return;
  let memories = null;
  try {
    const raw = localStorage.getItem(MEMORIES_KEY);
    if (raw) memories = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  if (!memories) {
    sessionStorage.setItem(MIGRATED_KEY, '1');
    return;
  }
  try {
    await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memories }),
    });
    sessionStorage.setItem(MIGRATED_KEY, '1');
  } catch {
    /* retry next load */
  }
}

export async function initStorage() {
  if (await checkServer()) {
    await migrateFromBrowserStorage();
  }
}

/** @returns {Promise<Array<{id:string,src:string,caption:string,type:'image'|'video'}>>} */
export async function loadMemories() {
  if (await checkServer()) {
    const res = await fetch('/api/memories');
    if (!res.ok) throw new Error('Could not load memories');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  return loadMemoriesLocal();
}

export async function addMemory(file, caption) {
  if (await checkServer()) {
    const form = new FormData();
    form.append('caption', caption);
    form.append('media', file);
    const res = await fetch('/api/memories', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    return loadMemories();
  }
  return addMemoryLocal(file, caption);
}

export async function removeMemory(id) {
  if (await checkServer()) {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not remove memory');
    return loadMemories();
  }
  return removeMemoryLocal(id);
}

export async function loadLetter() {
  if (await checkServer()) {
    const res = await fetch('/api/letter');
    if (!res.ok) throw new Error('Could not load letter');
    const { text } = await res.json();
    return text;
  }
  return LETTER_TEXT;
}

export async function isUsingServer() {
  return checkServer();
}

function loadMemoriesLocal() {
  try {
    const raw = localStorage.getItem(MEMORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    const items = [];
    for (const list of Object.values(parsed)) {
      if (Array.isArray(list)) items.push(...list);
    }
    return items;
  } catch {
    return [];
  }
}

async function addMemoryLocal(file, caption) {
  const items = loadMemoriesLocal();
  const dataUrl = await readFileAsDataUrl(file);
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  items.push({
    id: crypto.randomUUID(),
    src: dataUrl,
    caption: caption.trim() || 'A beautiful moment ♡',
    type,
  });
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(items));
  return items;
}

function removeMemoryLocal(id) {
  const items = loadMemoriesLocal().filter((m) => m.id !== id);
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(items));
  return items;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
