#!/usr/bin/env bash
# Build + push dist to gh-pages (GitHub Pages)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
rm -rf /tmp/ht-ghpages-deploy
git worktree prune
git worktree remove /tmp/ht-ghpages --force 2>/dev/null || true
git branch -D gh-pages 2>/dev/null || true
git worktree add /tmp/ht-ghpages -B gh-pages
find /tmp/ht-ghpages -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a dist/. /tmp/ht-ghpages/
touch /tmp/ht-ghpages/.nojekyll
cd /tmp/ht-ghpages
git add -A
git -c user.name=ibeeng -c user.email=bellamujia30@gmail.com commit -m "deploy: $(date +%Y-%m-%d\ %H:%M)"
git push -f origin gh-pages
echo "→ https://ibeeng.github.io/habit-tracker/"
