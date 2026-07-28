#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/ksr-shipping}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"

echo "==> Deploying KSR Shipping to Hostinger VPS"
echo "    Directory: $APP_DIR"
echo "    Branch:    $BRANCH"

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "ERROR: Missing .env file in $APP_DIR"
  echo "Copy .env.example to .env and set DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_SITE_URL"
  exit 1
fi

echo "==> Loading environment variables..."
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> Pulling latest code..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Installing dependencies..."
npm ci

echo "==> Building Next.js (standalone)..."
npm run build

echo "==> Preparing standalone bundle..."
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/.env

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is empty in .env"
  exit 1
fi

echo "==> Syncing database schema..."
npm run db:push

echo "==> Restarting PM2..."
if pm2 describe ksr-shipping >/dev/null 2>&1; then
  pm2 restart ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js --update-env
fi

pm2 save

echo "==> Deployment complete."
echo "    App should be running on port $PORT"
pm2 status ksr-shipping
