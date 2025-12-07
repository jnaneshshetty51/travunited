#!/bin/bash

# Script to fix the Booking.documents column issue
# This will run the migration to add the missing column

echo "🔧 Fixing Booking.documents column issue..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it before running this script"
    exit 1
fi

echo "📋 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo "The Booking.documents column should now exist in your database."
    echo ""
    echo "🔄 Regenerating Prisma Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Prisma Client regenerated successfully!"
        echo ""
        echo "🎉 All done! You should now be able to proceed with payments."
    else
        echo ""
        echo "⚠️  Warning: Prisma Client regeneration had issues, but migration was successful."
    fi
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "If the column already exists, you can try:"
    echo "  npx prisma db push"
    exit 1
fi

