# Subscription Database Setup

Run the following SQL queries in your Supabase dashboard (SQL Editor) to set up subscription tables:

## 1. Create subscriptions table

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

## 2. Create subscription history table (optional, for audit trail)

```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  old_tier VARCHAR(20),
  new_tier VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'upgrade', 'downgrade', 'cancel', 'renew'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

## 3. Alter profiles table to add subscription-related columns

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'on_trial',
ADD COLUMN IF NOT EXISTS subscription_renewal_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS videos_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS feature_ai_analysis BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS feature_product_integration BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS feature_api_access BOOLEAN DEFAULT false;
```

## 4. Create indexes for better query performance

```sql
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
```

## 5. Create RLS policies (if using RLS)

```sql
-- Allow users to read their own subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to update subscriptions
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Allow users to view their subscription history
CREATE POLICY "Users can view their subscription history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);
```

## 6. After creating tables, enable RLS

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
```

## Done!

Your subscription tables are now ready. The DatabaseService will handle all subscription operations.
