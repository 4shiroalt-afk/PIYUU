import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const MEMORIES_FILE = path.join(DATA_DIR, 'memories.json');
const LETTER_FILE = path.join(DATA_DIR, 'letter.txt');
const UPLOADS_DIR = path.join(DATA_DIR, 'memories');
const DIST_DIR = path.join(ROOT, 'dist');

const LEGACY_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
const PORT = Number(process.env.PORT) || 3001;
const MAX_FILE_SIZE = 80 * 1024 * 1024;

const defaultLetter = `HAPPY BIRTHDAYYYYY PIYUUUU DARLINGGGGGG, 23 YEAR OLD  baby you are cant believe you are 23 😭😭 you'll always be a 12 year kid to me sweetu batutu.
this dosent count as letter btw if your smiling hehehe anta. i love you sweetu sorry we havent been meeting often lately i michh you too ik you think i dont cus i dont intiate meetups but thats just how i am. but i do love seeing you and hanging out with if youre not doing  pui pui that is 😂. since your last birthday we both have mostly been unemployed not a great time for both of us fs. but things will get better i hope everything goes right this year and your life becomes better than ever. helu kishna ge saku character development arc anta. this year is for happy memories onlyyy. even with that bad year we had some good memories like when we out for my bday, or to that airbnb where you slept gorro gorro anta, long drives to sarjapur 😂, getting caught by cops or when we sat ratri varkala beach ali  and sneaking into your place madya ratri. as long as its with you everything is a good memory for me. i wish hinge every year we stay together and never grow apart. you better tell you future boyfriends or husbands that neen jothe nanu bartin package deal anta.
ILOBEYOUHARIPRIYA
`;

const app = express();
app.use(express.json({ limit: '50mb' }));

// Enable CORS for cross-domain requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function mediaTypeFromMime(mime) {
  return mime?.startsWith('video/') ? 'video' : 'image';
}

function mediaTypeFromFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.mp4', '.mov', '.webm', '.m4v', '.3gp'].includes(ext)) return 'video';
  return 'image';
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || (file.mimetype?.startsWith('video/') ? '.mp4' : '.jpg');
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/octet-stream';
    cb(ok ? null : new Error('Only images and videos allowed'), ok);
  },
});

async function ensureDirs() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(MEMORIES_FILE);
  } catch {
    await fs.writeFile(MEMORIES_FILE, JSON.stringify({ items: [] }, null, 2));
  }
  try {
    await fs.access(LETTER_FILE);
  } catch {
    await fs.writeFile(LETTER_FILE, defaultLetter, 'utf8');
  }
}

function normalizeStore(raw) {
  if (raw?.items && Array.isArray(raw.items)) {
    return { items: raw.items };
  }
  if (Array.isArray(raw)) {
    return { items: raw };
  }

  const items = [];
  for (const year of LEGACY_YEARS) {
    const list = raw?.[year];
    if (!Array.isArray(list)) continue;
    for (const m of list) {
      items.push({
        id: m.id,
        file: m.file?.includes('/') ? m.file : `${year}/${m.file}`,
        caption: m.caption,
        type: m.type || mediaTypeFromFile(m.file),
      });
    }
  }
  return { items };
}

async function readMemories() {
  const raw = JSON.parse(await fs.readFile(MEMORIES_FILE, 'utf8'));
  const store = normalizeStore(raw);
  if (!raw?.items && !Array.isArray(raw)) {
    await writeMemories(store);
  }
  return store;
}

async function writeMemories(store) {
  await fs.writeFile(MEMORIES_FILE, JSON.stringify(store, null, 2));
}

function toClientItem(m) {
  const filePath = m.file.replace(/\\/g, '/');
  return {
    id: m.id,
    caption: m.caption,
    type: m.type || mediaTypeFromFile(m.file),
    src: `/uploads/${filePath.split('/').map(encodeURIComponent).join('/')}`,
  };
}

