## Travunited – Feature Overview

### Public Website & Marketing
- **Home & Landing**: Main marketing homepage showcasing services (visas, tours, corporate travel, reviews, certifications, FAQs, support).
- **About & Team**: Company information and detailed team profiles (`about/page.tsx`, `about/team/page.tsx`).
- **Blog**: Public blog listing and single-post pages for SEO and content marketing (`blog/page.tsx`, `blog/[id]/page.tsx`).
- **Corporate Travel**: Corporate lead capture page with form for organizations (`corporate/page.tsx`).
- **Careers**: Careers listing and application submission (`careers/page.tsx`, `app/api/careers/apply/route.ts`).
- **Contact & Help**: Contact form and help/support pages (`contact/page.tsx`, `help/page.tsx`, `app/api/contact/submit/route.ts`, `app/api/help/contact/route.ts`).
- **Static Policies**: Privacy, terms, refund, cookies pages (`privacy/page.tsx`, `terms/page.tsx`, `refund/page.tsx`, `cookies/page.tsx`).

### Authentication & Account Management
- **Signup & Email Verification**: User registration with verification email flow (`signup/page.tsx`, `app/api/auth/signup/route.ts`, `app/api/auth/verify-email/route.ts`, `verify-email/page.tsx`).
- **Login**: Credentials-based login for customers and admins (`login/page.tsx`, `admin/login/page.tsx` via NextAuth).
- **Password Reset**: Forgot-password and reset-password flows including reset-token validation and email sending (`forgot-password/page.tsx`, `reset-password/page.tsx`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/auth/validate-reset-token/route.ts`).
- **Dashboard Account Settings**: Change password, verify email, delete account options (`dashboard/settings/page.tsx`, `/api/auth/change-password`, `/api/auth/verify-email` usage).

### Customer Dashboard (After Login)
- **Dashboard Home**: Overview of applications, bookings, and quick links (`dashboard/page.tsx`).
- **Visa Applications Management**:
  - List and detail pages for user visa applications (`dashboard/applications/page.tsx`, `dashboard/applications/[id]/page.tsx`).
  - Edit application flow (`dashboard/applications/[id]/edit/page.tsx`).
  - Document upload / re-upload for applications (`app/api/applications/[id]/documents/route.ts`, `/reupload/route.ts`).
  - Start fresh application and creation endpoints (`app/api/applications/create/route.ts`, `app/api/applications/start-fresh/route.ts`).
- **Tour Bookings Management**:
  - Booking listing and detail pages (`dashboard/bookings/page.tsx`, `dashboard/bookings/[id]/page.tsx`).
  - Invoice download for bookings and applications (`app/api/invoices/booking/[id]/route.ts`, `/application/[id]/route.ts`, `/download/[type]/[id]/route.ts`).
  - Upload and manage booking documents (`app/api/bookings/[id]/documents/route.ts`, `/[docId]/route.ts`, `/passport-upload/route.ts`).
- **Travellers**: Traveller profiles list and management (`dashboard/travellers/page.tsx`, `app/api/travellers/[id]/route.ts`).
- **Notifications**: In-app notifications list and marking as read (`notifications/page.tsx`, `app/api/notifications/route.ts`, `/[id]/route.ts`).
- **Reviews**:
  - Submit new reviews from dashboard (`dashboard/reviews/new/page.tsx`).
  - Manage own reviews list (`dashboard/reviews/page.tsx`, `app/api/reviews/homepage/route.ts` for homepage reviews).

### Visa & Tour Browsing (Customer-Facing)
- **Visa Discovery**:
  - Visa country list and visa-type detail pages (`visas/page.tsx`, `visas/[country]/page.tsx`, `visas/[country]/[type]/page.tsx`).
  - Visa API for fetching visas and search filters (`app/api/visas/[country]/[slug]/route.ts`, search APIs for countries/visa types).
  - Visa application start page (`apply/visa/[country]/[type]/page.tsx`).
- **Tour Discovery & Booking**:
  - Tours listing and tour detail pages (`tours/page.tsx`, `tours/[id]/page.tsx`).
  - Country-based marketing pages (`country/[slug]/page.tsx`).
  - Tour booking flow with “book tour” pages and thank-you page (`book/tour/[id]/page.tsx`, `bookings/thank-you/page.tsx`, `app/api/bookings/create/route.ts`).
- **Search & Suggestions**:
  - Global search endpoints for tours, visas, destinations, and countries (`app/api/search/route.ts`, `/search/countries/route.ts`, `/search/visa-types/route.ts`, `/search/tour-destinations/route.ts`).

### Payments & Invoicing
- **Razorpay Integration**:
  - Create Razorpay order for payments (`app/api/payments/create-order/route.ts`).
  - Webhook handlers for payment confirmation (`app/api/webhooks/razorpay/route.ts`, `app/api/payments/webhook/route.ts`).
- **Invoices**:
  - Generate and download invoices for applications/bookings (`app/api/invoices/application/[id]/route.ts`, `/booking/[id]/route.ts`, `/download/[type]/[id]/route.ts`).

### Admin – Authentication & Layout
- **Admin Login & Layout**:
  - Dedicated admin login page (`admin/login/page.tsx`).
  - Shared admin layout, header, sidebar, and provider components (`components/admin/*`).
  - Admin dashboard overview (`admin/page.tsx`, `app/api/admin/dashboard/stats/route.ts`).

### Admin – Settings & Configuration
- **General Settings**:
  - Company info, logo, address, support contacts (`admin/settings/general/page.tsx` via `/api/admin/settings/general`).
  - Analytics & tracking (Google Analytics, Meta Pixel).
  - System flags: registrations enabled, maintenance mode & banner text.
- **Email Service & Snippets**:
  - Resend API key and sender emails per module (general/visa/tours).
  - Editable email snippet texts for key flows (visa submitted, docs rejected, visa approved, tours booked/confirmed/vouchers ready).
  - Email configuration cache refresh (`refreshEmailConfigCache`) and config inspection (`/api/admin/email-test/config`).
- **Admin Users (Team Management)**:
  - Team members listing & role management (`admin/settings/admins/page.tsx`, `admin/settings/admins/[id]/page.tsx`, `app/api/admin/settings/admins/route.ts`, `/[id]/route.ts`).
  - Create staff/super admins, activate/deactivate admins.
  - Admin password reset emails (`/api/admin/settings/admins/[id]/reset-password/route.ts`).
  - Detailed admin performance stats (applications/bookings handled, last active).
- **Reports Settings & Audit Settings**:
  - Configure reports access/behavior (`admin/settings/reports/page.tsx`).
  - Configure audit logging and view audit settings (`admin/settings/audit/page.tsx`).

### Admin – Content Management (CMS)
- **Countries CMS**:
  - Manage country list, codes, region, flag URLs, active status (`admin/content/countries/page.tsx`, `/[id]/page.tsx`, `/api/admin/content/countries/*`).
  - Bulk delete countries.
- **Visas CMS**:
  - Visa list and editor for each visa type (`admin/content/visas/page.tsx`, `/[id]/page.tsx`, `/api/admin/content/visas/*`).
  - CSV import/export, template download, and bulk delete.
  - Manage visa-specific fields (pricing, stay, validity, entry type, docs, FAQs, sample visa image, subtypes).
- **Tours CMS**:
  - Tour listing and detailed editor (`admin/content/tours/page.tsx`, `/[id]/page.tsx`, `/api/admin/content/tours/*`).
  - Bulk actions: status, featured flag, delete, CSV import/export, templates.
  - Rich fields: itinerary, add-ons, pricing, metadata, best-for tags, images.
- **Blog CMS**:
  - Blog posts listing, creation, editing (`admin/content/blog/page.tsx`, `/[id]/page.tsx`).
  - SEO fields (meta title, description, focus keyword), cover image upload/URL.
  - Publishing workflow (Draft, Published, Scheduled with date/time).
- **Homepage Reviews CMS**:
  - Manage homepage reviews and ratings (`admin/reviews/homepage/page.tsx`, `/api/admin/reviews/homepage/*`).

### Admin – Operational Management
- **Applications Operations**:
  - Admin list & detail views for applications (`admin/applications/page.tsx`, `/[id]/page.tsx`).
  - Review and change application status, upload/review documents, invoices (`/api/admin/applications/*`).
  - Bulk status updates and bulk email resend for applications (`/bulk/status/route.ts`, `/bulk/resend-email/route.ts`).
- **Bookings Operations**:
  - Admin bookings list and deep detail view (`admin/bookings/page.tsx`, `/[id]/page.tsx`).
  - Create offline bookings, manage activities, documents, invoices.
  - Cancel bookings, send notifications, offline payment recording.
  - Bulk operations: delete, resend emails, exports (`/api/admin/bookings/*`).
- **Customers Management**:
  - Customer listing and detail view with bookings/applications, notes, and activity (`admin/customers/page.tsx`, `/[id]/page.tsx`, `app/api/admin/reports/customers/route.ts`).
- **Team Management**:
  - Public-facing team listing (`team/route.ts`) and admin CRUD for team members (`admin/team/page.tsx`, `/[id]/page.tsx`, `/api/admin/team/*`).
  - Bulk upload via CSV and avatar/image uploads.
- **Form Submissions**:
  - View and export generic form submissions (e.g. marketing/contact forms) (`admin/form-submissions/page.tsx`, `/[id]/page.tsx`, `/api/admin/form-submissions/*`).
- **Corporate Leads**:
  - Admin listing & detail view of corporate leads (`admin/corporate-leads/page.tsx`, `/[id]/page.tsx`, `/api/admin/corporate-leads/*`).
  - Export corporate leads CSV.

### Admin – Careers, Reviews & Homepage
- **Careers Admin**:
  - Manage career postings and export applicants (`admin/careers/page.tsx`, `/[id]/page.tsx`, `/api/admin/careers/*`).
- **Reviews Admin**:
  - Manage all reviews, including homepage-specific reviews & dashboard reviews (`admin/reviews/page.tsx`, `/[id]/page.tsx`, `/api/admin/reviews/*`).

### Admin – Reporting & Analytics
- **Reports Overview**:
  - Central reports index page (`admin/reports/page.tsx`).
- **Visa Reports**:
  - Visa performance, summary, by-country statistics (`admin/reports/visas/performance/page.tsx`, `/summary/page.tsx`, `/by-country/page.tsx`, `/api/admin/reports/visas/*`).
- **Tour Reports**:
  - Tour performance and summary reports (`admin/reports/tours/performance/page.tsx`, `/summary/page.tsx`, `/api/admin/reports/tours/*`).
- **Finance Reports**:
  - Revenue and payments reports for tours/visas (`admin/reports/finance/revenue/page.tsx`, `/payments/page.tsx`, `/api/admin/reports/finance/*`).
- **Customers & Corporate Reports**:
  - Customer reports (`admin/reports/customers/page.tsx`, `/api/admin/reports/customers/route.ts`).
  - Corporate reports (`admin/reports/corporate/page.tsx`, `/api/admin/reports/corporate/route.ts`).
- **Admin / SLA / System Audits**:
  - Admin performance, SLA tracking, system audit logs (`admin/reports/admin/performance/page.tsx`, `/admin/sla/page.tsx`, `/system/audit/page.tsx`, `/api/admin/reports/system/audit/route.ts`).

### Email & Notifications System
- **Email Sending Utilities**:
  - Centralized email sender via Resend with category-based from-address selection (`sendEmail`, `sendUserEmail` in `lib/email.ts`).
  - Templates for: welcome, password reset, email verification, visa/tour payment success/failure, status updates, document rejection, vouchers ready, corporate leads (admin + confirmation), admin welcome.
- **Email Test Center**:
  - Admin-only UI to test all email templates and verify configuration (`admin/email-test/page.tsx`, `/api/admin/email-test/route.ts`, `/config/route.ts`).
- **Notifications**:
  - Generic notification CRUD via API for both user and admin alerts.

### Files, Media & Misc
- **Media Proxy & File Uploads**:
  - Serve media via proxy (`app/api/media/[...key]/route.ts`) and handle generic file uploads (`app/api/files/route.ts`).
- **Custom Requests**:
  - Endpoint for arbitrary custom travel/visa requests (`app/api/custom-requests/route.ts`).
- **Policies API**:
  - Retrieve policy content by key for frontend display (`app/api/policies/[key]/route.ts`).

---

This document is generated from the current Next.js app routes and API endpoints and is meant as a high-level feature map. For implementation details of any feature, refer to the corresponding `page.tsx` and `app/api/*/route.ts` files.


