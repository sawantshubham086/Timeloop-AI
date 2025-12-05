# Subscription System Implementation Guide

## Overview
Timeloop AI now includes a three-tier subscription system with monthly and yearly billing options.

### Plans
- **Free Trial**: 14 days, 5 videos/month
- **Basic**: $9.99/month or $99/year, 50 videos/month
- **Premium**: $29.99/month or $299/year, unlimited videos + API access

---

## What's Implemented

### ✅ Backend
1. **Types** (`types.ts`): SubscriptionTier, BillingCycle, UserSubscription, SubscriptionStatus
2. **Constants** (`constants/subscriptionPlans.ts`): All plan definitions with features and pricing
3. **Database Service** (`src/services/databaseService.ts`): All subscription operations
4. **API Endpoints**:
   - `api/create-razorpay-order.ts` - Create one-time orders (existing)
   - `api/create-subscription.ts` - Create recurring subscriptions
   - `api/razorpay-webhook.ts` - Handle payment events (existing, needs update for subscriptions)

### ✅ Frontend
1. **Components**:
   - `components/SubscriptionPlansSection.tsx` - Pricing page with plan cards and toggle (Monthly/Yearly)
   - `components/SubscriptionStatusDisplay.tsx` - User's current subscription status and usage
   - `src/pages/Dashboard.tsx` - Updated to show subscription status

### ✅ Database Schema
- `subscriptions` table - User subscriptions with Razorpay IDs
- `subscription_history` table - Audit trail (optional)
- Enhanced `profiles` table - Subscription and feature flags

---

## Setup Steps

### 1. Database Setup (Supabase)
Run SQL from `SUBSCRIPTION_DATABASE_SETUP.md` in your Supabase SQL Editor:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free_trial',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'on_trial',
  razorpay_subscription_id VARCHAR(100),
  razorpay_customer_id VARCHAR(100),
  videos_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### 2. Update Environment Variables
Add to `.env.local` (already in `.env.example`):
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### 3. Add Pricing Page to Navigation
In `App.tsx` or routing component, add link to subscription plans:
```tsx
import { SubscriptionPlansSection } from './components/SubscriptionPlansSection';

// In your route/nav:
<SubscriptionPlansSection currentPlan={subscriptionStatus} />
```

### 4. Protect Features Based on Tier
In components where features are used:
```tsx
import { DatabaseService } from './src/services/databaseService';

const MyFeature = () => {
  const [canUse, setCanUse] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const status = await DatabaseService.getSubscriptionStatus();
      setCanUse(status.tier === SubscriptionTier.PREMIUM);
    };
    checkAccess();
  }, []);

  if (!canUse) return <div>This feature requires Premium plan</div>;
  
  return <FeatureComponent />;
};
```

### 5. Handle Video Upload Limits
In `VideoUploader.tsx`:
```tsx
const handleUpload = async (file: File) => {
  const canUpload = await DatabaseService.canUploadVideo();
  if (!canUpload) {
    alert('You have reached your video limit for this month. Upgrade to Premium.');
    return;
  }

  // ... upload video
  await DatabaseService.incrementVideosUsedThisMonth();
};
```

---

## Integration Checklist

### Backend
- [ ] Create `subscriptions` table in Supabase
- [ ] Create `subscription_history` table (optional)
- [ ] Update `profiles` table with subscription columns
- [ ] Implement free trial logic (14-day auto-start on signup)
- [ ] Create `/api/create-subscription.ts` endpoint (already created, needs testing)
- [ ] Update `/api/razorpay-webhook.ts` to handle `subscription.created`, `subscription.charged`, `subscription.paused` events
- [ ] Create `/api/cancel-subscription.ts` endpoint
- [ ] Create cron job to reset `videos_used_this_month` on 1st of each month

### Frontend
- [ ] Add Razorpay checkout script to `index.html`
- [ ] Import `SubscriptionPlansSection` in main page
- [ ] Add "View Plans" button in Dashboard
- [ ] Implement feature gates for API access and advanced features
- [ ] Add subscription status to user profile page
- [ ] Show upgrade CTA when user hits quota

### Testing
- [ ] Test free trial starts on signup
- [ ] Test monthly subscription with Razorpay test cards
- [ ] Test yearly subscription (save 17-20%)
- [ ] Test plan switching (basic → premium, monthly → yearly)
- [ ] Test subscription cancellation
- [ ] Test webhook handling for `subscription.charged` (recurring payment)
- [ ] Test video quota enforcement
- [ ] Test monthly quota reset

---

## Code Examples

### Check if user can access feature
```tsx
const status = await DatabaseService.getSubscriptionStatus();
const hasAPIAccess = status.tier === SubscriptionTier.PREMIUM;
const hasBasicAccess = status.tier !== SubscriptionTier.FREE_TRIAL;
```