function toClientList(store) {
  return store.items.map(toClientItem);
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/memories', async (_req, res) => {
  try {
    const store = await readMemories();
    res.json(toClientList(store));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memories', upload.single('media'), async (req, res) => {
  try {
    const caption = (req.body.caption || '').trim() || 'A beautiful moment ♡';
    if (!req.file) {
      return res.status(400).json({ error: 'Photo or video required' });
    }

    const id = path.parse(req.file.filename).name;
    const type = mediaTypeFromMime(req.file.mimetype);
    const entry = { id, file: req.file.filename, caption, type };

    const store = await readMemories();
    store.items.push(entry);
    await writeMemories(store);

    res.json(toClientItem(entry));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const store = await readMemories();
    const item = store.items.find((m) => m.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    store.items = store.items.filter((m) => m.id !== id);
    await writeMemories(store);

    try {
      await fs.unlink(path.join(UPLOADS_DIR, item.file));
    } catch {
      /* file may already be gone */
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/letter', async (_req, res) => {
  try {
    const text = await fs.readFile(LETTER_FILE, 'utf8');
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/migrate', async (req, res) => {
  try {
    const { memories } = req.body || {};
    let migrated = false;
    const store = await readMemories();

    const ingest = async (item, subpath = '') => {
      if (!item?.src) return;
      const exists = store.items.some((m) => m.id === item.id);
      if (exists) return;

      if (item.src.startsWith('data:')) {
        const match = item.src.match(/^data:(image|video)\/(\w+);base64,(.+)$/);
        if (!match) return;
        const kind = match[1];
        const ext = match[2] === 'jpeg' ? '.jpg' : match[2] === 'quicktime' ? '.mov' : `.${match[2]}`;
        const id = item.id || crypto.randomUUID();
        const filename = `${id}${ext}`;
        const buf = Buffer.from(match[3], 'base64');
        const rel = subpath ? `${subpath}/${filename}` : filename;
        await fs.mkdir(path.dirname(path.join(UPLOADS_DIR, rel)), { recursive: true });
        await fs.writeFile(path.join(UPLOADS_DIR, rel), buf);
        store.items.push({
          id,
          file: rel.replace(/\\/g, '/'),
          caption: item.caption || 'A beautiful moment ♡',
          type: item.type || kind,
        });
        migrated = true;
        return;
      }

      if (item.src.startsWith('/uploads/')) {
        const rel = item.src.replace(/^\/uploads\//, '');
        store.items.push({
          id: item.id || crypto.randomUUID(),
          file: rel,
          caption: item.caption || 'A beautiful moment ♡',
          type: item.type || mediaTypeFromFile(rel),
        });
        migrated = true;
      }
    };

    if (Array.isArray(memories)) {
      for (const item of memories) await ingest(item);
    } else if (memories && typeof memories === 'object') {
      for (const year of LEGACY_YEARS) {
        const list = memories[year];
        if (!Array.isArray(list)) continue;
        for (const item of list) await ingest(item, String(year));
      }
    }

    if (migrated) await writeMemories(store);
    res.json({ migrated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/uploads', express.static(UPLOADS_DIR));

const serveDist = process.argv.includes('--serve-dist');
let hasDist = false;
if (serveDist) {
  try {
    await fs.access(DIST_DIR);
    hasDist = true;
    app.use(express.static(DIST_DIR));
    app.get(/^\/(?!api|uploads).*/, (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  } catch {
    console.warn('  WARN: dist/ missing — run npm run build first');
  }
}

await ensureDirs();

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLanIp();
  const webPort = hasDist ? PORT : 5173;
  console.log('');
  console.log('  ♡ Piyu birthday server');
  console.log(`  API: http://localhost:${PORT}`);
  if (hasDist) {
    console.log(`  Site: http://localhost:${PORT}`);
    console.log(`  Phone (same Wi‑Fi): http://${ip}:${PORT}`);
  } else {
    console.log(`  Phone (same Wi‑Fi): http://${ip}:${webPort}`);
    console.log('  (run npm run dev — Vite proxies uploads to this server)');
  }
  console.log(`  Media → ${UPLOADS_DIR}`);
  console.log(`  Letter → ${LETTER_FILE}`);
  console.log('');
});
