#!/bin/bash

# Script to clear email configuration cache and fix email sending
# Run this to immediately fix the "Email address is not verified" error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 Clearing Email Configuration Cache"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Clearing database cache..."
echo ""

# Try to clear using the API endpoint (requires app to be running)
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   App is running, using API endpoint..."
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/email/clear-cache \
        -H "Content-Type: application/json" \
        2>&1)
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Cache cleared via API"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  ✅ SUCCESS! Email configuration cache cleared"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🎯 Next Steps:"
        echo "   1. ✅ Cache cleared (done)"
        echo "   2. Restart your application"
        echo "   3. Test email at: http://localhost:3000/admin/email-test"
        echo ""
        exit 0
    fi
fi

# If API doesn't work, try using Prisma Studio or direct SQL
echo "   ⚠️  App not running or API call failed"
echo "   Please do ONE of the following:"
echo ""
echo "   Option 1: Use Prisma Studio (Easiest)"
echo "   ─────────────────────────────────────"
echo "   npx prisma studio"
echo "   # Then delete row where key = 'EMAIL_CONFIG'"
echo ""
echo "   Option 2: Use SQL File"
echo "   ─────────────────────────────────────"
echo "   npx prisma db execute --file fix-email-config.sql"
echo ""
echo "   Option 3: Direct Database Access"
echo "   ─────────────────────────────────────"
echo "   psql -U your_username -d your_database -c \"DELETE FROM \\\"Setting\\\" WHERE key = 'EMAIL_CONFIG';\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

