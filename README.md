# init.Habits

Habit tracker terminal-style — local-first PWA.

**Live:** https://ibeeng.github.io/habit-tracker/

## Stack
React 19 · Vite 6 · TypeScript · Tailwind 4 · localStorage

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
