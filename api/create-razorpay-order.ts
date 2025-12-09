import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

function maskSecret(s?: string) {
  if (!s) return '(missing)';
  if (s.length <= 6) return '******';
  return `${s.slice(0, 3)}...${s.slice(-3)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'INR', receipt, description = 'Timeloop AI Payment' } = req.body || {};

  if (!amount) {
    return res.status(400).json({ error: 'amount is required (in paise)' });
  }

  // Provide clearer error message and log masked env var presence
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay env check failed', {
      RAZORPAY_KEY_ID: maskSecret(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET: maskSecret(process.env.RAZORPAY_KEY_SECRET),
    });
    return res.status(500).json({ error: 'Razorpay keys not configured on server (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)' });
  }

  try {
    const options: any = {
      amount: amount, // amount in smallest currency unit (e.g., paise for INR)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      description,
      payment_capture: 1, // auto-capture payments
    };

    console.log('create-razorpay-order request', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
      // do not log secrets
      razorpayKeyPresent: !!process.env.RAZORPAY_KEY_ID,
    });

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    // Try to extract richer error info from Razorpay SDK responses
    console.error('create-razorpay-order failed', err && (err.stack || err));
    const sdkError = err?.error || err?.description || err?.message || JSON.stringify(err);
    return res.status(500).json({
      error: typeof sdkError === 'string' ? sdkError : 'Failed to create Razorpay order',
      details: process.env.NODE_ENV === 'development' ? err : undefined,
    });
  }
}
