import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

interface SubscriptionPayload {
  planId: string; // basic_monthly, basic_yearly, premium_monthly, premium_yearly
  customerId?: string; // Razorpay customer ID
  totalCount?: number; // number of billing cycles (12 for yearly after converting monthly)
}

const PLAN_CONFIG: Record<string, { planName: string; priceInPaise: number; interval: number; period: string }> = {
  basic_monthly: { planName: 'Basic Monthly', priceInPaise: 99900, interval: 1, period: 'monthly' },
  basic_yearly: { planName: 'Basic Yearly', priceInPaise: 999000, interval: 12, period: 'monthly' },
  premium_monthly: { planName: 'Premium Monthly', priceInPaise: 299900, interval: 1, period: 'monthly' },
  premium_yearly: { planName: 'Premium Yearly', priceInPaise: 2999000, interval: 12, period: 'monthly' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { planId, customerId, totalCount } = (req.body || {}) as SubscriptionPayload;

  if (!planId) {
    return res.status(400).json({ error: 'planId is required' });
  }

  if (!PLAN_CONFIG[planId]) {
    return res.status(400).json({ error: 'Invalid planId' });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay keys not configured' });
  }

  try {
    const config = PLAN_CONFIG[planId];

    // Step 1: Create or get plan in Razorpay
    // Note: In production, you should pre-create plans in Razorpay Dashboard
    // and reuse their IDs. For now, we'll create subscriptions inline.

    // Step 2: Create subscription
    const subscriptionOptions: any = {
      plan_id: undefined, // We'll use direct parameters instead
      customer_notify: 1, // Send notifications to customer
      quantity: 1,
      total_count: totalCount || config.interval, // For yearly: 12
      description: config.planName,
    };

    // If customer ID provided, link subscription to customer
    if (customerId) {
      subscriptionOptions.customer_id = customerId;
    }

    // If plan_id undefined error, create inline subscription using invoices
    // Alternative: Create subscription directly with amount (newer API)
    const directSubscription = await (razorpay as any).subscriptions.create({
      period: config.period,
      interval: config.interval,
      amount: config.priceInPaise,
      currency: 'INR',
      total_count: totalCount || config.interval,
      description: config.planName,
      customer_notify: 1,
    } as any);

    return res.status(200).json({
      subscriptionId: directSubscription.id,
      planId: planId,
      amount: config.priceInPaise,
      period: config.period,
      interval: config.interval,
      status: directSubscription.status,
    });
  } catch (err: any) {
    console.error('create-subscription failed', err);
    return res.status(500).json({
      error: err?.message || 'Failed to create subscription',
    });
  }
}
