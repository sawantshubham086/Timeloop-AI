import type { VercelRequest, VercelResponse } from '@vercel/node';

// Create a Stripe Checkout Session using the secret key stored server-side.
// Expects POST JSON: { priceId: string, successUrl?: string, cancelUrl?: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  const { priceId, successUrl, cancelUrl } = req.body || {};
  if (!priceId) return res.status(400).json({ error: 'priceId is required' });

  try {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl || 'https://example.com/success');
    params.append('cancel_url', cancelUrl || 'https://example.com/cancel');

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    // Return the session URL to the client
    return res.status(200).json({ url: data.url, id: data.id });
  } catch (err: any) {
    console.error('create-checkout-session failed', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
