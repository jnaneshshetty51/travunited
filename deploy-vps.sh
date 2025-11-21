#!/bin/bash
# VPS Deployment Script - Resets to GitHub version and redeploys
# Usage: ./deploy-vps.sh

set -e  # Exit on error

echo "🚀 Starting VPS deployment..."

# Navigate to project directory
cd /var/www/travunited/travunitedlatest || {
    echo "❌ Error: Project directory not found!"
    exit 1
}

echo "📂 Current directory: $(pwd)"

# Step 1: Abort any in-progress merge
echo "🔄 Aborting any in-progress merge..."
git merge --abort 2>/dev/null || echo "   (No merge to abort)"

# Step 2: Reset everything to remote main branch
echo "📥 Fetching latest from GitHub..."
git fetch origin

echo "🔄 Resetting to origin/main (discarding local changes)..."
git reset --hard origin/main

# Step 3: Verify clean state
echo "✅ Checking git status..."
git status

# Step 4: Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Step 5: Apply database migrations (if .env exists)
if [ -f .env ]; then
    echo "🗄️  Applying database migrations..."
    set -a; source .env; set +a
    npx prisma migrate deploy || {
        echo "⚠️  Warning: Migration failed, but continuing..."
    }
    echo "🔄 Regenerating Prisma Client..."
    npx prisma generate || {
        echo "⚠️  Warning: Prisma generate failed, but continuing..."
    }
else
    echo "⚠️  Warning: .env file not found, skipping migrations"
fi

# Step 6: Build the application
echo "🔨 Building application..."
npm run build

# Step 7: Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart travunited --update-env

echo "✅ Deployment complete!"
echo "📊 Checking PM2 status..."
pm2 status

