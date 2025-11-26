#!/bin/bash

# Fix Missing Database Tables/Columns Script
# This script helps fix the P2021/P2022 errors by resolving and applying the failed migration

set -e  # Exit on error

echo "🔍 Checking Prisma migration status..."
cd /var/www/travunited/travunitedlatest || { echo "❌ Directory not found"; exit 1; }

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env"
    exit 1
fi

echo "📊 Current migration status:"
npx prisma migrate status

echo ""
read -p "Do you want to resolve and apply the failed migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo "🔧 Resolving failed migration..."
npx prisma migrate resolve --applied "20251125163000_booking_customizations" || {
    echo "⚠️  Migration resolve failed. Trying to mark as rolled back first..."
    npx prisma migrate resolve --rolled-back "20251125163000_booking_customizations"
    npx prisma migrate resolve --applied "20251125163000_booking_customizations"
}

echo "📦 Deploying migrations..."
npx prisma migrate deploy

echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo "🏗️  Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart travunited

echo ""
echo "✅ Migration fix complete!"
echo "📋 Verify the fix by checking:"
echo "   - Booking detail pages should load"
echo "   - Bulk delete should work"
echo "   - Tour pages should load without errors"

