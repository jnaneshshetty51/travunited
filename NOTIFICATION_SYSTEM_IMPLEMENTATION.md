# Notification System Implementation

## Overview

A comprehensive notification system has been implemented for Travunited, providing in-app notifications and email notifications for customers, admins, and super admins.

## What Was Implemented

### 1. Database Schema

- **Notification Model**: Stores all notifications with fields for userId, type, title, message, link, data (JSON), and channel flags
- **UserNotificationSettings Model**: For future user preference management (email/in-app/push per notification type)

### 2. Central Notification Service (`src/lib/notifications.ts`)

- `notify()` function: Central function to create notifications and optionally send emails
- Supports all notification types (VISA_*, TOUR_*, ADMIN_*, ACCOUNT_*)
- Email integration via Resend API
- Helper functions: `getUnreadNotificationCount()`, `markNotificationAsRead()`, `markAllNotificationsAsRead()`

### 3. API Endpoints

- `GET /api/notifications` - List notifications with filters (visa, tour, payment, system) and pagination
- `POST /api/notifications/:id/read` - Mark a notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count

### 4. Frontend Components

- **NotificationBell Component** (`src/components/notifications/NotificationBell.tsx`):
  - Bell icon with unread count badge
  - Dropdown showing latest 10 notifications
  - Click to mark as read
  - Auto-refreshes every 30 seconds

- **Notifications Page** (`src/app/notifications/page.tsx`):
  - Full notification list with filters
  - Pagination support
  - Mark as read/unread functionality
  - Filter by category (visa, tour, payment, system)

- **Integration**:
  - Added to main Navbar (for customers)
  - Added to AdminLayout header (for admins)

### 5. Notification Integration Points

#### Customer Notifications

**Visa Applications:**
- ✅ Application submitted (on payment success)
- ✅ Status changed (APPROVED, REJECTED, IN_REVIEW, etc.)
- ✅ Document rejected
- ✅ Visa ready (when admin uploads visa document)
- ✅ Payment success/failure

**Tour Bookings:**
- ✅ Booking confirmed (on payment success)
- ✅ Payment success/failure
- ✅ Advance payment received

#### Admin Notifications

**Workload:**
- ✅ New application assigned (bulk assign or claim)
- ✅ New booking assigned (bulk assign)
- ✅ Application claimed

**System:**
- Future: Visa/tour package changes, bulk imports, refunds, etc. (can be added as needed)

## Next Steps

### 1. Run Database Migration

You need to create and run the Prisma migration:

```bash
# Temporarily rename prisma.config.ts if it causes issues
mv prisma.config.ts prisma.config.ts.bak

# Create migration
npx prisma migrate dev --name add_notifications

# Restore config file
mv prisma.config.ts.bak prisma.config.ts
```

Or manually create the migration SQL file in `prisma/migrations/[timestamp]_add_notifications/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleScope" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "link" TEXT,
    "channelEmail" BOOLEAN NOT NULL DEFAULT false,
    "channelInApp" BOOLEAN NOT NULL DEFAULT true,
    "channelPush" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" JSONB NOT NULL DEFAULT '{}',
    "inAppEnabled" JSONB NOT NULL DEFAULT '{}',
    "pushEnabled" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationSettings" ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 2. Environment Variables

Ensure these are set in your `.env`:
- `RESEND_API_KEY` - For email notifications
- `EMAIL_FROM` - Sender email address
- `NEXTAUTH_URL` - Base URL for links in notifications

### 3. Testing

Test the notification system:

1. **Customer Flow:**
   - Submit a visa application → Should receive notification
   - Make payment → Should receive payment success notification
   - Admin changes status → Should receive status update notification

2. **Admin Flow:**
   - Assign application to admin → Admin should receive notification
   - Claim application → Admin should receive notification

3. **UI:**
   - Check notification bell in navbar
   - Check `/notifications` page
   - Verify unread count updates
   - Test mark as read functionality

## Future Enhancements

1. **User Preferences**: Implement UserNotificationSettings to allow users to control which notifications they receive via email
2. **Browser Push**: Add web push notifications using service workers
3. **Notification Templates**: Create more sophisticated email templates
4. **Notification Digest**: Daily/weekly digest emails for users
5. **Admin Dashboard**: Add notification statistics and management
6. **Additional Events**: Add notifications for:
   - Corporate lead creation
   - Bulk import completion
   - Refund processing
   - Admin account changes
   - System alerts

## Files Created/Modified

### Created:
- `src/lib/notifications.ts` - Central notification service
- `src/app/api/notifications/route.ts` - Main notifications API
- `src/app/api/notifications/[id]/read/route.ts` - Mark as read API
- `src/app/api/notifications/unread-count/route.ts` - Unread count API
- `src/components/notifications/NotificationBell.tsx` - Notification bell component
- `src/components/admin/AdminHeader.tsx` - Admin header with notification bell
- `src/app/notifications/page.tsx` - Notifications list page

### Modified:
- `prisma/schema.prisma` - Added Notification and UserNotificationSettings models
- `src/components/layout/Navbar.tsx` - Added notification bell
- `src/components/admin/AdminLayout.tsx` - Added admin header
- `src/app/api/admin/applications/[id]/status/route.ts` - Added notifications
- `src/app/api/admin/applications/[id]/documents/[docId]/review/route.ts` - Added notifications
- `src/app/api/admin/applications/[id]/visa/route.ts` - Added notifications
- `src/app/api/payments/webhook/route.ts` - Added payment notifications
- `src/app/api/admin/applications/bulk/assign/route.ts` - Added assignment notifications
- `src/app/api/admin/applications/[id]/claim/route.ts` - Added claim notifications
- `src/app/api/admin/bookings/bulk/assign/route.ts` - Added booking assignment notifications

## Notes

- Email notifications are sent via Resend API (already configured in the codebase)
- In-app notifications are always created, email sending is optional per notification
- Notifications are automatically linked to relevant pages (applications, bookings, etc.)
- The system is designed to be extensible - new notification types can be easily added