### Create subscription on checkout success
```tsx
// After successful Razorpay payment
await DatabaseService.createSubscription(
  SubscriptionTier.BASIC,
  BillingCycle.MONTHLY,
  razorpaySubscriptionId,
  razorpayCustomerId
);
```

### Display usage
```tsx
const status = await DatabaseService.getSubscriptionStatus();
const usagePercent = (status.videosUsedThisMonth / status.videoLimit) * 100;
// Display as progress bar
```

### Handle upgrade request
```tsx
const handleUpgradeClick = async () => {
  const currentStatus = await DatabaseService.getSubscriptionStatus();
  
  // Cancel current subscription if exists
  if (currentStatus.status === 'active') {
    await DatabaseService.cancelSubscription();
  }

  // Create new subscription
  // ... show payment UI
};
```

---

## Webhook Events to Handle

Update `api/razorpay-webhook.ts` to handle:

1. **`subscription.created`** - New subscription started
2. **`subscription.charged`** - Recurring payment successful (monthly/yearly renewal)
3. **`subscription.paused`** - Subscription paused (optional feature)
4. **`subscription.cancelled`** - Subscription cancelled
5. **`subscription.updated`** - Plan changed
6. **`subscription.pending`** - Awaiting first charge
7. **`subscription.halted`** - Payment failed multiple times
8. **`subscription.resumed`** - Subscription resumed after pause

Example webhook handler:
```typescript
case 'subscription.charged': {
  const subscription = event.data.object;
  console.log('Subscription renewed:', subscription.id);
  // Update renewal_date in DB
  // Send receipt email
  // Reset videos_used_this_month
  break;
}

case 'subscription.cancelled': {
  const subscription = event.data.object;
  console.log('Subscription cancelled:', subscription.id);
  // Mark subscription as cancelled in DB
  // Send cancellation email
  break;
}
```

---

## Monthly Quota Reset

Create a scheduled job (using Vercel Cron or Supabase Edge Functions) to run on the 1st of each month:

```typescript
export async function resetMonthlyQuotas() {
  const { error } = await supabase
    .from('subscriptions')
    .update({ videos_used_this_month: 0 })
    .eq('status', 'active');
  
  if (error) console.error('Failed to reset quotas:', error);
}
```

---

## Frontend Routes (Add to routing)

```
/pricing - Subscription plans page
/dashboard/subscription - Subscription status and management
/dashboard/billing - Billing history
/upgrade - Upgrade plan flow
/downgrade - Downgrade plan flow
```

---

## Security Notes

1. **Never expose `RAZORPAY_KEY_SECRET` to client** ✓ (backend only)
2. **Verify webhook signatures** ✓ (already implemented)
3. **Validate subscription status server-side before granting features**
4. **Use RLS policies in Supabase** ✓ (users can only see their own)
5. **Encrypt sensitive data** - Consider for Razorpay customer IDs
6. **Rate limit API endpoints** - To prevent abuse

---

## File Structure

```
timeloop-ai/
├── api/
│   ├── create-razorpay-order.ts (existing)
│   ├── razorpay-webhook.ts (existing, needs update)
│   ├── create-subscription.ts (new)
│   └── cancel-subscription.ts (TODO)
├── components/
│   ├── SubscriptionPlansSection.tsx (new)
│   ├── SubscriptionStatusDisplay.tsx (new)
│   └── ...
├── constants/
│   └── subscriptionPlans.ts (new)
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx (updated)
│   │   └── ...
│   └── services/
│       └── databaseService.ts (updated)
├── types.ts (updated)
├── SUBSCRIPTION_DATABASE_SETUP.md (new)
└── ...
```

---

## Next Steps

1. **Run database setup** (SQL from `SUBSCRIPTION_DATABASE_SETUP.md`)
2. **Test with Razorpay test cards**
3. **Integrate webhook handling** for subscription events
4. **Add monthly quota reset** (cron job)
5. **Implement feature gates** across the app
6. **Deploy to Vercel** with environment variables set

---

## Testing Checklist

- [ ] Free trial auto-starts on signup
- [ ] User sees correct plan on Dashboard
- [ ] Monthly plan shows ₹999
- [ ] Yearly plan shows ₹9,990 and "Save 17%"
- [ ] Checkout modal opens for paid plans
- [ ] Test card payment succeeds
- [ ] Subscription status updates after payment
- [ ] Videos used count increments
- [ ] Cannot upload after hitting quota
- [ ] Monthly quota resets on 1st of month
- [ ] Cancel subscription works
- [ ] Upgrade to Premium shows unlimited videos

---

## Support

For issues:
1. Check browser console for errors
2. Check Vercel logs
3. Verify Razorpay credentials in `.env.local`
4. Confirm database tables created
5. Check Supabase logs for RLS policy errors
