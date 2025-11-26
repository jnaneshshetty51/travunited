# Implementation Summary: Policy, Child Pricing & Document Management

## ✅ Completed Features

### 1. Refund & Cancellation Policy Required Before Payment

**Database Changes:**
- ✅ Booking model already had policy acceptance fields (policyAccepted, policyAcceptedAt, policyAcceptedByUserId, policyVersion, policyAcceptedIp, policyAcceptedUserAgent)
- ✅ Added `SitePolicy` model for managing policies with versioning

**API Endpoints:**
- ✅ `GET /api/policies/:key` - Public API to fetch policy content
- ✅ `GET /api/admin/policies` - List all policies (Super Admin only)
- ✅ `POST /api/admin/policies` - Create/update policy (Super Admin only)
- ✅ `GET /api/admin/policies/:key` - Get specific policy
- ✅ `PATCH /api/admin/policies/:key` - Update policy
- ✅ `DELETE /api/admin/policies/:key` - Delete policy

**Frontend:**
- ✅ Policy checkbox on checkout page (disabled Pay button until checked)
- ✅ Policy modal with full content
- ✅ Policy version display
- ✅ Policy version validation in booking API

**Validation:**
- ✅ Server-side validation: policyAccepted must be true
- ✅ Server-side validation: policyVersion must match current policy version
- ✅ Client-side: Pay button disabled until checkbox checked

### 2. Tours: Children Age Condition (Below 12 Considered Kid)

**Database Changes:**
- ✅ Added `travellerType` field to `BookingTraveller` ("adult" | "child" | "infant")
- ✅ Added `childPricingType` to `Tour` ("percent" | "fixed" | "none")
- ✅ Added `childPricingValue` to `Tour` (percentage or fixed amount)
- ✅ Added `childAgeLimit` to `Tour` (default: 12)

**API & Business Logic:**
- ✅ Age calculation from DOB or direct age input
- ✅ Automatic traveller type classification (adult/child/infant)
- ✅ Child pricing calculation (percent or fixed discount)
- ✅ Updated booking price calculation to account for child discounts

**Frontend:**
- ✅ DOB/age fields in traveller form
- ✅ Auto-calculation: DOB → age, age → estimated DOB
- ✅ Visual badge showing "Child (under 12)" or "Infant" next to traveller name
- ✅ Info note: "Children are considered under 12 years"
- ✅ Dynamic pricing preview updates based on child count

**Helper Functions:**
- ✅ `calculateAge()` - Calculate age from DOB
- ✅ `getTravellerType()` - Classify as adult/child/infant
- ✅ `calculateChildPrice()` - Calculate child price based on pricing type

### 3. Tours Application Documents: Domestic vs International

**Database Changes:**
- ✅ Added `requiredDocuments` JSON field to `Tour` (tour-level override)
- ✅ Added `BookingDocument` model for document management
- ✅ Added `documents` JSON field to `Booking` (booking-level documents)
- ✅ `BookingTraveller` already had passport fields

**API Endpoints:**
- ✅ `POST /api/bookings/[id]/documents` - Upload document
- ✅ `GET /api/bookings/[id]/documents` - List documents
- ✅ `PATCH /api/bookings/[id]/documents/[docId]` - Re-upload rejected document
- ✅ `DELETE /api/bookings/[id]/documents/[docId]` - Delete document
- ✅ `POST /api/admin/bookings/[id]/documents/[docId]/review` - Admin review (approve/reject)

**Business Logic:**
- ✅ `isDomesticDestination()` - Determine if destination is domestic
- ✅ `getRequiredDocuments()` - Get required docs based on destination and tour settings
- ✅ `validatePassportExpiry()` - Validate passport expiry (6 months minimum)
- ✅ Document status tracking (PENDING, APPROVED, REJECTED)
- ✅ Rejection reason storage

**Frontend:**
- ✅ Passport upload already implemented
- ✅ Document upload UI ready (can be extended for Aadhaar/PAN)
- ⚠️ **TODO**: Add domestic document upload fields (Aadhaar, PAN) in UI
- ⚠️ **TODO**: Show required documents section based on destination

**Notifications:**
- ✅ Email notification when document is rejected
- ✅ In-app notification for document rejection
- ✅ Direct link to re-upload in notifications

## 📋 Migration Status

**Migration File Created:**
- `prisma/migrations/20251127000000_add_policies_child_pricing_documents/migration.sql`

