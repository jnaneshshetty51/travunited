#!/bin/bash
# Complete fix for booking_customizations migration
# This migration was marked as applied but the SQL didn't actually run
# Run this script to apply all missing tables and columns

set -e

echo "🔧 Applying complete booking_customizations migration fix..."

# Navigate to project directory
cd /var/www/travunited/travunitedlatest || {
    echo "❌ Error: Project directory not found!"
    echo "Please update the path in this script or run from the project root"
    exit 1
}

# Load environment variables
if [ -f .env ]; then
    echo "📝 Loading environment variables..."
    set -a
    source .env
    set +a
else
    echo "⚠️  Warning: .env file not found"
    echo "Please ensure DATABASE_URL is set in your environment"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set!"
    echo "Please set DATABASE_URL environment variable or ensure .env file exists"
    exit 1
fi

echo "🗄️  Applying complete migration SQL..."

# Run the complete migration SQL
psql "$DATABASE_URL" -f scripts/apply-booking-customizations-migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration SQL applied successfully!"
else
    echo "❌ Error applying migration SQL. Please check database connection and permissions."
    exit 1
fi

echo "🔄 Regenerating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client regenerated!"
else
    echo "❌ Error regenerating Prisma Client"
    exit 1
fi

echo "🔄 Restarting PM2 process..."
pm2 restart travunited --update-env

if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted!"
else
    echo "⚠️  Warning: PM2 restart may have failed. Please check manually: pm2 restart travunited"
fi

echo ""
echo "✅ Complete migration fix applied!"
echo "📊 Check PM2 logs: pm2 logs travunited --lines 50"
echo ""
echo "This migration adds:"
echo "  - Booking table columns (preferences, policy fields)"
echo "  - BookingTraveller columns (passport fields, metadata)"
echo "  - Tour.requiresPassport column"
echo "  - TourAddOn table"
echo "  - BookingAddOn table"
echo "  - All indexes and foreign keys"

