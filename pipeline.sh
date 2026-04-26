#!/usr/bin/env bash

set -e

STEP="Initializing"

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

trap 'echo "❌ Deployment failed at step: $STEP"; exit 1' ERR

echo "🚀 Starting deployment..."

# Step 1: Update Bun & PM2
STEP="Install or Update Bun"
if ! command -v bun &> /dev/null
then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$BUN_INSTALL/bin:$PATH"
else
    echo "⬆️ Upgrading Bun..."
    bun upgrade || true
fi

STEP="Update PM2"
echo "⬆️ Updating PM2..."
bun install -g pm2@latest

# Step 2: Pull latest code
STEP="Git Pull"
echo "📥 Pulling latest changes..."
git pull origin master

# Step 3: Install dependencies
STEP="Install Dependencies"
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Step 4: Fix vulnerabilities
STEP="Security Audit"
echo "🔐 Fixing vulnerabilities..."
bun audit || true
bun audit fix || true

# Step 5: Run migrations
STEP="Database Migration"
echo "🗄️ Running migrations..."
bun run db:migrate

# Step 6: Build project
STEP="Build"
echo "🏗️ Building project..."
bun run build

# Step 7: Reload PM2
STEP="PM2 Reload"
echo "♻️ Reloading PM2..."
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs

echo "✅ Deployment completed successfully!"