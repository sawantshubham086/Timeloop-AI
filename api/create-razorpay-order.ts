import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'INR', receipt, description = 'Timeloop AI Payment' } = req.body || {};

  if (!amount) {
    return res.status(400).json({ error: 'amount is required (in paise)' });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay keys not configured' });
  }

  try {
    const options: any = {
      amount: amount, // amount in smallest currency unit (e.g., paise for INR)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      description,
      payment_capture: 1, // auto-capture payments
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('create-razorpay-order failed', err);
    return res.status(500).json({
      error: err?.message || 'Failed to create Razorpay order',
    });
  }
}
