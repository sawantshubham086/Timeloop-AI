import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal webhook handler. For production you should verify the signature
// using `STRIPE_WEBHOOK_SECRET` and the Stripe SDK. This simple handler
// accepts events and logs them (useful for initial setup/testing).

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const event = req.body;
    console.log('Stripe webhook event received:', event?.type);

    // Example handling: checkout.session.completed
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      // TODO: Fulfill order: create DB record, mark subscription active, etc.
      console.log('Checkout session completed:', session?.id);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error', err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
