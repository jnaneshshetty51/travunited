# Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file (never commit this file to git):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/travunited"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# AWS SES (SDK - existing method)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-south-1"
AWS_SES_REGION="ap-south-1"

# AWS SES (SMTP - new Nodemailer method)
SES_SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SES_SMTP_PORT="465"
SES_SMTP_SECURE="true"
SES_SMTP_USER="AKIARRFI2Q3MUPWV5AJM"
SES_SMTP_PASS="your-smtp-password-here"

# Email Configuration
EMAIL_FROM="no-reply@travunited.in"
EMAIL_FROM_GENERAL="no-reply@travunited.in"
EMAIL_FROM_VISA="visa@travunited.in"
EMAIL_FROM_TOURS="tours@travunited.in"
ADMIN_EMAIL="admin@travunited.in"

# Email Provider (choose: 'sdk' or 'smtp')
EMAIL_PROVIDER="smtp"

# AWS S3 (for media uploads)
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="ap-south-1"

# Razorpay
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# App Settings
NEXT_PUBLIC_APP_NAME="TravUnited"
NEXT_PUBLIC_APP_URL="https://travunited.in"
```

## Setup Steps

1. **Copy your SMTP credentials**: Replace `SES_SMTP_PASS` with your actual SMTP password
2. **Set EMAIL_PROVIDER**: Use `"smtp"` for Nodemailer or `"sdk"` for AWS SDK
3. **Verify FROM addresses**: Ensure all email addresses are verified in SES
4. **Deploy environment variables**: Use your hosting provider's secrets management

## Security Notes

- Never commit `.env` to git
- Rotate SMTP credentials if exposed
- Use secrets manager in production (AWS Secrets Manager, Vercel secrets, etc.)
- Monitor SES bounce/complaint rates