**Migration includes:**
- SitePolicy table
- BookingDocument table
- BookingTraveller.travellerType column
- Booking.documents JSON column
- Tour.childPricingType, childPricingValue, childAgeLimit columns
- Tour.requiredDocuments JSON column

**To Apply Migration:**
```bash
# On VPS:
set -a; source .env; set +a
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart travunited
```

## 🔧 Configuration Needed

### 1. Create Initial Policy (Super Admin)

After deployment, create the refund & cancellation policy:

```bash
# Via API or Admin UI:
POST /api/admin/policies
{
  "key": "refund_cancellation",
  "title": "Refund & Cancellation Policy",
  "content": "<html>Your policy content here</html>",
  "version": "refund-v1"
}
```

### 2. Configure Tour Child Pricing (Admin)

For each tour that should have child pricing:
- Set `childPricingType`: "percent" (e.g., 50% off) or "fixed" (e.g., ₹5000)
- Set `childPricingValue`: percentage (0-100) or fixed amount in paise
- Set `childAgeLimit`: default is 12, can be customized per tour

### 3. Configure Required Documents (Admin)

For tours:
- Set `requiredDocuments` JSON array: `["passport", "insurance"]` for international
- Or `["adhar", "pan"]` for domestic
- Leave null to use global defaults

## 🧪 Testing Checklist

### Policy Acceptance
- [ ] Try to submit booking without policy checkbox → Should show error
- [ ] Submit with old policy version → Should reject with version mismatch error
- [ ] Submit with correct policy version → Should succeed
- [ ] Verify policyAcceptedAt, policyVersion, policyAcceptedIp stored in DB

### Child Pricing
- [ ] Create booking with traveller age 10 → Should show "Child" badge
- [ ] Create booking with traveller age 15 → Should show as adult
- [ ] Verify child pricing calculation (percent vs fixed)
- [ ] Verify travellerType stored correctly in BookingTraveller

### Document Management
- [ ] Upload passport for international tour → Should succeed
- [ ] Try booking without required documents → Should validate
- [ ] Admin rejects document → User receives notification + email
- [ ] User re-uploads rejected document → Status changes to PENDING
- [ ] Admin approves document → Status changes to APPROVED

## 📝 Remaining Tasks

### Frontend Enhancements (Optional)
1. **Document Upload UI Enhancement:**
   - Add Aadhaar upload field for domestic tours
   - Add PAN upload field for domestic tours
   - Show required documents section dynamically based on destination
   - Add document status indicators in booking details page

2. **Admin UI:**
   - Policy editor page (`/admin/settings/policies`)
   - Tour-level document requirements editor
   - Document review interface in booking details

### Additional Features (Future)
1. Global default document requirements in settings
2. Document templates/guidelines
3. Bulk document approval/rejection
4. Document expiry reminders

## 🚀 Deployment Steps

1. **Pull latest code:**
   ```bash
   cd /var/www/travunited/travunitedlatest
   git pull origin main
   ```

2. **Load environment:**
   ```bash
   set -a; source .env; set +a
   ```

3. **Run migration:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Build and restart:**
   ```bash
   npm ci
   npm run build
   pm2 restart travunited
   ```

5. **Create initial policy:**
   - Log in as Super Admin
   - Navigate to Admin Panel → Settings → Policies
   - Create "refund_cancellation" policy with version "refund-v1"

## 📊 Database Schema Summary

### New Models:
- `SitePolicy` - Policy management with versioning
- `BookingDocument` - Document uploads and status tracking

### Updated Models:
- `Booking` - Added `documents` JSON field
- `BookingTraveller` - Added `travellerType` field
- `Tour` - Added `childPricingType`, `childPricingValue`, `childAgeLimit`, `requiredDocuments`

## 🔐 Security Notes

- Policy acceptance requires valid policy version (prevents stale acceptances)
- Document uploads validated for file type and size
- Admin document review requires admin authentication
- All document operations logged in audit trail

## 📧 Email Notifications

- Document rejection emails sent to user
- Includes rejection reason and re-upload link
- Policy acceptance logged but no email sent (as per spec)

---

**Status:** ✅ Core implementation complete. Ready for testing and deployment.

**Next Steps:**
1. Test all three features end-to-end
2. Create initial policy via admin UI
3. Configure child pricing for tours
4. Test document upload/rejection flow
5. Deploy to production

