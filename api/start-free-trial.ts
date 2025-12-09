import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier } from '../types';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing auth token' });
  }

  const token = authHeader.substring(7);

  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!checkError && existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Create free trial subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 14 day free trial

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: SubscriptionTier.FREE_TRIAL,
        billing_cycle: 'monthly', // doesn't matter for free trial
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        renewal_date: endDate.toISOString(),
        status: 'on_trial',
        videos_used_this_month: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create free trial subscription', error);
      return res.status(500).json({ error: 'Failed to create free trial subscription' });
    }

    return res.status(200).json({
      success: true,
      subscription: data,
      message: 'Free trial subscription created successfully',
    });
  } catch (err: any) {
    console.error('start-free-trial failed', err);
    return res.status(500).json({
      error: err?.message || 'Failed to start free trial',
    });
  }
}
