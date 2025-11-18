# Razorpay Payment Integration Setup

## Live Configuration

### API Keys
- **Live Key ID**: `rzp_live_RgWRYwBIvTDWg0`
- **Live Key Secret**: `2DXH80QhLv9gTcZhQ1pXgioo`

### Webhook Configuration
- **Webhook URL**: `https://travunited.com/api/webhooks/razorpay`
- **Webhook Secret**: `TRAVunited@@@1234`

## Environment Variables

Add these to your `.env.local` (development) and production environment:

```env
# Razorpay Live Keys
RAZORPAY_KEY_ID=rzp_live_RgWRYwBIvTDWg0
RAZORPAY_KEY_SECRET=2DXH80QhLv9gTcZhQ1pXgioo
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_RgWRYwBIvTDWg0

# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=TRAVunited@@@1234
```

## Razorpay Dashboard Setup

### 1. Configure Webhook URL

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Enter the webhook URL: `https://travunited.com/api/webhooks/razorpay`
5. Select the following events:
   - `payment.captured` - When payment is successfully captured
   - `payment.failed` - When payment fails
   - `order.paid` - When order is paid (optional)
6. Save the webhook secret: `TRAVunited@@@1234`
7. Copy the webhook secret and add it to your environment variables

### 2. Verify Webhook Configuration

The webhook endpoint includes a GET handler for testing:
- Visit: `https://travunited.com/api/webhooks/razorpay`
- Should return: `{ message: "Razorpay webhook endpoint is active", ... }`

## Webhook Events Handled

### `payment.captured`
- Updates payment status to `COMPLETED`
- Updates application/booking status
- Sends confirmation emails
- Logs audit events

### `payment.failed`
- Updates payment status to `FAILED`
- Logs audit events
- Does not override completed payments (idempotency)

### `order.paid`
- Logged but relies on `payment.captured` for processing

## Security Features

1. **Signature Verification**: All webhook requests are verified using HMAC SHA256
2. **Idempotency**: Duplicate webhook events are safely ignored
3. **Status Protection**: Completed payments cannot be overridden

## Testing

### Test Webhook Locally (using ngrok or similar)

1. Start your local server: `npm run dev`
2. Expose local port using ngrok: `ngrok http 3000`
3. Use the ngrok URL in Razorpay dashboard for testing
4. Update webhook URL temporarily for testing

### Test Payment Flow

1. Create a test booking/application
2. Initiate payment
3. Complete payment in Razorpay test mode
4. Verify webhook is called and payment status is updated

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct: `https://travunited.com/api/webhooks/razorpay`
2. Verify webhook secret matches: `TRAVunited@@@1234`
3. Check server logs for webhook requests
4. Verify SSL certificate is valid (required for HTTPS webhooks)

### Signature Verification Failing

1. Ensure `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard
2. Check that the raw request body is being used for signature verification
3. Verify webhook secret doesn't have extra spaces or characters

### Payment Status Not Updating

1. Check webhook logs in server console
2. Verify payment record exists in database
3. Check for idempotency (payment might already be completed)
4. Verify database connection is working

## Production Checklist

- [ ] Webhook URL configured in Razorpay dashboard
- [ ] Webhook secret set in environment variables
- [ ] SSL certificate valid (required for HTTPS)
- [ ] Webhook events selected: `payment.captured`, `payment.failed`
- [ ] Test webhook delivery from Razorpay dashboard
- [ ] Monitor webhook logs for errors
- [ ] Set up webhook retry policy in Razorpay dashboard

## Support

For Razorpay support:
- Dashboard: https://dashboard.razorpay.com/
- Documentation: https://razorpay.com/docs/
- Support: support@razorpay.com

