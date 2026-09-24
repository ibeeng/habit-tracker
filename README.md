# Rootine

Habit tracker terminal-style — PWA. Ikon: lucide Sprout (ISC).

**Live:** https://ibeeng.github.io/habit-tracker/

## Stack
React 19 · Vite 6 · TypeScript · Tailwind 4 · localStorage · Google Sign-In (GIS)

## Setup (login Google)
1. Buat **OAuth Client ID (Web)** di [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Authorized JavaScript origins:
   - dev: `http://localhost:3001`
   - prod: `https://ibeeng.github.io`
3. Local: copy `.env.example` → `.env`, isi `VITE_GOOGLE_CLIENT_ID`
4. GitHub: set repo secret `VITE_GOOGLE_CLIENT_ID` (Settings → Secrets → Actions)

## Run
```bash
npm install
npm run dev    # http://localhost:3001/habit-tracker/
npm run build  # dist/ (base: /habit-tracker/)
```

## Deploy (GitHub Pages / gh-pages branch)
```bash
npm run build
./scripts/deploy.sh
# or: bash scripts/deploy.sh
```

Push source ke `main`:
```bash
git push origin main
```
