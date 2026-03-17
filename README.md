# Travunited

Travunited is a comprehensive travel and visa management platform designed to streamline the process of applying for visas and booking tours. Built with modern technologies, it offers a robust solution for both travelers and administrators.

## 🚀 Key Features

### 🛂 Visa Management
- **Visa Application System**: Comprehensive flow for visa applications, including document uploads and tracking.
- **Document Management**: Scope-based document requirements (per traveler or per application) with validation.
- **Visa Catalog**: Information on various visa types, countries, processing times, and fees.

### 🏖️ Tour Bookings
- **Tour Packages**: Detailed tour itineraries, day-by-day breakdowns, and image galleries.
- **Flexible Bookings**: Customizable tour options with add-ons and traveler-specific preferences.
- **Itinerary Management**: Rich content management for tour days and highlights.

### 💳 Payments & Finance
- **Razorpay Integration**: Seamless payment processing for applications and bookings.
- **Invoicing**: Automated invoice generation and document management for financial records.

### 📧 Communication & Notifications
- **AWS SES & Nodemailer**: Reliable email delivery for notifications and feedback.
- **Notification System**: In-app and email notifications with user-specific preferences.

### 🛠️ Administration & Content
- **Audit Logs**: Detailed tracking of administrative actions and entity changes.
- **CMS**: Management of blog posts, team members, and site policies.
- **Leads Management**: Tracking corporate leads, contact messages, and custom tour requests.

## 💻 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: [Next-Auth](https://next-auth.js.org/)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **Email**: [AWS SES](https://aws.amazon.com/ses/) & [Nodemailer](https://nodemailer.com/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Rich Text**: [Tiptap](https://tiptap.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🛠️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jnaneshshetty51/travunited.git
   cd Travunited
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` and `.env.local` file based on the provided configuration.

4. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🐋 Docker & Deployment
The project includes a `docker-compose.yml` and deployment scripts (`deploy-vps.sh`) for easy hosting on VPS environments.
