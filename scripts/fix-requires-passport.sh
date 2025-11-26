#!/bin/bash
# Quick fix script for missing requiresPassport column
# Run this on your VPS: bash scripts/fix-requires-passport.sh

set -e

echo "🔧 Fixing missing requiresPassport column..."

# Navigate to project directory (adjust path if needed)
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

echo "🗄️  Adding requiresPassport column to Tour table..."

# Run SQL to add column if it doesn't exist
psql "$DATABASE_URL" <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Tour' 
        AND column_name = 'requiresPassport'
    ) THEN
        ALTER TABLE "Tour" ADD COLUMN "requiresPassport" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Column requiresPassport added to Tour table';
    ELSE
        RAISE NOTICE 'Column requiresPassport already exists in Tour table';
    END IF;
END \$\$;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Column added successfully!"
else
    echo "❌ Error adding column. Please check database connection."
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
echo "✅ Fix complete! The requiresPassport column should now be available."
echo "📊 Check PM2 logs: pm2 logs travunited"

