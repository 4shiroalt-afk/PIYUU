# Happy Birthday Piyu ♡

A cute, minimal birthday website — mobile-first, with photos and letter saved to your project folder.

## Run (computer + phone on same Wi‑Fi)

```bash
npm install
npm run dev
```

1. On your **computer**, open `http://localhost:5173`
2. On your **phone**, open the **Network** URL from the terminal (e.g. `http://192.168.1.5:5173`)

Upload photos from your phone — they save to:

- **Photos:** `data/memories/2021/`, `2022/`, … (image files)
- **Index:** `data/memories.json` (captions + file names)
- **Letter:** `data/letter.txt`

Your browser letter (from before) is copied to the server automatically on first load.

## Production-style (one command, phone + PC)

```bash
npm start
```

Builds the site and runs the server on port **3001**. Open `http://YOUR-PC-IP:3001` on your phone.

## Build only (static, no uploads to folder)

```bash
npm run build
```

Use this later for Netlify/GitHub Pages when photos are baked in.

## Tips

- Phone and PC must be on the **same Wi‑Fi**
- Allow Windows Firewall for Node if the phone cannot connect
- Compress very large photos if uploads are slow
