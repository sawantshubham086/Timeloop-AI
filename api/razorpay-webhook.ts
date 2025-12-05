import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Lightweight helper to read raw request body without adding the `micro` dependency.
const getRawBody = (req: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err: any) => reject(err));
  });
};

export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing to read raw body for signature verification
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    // Read raw body for signature verification
    const rawBody = await getRawBody(req);
    const payload = rawBody.toString('utf8');
    const signature = req.headers['x-razorpay-signature'] as string | undefined;

    if (!signature) {
      console.warn('Missing x-razorpay-signature header');
      return res.status(400).send('Missing signature header');
    }

    // Verify HMAC SHA256 signature
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (expected !== signature) {
      console.warn('Webhook signature verification failed', {
        expected,
        received: signature,
      });
      return res.status(400).send('Invalid webhook signature');
    }

    // Parse the verified payload
    const event = JSON.parse(payload);
    console.log('✓ Razorpay webhook verified:', event.event);

    // Handle specific events
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.data.object;
        console.log('📊 Payment captured:', {
          payment_id: payment.id,
          order_id: payment.order_id,
          amount: payment.amount,
          status: payment.status,
        });
        // TODO: Update database - mark order as paid, grant access, send receipt
        // Example: await markOrderPaid(payment.order_id, payment.id);
        break;
      }

      case 'payment.failed': {
        const payment = event.data.object;
        console.log('❌ Payment failed:', {
          payment_id: payment.id,
          order_id: payment.order_id,
          reason: payment.error_reason,
        });
        // TODO: Update database - mark order as failed, notify user
        // Example: await notifyPaymentFailed(payment.order_id);
        break;
      }

      case 'order.paid': {
        const order = event.data.object;
        console.log('✅ Order paid:', {
          order_id: order.id,
          amount: order.amount,
          status: order.status,
        });
        // TODO: Handle order completion
        break;
      }

      case 'refund.created': {
        const refund = event.data.object;
        console.log('💸 Refund created:', {
          refund_id: refund.id,
          payment_id: refund.payment_id,
          amount: refund.amount,
        });
        // TODO: Update refund status in database
        break;
      }

      default:
        console.log('ℹ️ Unhandled event:', event.event);
    }

    // Always respond with 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err?.message || 'Webhook processing failed' });
  }
}
