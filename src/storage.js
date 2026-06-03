import { LETTER_TEXT } from './letter-content.js';

const MEMORIES_KEY = 'piyu-memories';

export async function initStorage() {
  // No initialization needed for browser-only storage
}

/** @returns {Promise<Array<{id:string,src:string,caption:string,type:'image'|'video'}>>} */
export async function loadMemories() {
  return loadMemoriesLocal();
}

export async function addMemory(file, caption) {
  return addMemoryLocal(file, caption);
}

export async function removeMemory(id) {
  return removeMemoryLocal(id);
}

export async function loadLetter() {
  return LETTER_TEXT;
}

export async function isUsingServer() {
  return false;
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
