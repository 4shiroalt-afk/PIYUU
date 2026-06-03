import { LETTER_TEXT } from './letter-content.js';

const MEMORIES_KEY = 'piyu-memories';

// Use deployed API if available, otherwise fall back to localStorage
const API_BASE = import.meta.env.VITE_API_URL || '';

let serverAvailable = null;

async function checkServer() {
  if (serverAvailable !== null) return serverAvailable;
  if (!API_BASE) {
    serverAvailable = false;
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

export async function initStorage() {
  // Just check if server is available
  await checkServer();
}

/** @returns {Promise<Array<{id:string,src:string,caption:string,type:'image'|'video'}>>} */
export async function loadMemories() {
  if (await checkServer()) {
    try {
      const res = await fetch(`${API_BASE}/api/memories`);
      if (!res.ok) throw new Error('Could not load memories');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Server error:', err);
      return loadMemoriesLocal();
    }
  }
  return loadMemoriesLocal();
}

export async function addMemory(file, caption) {
  if (await checkServer()) {
    try {
      const form = new FormData();
      form.append('caption', caption);
      form.append('media', file);
      const res = await fetch(`${API_BASE}/api/memories`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      return loadMemories();
    } catch (err) {
      console.error('Upload error:', err);
      return addMemoryLocal(file, caption);
    }
  }
  return addMemoryLocal(file, caption);
}

export async function removeMemory(id) {
  if (await checkServer()) {
    try {
      const res = await fetch(`${API_BASE}/api/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not remove memory');
      return loadMemories();
    } catch (err) {
      console.error('Delete error:', err);
      return removeMemoryLocal(id);
    }
  }
  return removeMemoryLocal(id);
}

export async function loadLetter() {
  if (await checkServer()) {
    try {
      const res = await fetch(`${API_BASE}/api/letter`);
      if (!res.ok) throw new Error('Could not load letter');
      const { text } = await res.json();
      return text;
    } catch {
      return LETTER_TEXT;
    }
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
