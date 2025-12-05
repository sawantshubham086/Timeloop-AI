# Razorpay Integration Guide

## Overview
Razorpay is integrated into Timeloop-AI for payment processing. This guide covers setup, testing, and webhook handling.

## Setup

### 1. Get Your Razorpay Credentials
- Sign in at [Razorpay Dashboard](https://dashboard.razorpay.com)
- Go to **Settings → API Keys**
- Copy `Key ID` (Test) and `Key Secret` (Test)
- Go to **Developers → Webhooks** and create an endpoint
- Save the webhook secret when it's generated

### 2. Set Environment Variables
Create `.env.local` in the project root:
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

For production (Vercel):
1. Go to Vercel Project Settings → Environment Variables
2. Add the three variables above (use live keys, not test keys)
3. Ensure they're set for Production environment
4. Redeploy your project

### 3. Webhook Configuration
**URL:** `https://timeloop-ai-git-main-shubham-sawants-projects-3655b16d.vercel.app/api/razorpay-webhook`

**Events to subscribe:**
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `order.paid` - Order completed
- `refund.created` - Refund initiated (optional)

## File Structure

### Backend (`api/`)
- **`create-razorpay-order.ts`** - Creates a Razorpay order server-side
  - Receives: `{ amount: number (paise), currency?: string, description?: string }`
  - Returns: `{ orderId, amount, currency, keyId }`
  
- **`razorpay-webhook.ts`** - Handles Razorpay webhook events
  - Verifies `x-razorpay-signature` using HMAC SHA256
  - Processes: `payment.captured`, `payment.failed`, `order.paid`, `refund.created`
  - Logs to console; add DB updates in the `switch` statement

### Frontend (`services/` and `components/`)
- **`paymentService.ts`** - Client-side helpers
  - `createRazorpayOrder()` - Calls backend to create order
  - `openRazorpayCheckout()` - Opens Razorpay modal
  
- **`ProductIntegration.tsx`** - Add a "Pay with Razorpay" button (see example below)

## Usage Example

### 1. Create Order
```typescript
import { createRazorpayOrder, openRazorpayCheckout } from '../services/paymentService';

// In a React component:
const handlePayment = async () => {
  try {
    // Step 1: Create order on server
    const orderData = await createRazorpayOrder(
      10000, // ₹100 (in paise)
      'Premium Feature Access'
    );

    // Step 2: Open Razorpay checkout
    const result = await openRazorpayCheckout({
      orderId: orderData.orderId,
      amount: orderData.amount,
      keyId: orderData.keyId,
      description: 'Premium Feature Access',
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
      },
    });

    console.log('Payment successful:', result);
    // TODO: Verify payment on server and fulfill order
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### 2. Add to Component
```tsx
<button
  onClick={handlePayment}
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
>
  Pay with Razorpay
</button>
```

### 3. Include Checkout Script
Add to `index.html` (in `<head>`):
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Testing Locally

### Option 1: Using ngrok (Recommended)
```powershell
# Terminal 1: Start dev server
cd "C:\Users\sawan\OneDrive\Documents\Project\timeloop-ai"
npm run dev

# Terminal 2: Start ngrok (forward to port 5173 or 3000)
ngrok http 5173
# Output: Forwarding https://abc123.ngrok.io -> http://localhost:5173
```

1. Register webhook in Razorpay: `https://abc123.ngrok.io/api/razorpay-webhook`
2. Copy the webhook secret to `.env.local`
3. Trigger test payment locally

### Option 2: Deploy to Vercel (Easier)
```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then set environment variables in Vercel dashboard
```

### Test with Razorpay Test Cards
Use these test details in Razorpay checkout:
- **Card:** `4111 1111 1111 1111`
- **Exp:** Any future date (e.g., `12/25`)
- **CVV:** Any 3 digits (e.g., `123`)
- **Name:** Any name
- **Email:** Any email

**Test Payment Status:**
- Amount ending in `1` → Success
- Amount ending in `2` → Declined
- Amount ending in `3` → Pending

### Send Test Webhook
1. Razorpay Dashboard → Webhooks → Open your endpoint
2. Click **Send Test** → Select event (e.g., `payment.captured`)
3. Check your server logs for signature verification and event processing

## Webhook Signature Verification

The webhook handler automatically verifies:
- **Header:** `x-razorpay-signature` (hex-encoded HMAC SHA256)
- **Secret:** `RAZORPAY_WEBHOOK_SECRET`
- **Payload:** Raw request body (never parsed JSON)

If verification fails, webhook returns 400; if valid, returns 200.

## TODO: Database Integration

In `api/razorpay-webhook.ts`, add handlers for:
1. **`payment.captured`** → Mark order as paid, grant access, send confirmation email
2. **`payment.failed`** → Mark order as failed, notify customer, suggest retry
3. **`refund.created`** → Update order status, refund customer account
4. **`order.paid`** → Log analytics, send receipt email

Example (pseudo-code):
```typescript
case 'payment.captured': {
  const { order_id, id: payment_id } = event.data.object;
  // await updateOrderStatus(order_id, 'paid', payment_id);
  // await sendReceiptEmail(order_id);
  // await grantAccess(order_id);
  break;
}
```

## Common Issues

### 1. "Razorpay keys not configured"
- Ensure `.env.local` or Vercel env vars have `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Redeploy after adding to Vercel

### 2. "Invalid webhook signature"
- Confirm `RAZORPAY_WEBHOOK_SECRET` matches the one in Razorpay Dashboard
- Ensure webhook URL in Razorpay exactly matches your deployment domain
- Use ngrok secret if testing locally (different from dashboard secret)

### 3. Webhook not receiving events
- Confirm webhook URL in Razorpay Dashboard is exactly: `https://<your-domain>/api/razorpay-webhook`
- Use Razorpay Dashboard **Send Test** button to verify endpoint is reachable
- Check server logs for 200 response

### 4. "Checkout script not loaded"
- Ensure `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` is in `index.html`
- Check browser console for CORS errors (shouldn't occur for Razorpay CDN)

## Production Checklist

- [ ] Switch to **live keys** (`rzp_live_...`, not `rzp_test_...`)
- [ ] Update `RAZORPAY_WEBHOOK_SECRET` to live webhook secret
- [ ] Add database handlers for all webhook events
- [ ] Test end-to-end payment flow with live cards
- [ ] Set up email notifications for payment success/failure
- [ ] Monitor Razorpay Dashboard for disputes and chargebacks
- [ ] Enable webhook retries in Razorpay (Dashboard → Webhooks → Settings)
- [ ] Document refund policy and process

## Useful Links
- [Razorpay Orders API](https://razorpay.com/docs/api/orders/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Razorpay Checkout JS](https://razorpay.com/docs/checkout/web/)
- [Test Card Numbers](https://razorpay.com/docs/payments/payments/test-payment/)
