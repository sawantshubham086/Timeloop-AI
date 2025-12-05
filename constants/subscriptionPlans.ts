import { SubscriptionPlan, SubscriptionTier, BillingCycle } from '../types';

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE_TRIAL: {
    id: 'free_trial',
    tier: SubscriptionTier.FREE_TRIAL,
    billingCycle: BillingCycle.MONTHLY,
    name: 'Free Trial',
    description: '14 days to explore Timeloop AI',
    price: 0,
    priceDisplay: 'Free',
    features: [
      '5 videos/month',
      'Basic scene analysis',
      'Up to 5 scene segments',
      'Community support',
      'Video preview & download'
    ],
    videoLimit: 5,
    sceneLimit: 5,
    supportLevel: 'community',
    apiAccess: false,
  },
  BASIC_MONTHLY: {
    id: 'basic_monthly',
    tier: SubscriptionTier.BASIC,
    billingCycle: BillingCycle.MONTHLY,
    name: 'Basic Monthly',
    description: 'Perfect for content creators',
    price: 99900, // ₹999 in paise
    priceDisplay: '₹999/month',
    features: [
      '50 videos/month',
      'Standard scene analysis',
      'Up to 20 scene segments',
      'Email support',
      'Advanced filters',
      'Batch processing (5 videos)',
      'Video history (3 months)'
    ],
    videoLimit: 50,
    sceneLimit: 20,
    supportLevel: 'email',
    apiAccess: false,
  },
  BASIC_YEARLY: {
    id: 'basic_yearly',
    tier: SubscriptionTier.BASIC,
    billingCycle: BillingCycle.YEARLY,
    name: 'Basic Yearly',
    description: 'Save 17% with yearly billing',
    price: 99900 * 10, // ₹9,990/year (10 months price)
    priceDisplay: '₹9,990/year',
    features: [
      '50 videos/month',
      'Standard scene analysis',
      'Up to 20 scene segments',
      'Email support',
      'Advanced filters',
      'Batch processing (5 videos)',
      'Video history (12 months)'
    ],
    videoLimit: 50,
    sceneLimit: 20,
    supportLevel: 'email',
    apiAccess: false,
  },
  PREMIUM_MONTHLY: {
    id: 'premium_monthly',
    tier: SubscriptionTier.PREMIUM,
    billingCycle: BillingCycle.MONTHLY,
    name: 'Premium Monthly',
    description: 'For professional teams',
    price: 299900, // ₹2,999 in paise
    priceDisplay: '₹2,999/month',
    features: [
      'Unlimited videos',
      'Advanced scene analysis',
      'Unlimited scene segments',
      'Priority support (24/7)',
      'API access',
      'Batch processing (unlimited)',
      'Video history (lifetime)',
      'Custom branding',
      'Team collaboration (up to 5 users)'
    ],
    videoLimit: 999999,
    sceneLimit: 999999,
    supportLevel: 'priority',
    apiAccess: true,
  },
  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    tier: SubscriptionTier.PREMIUM,
    billingCycle: BillingCycle.YEARLY,
    name: 'Premium Yearly',
    description: 'Save 20% with yearly billing',
    price: 299900 * 10, // ₹29,990/year (10 months price)
    priceDisplay: '₹29,990/year',
    features: [
      'Unlimited videos',
      'Advanced scene analysis',
      'Unlimited scene segments',
      'Priority support (24/7)',
      'API access',
      'Batch processing (unlimited)',
      'Video history (lifetime)',
      'Custom branding',
      'Team collaboration (up to 5 users)',
      'Advanced analytics dashboard'
    ],
    videoLimit: 999999,
    sceneLimit: 999999,
    supportLevel: 'priority',
    apiAccess: true,
  }
};

export const PLANS_LIST = [
  SUBSCRIPTION_PLANS.FREE_TRIAL,
  SUBSCRIPTION_PLANS.BASIC_MONTHLY,
  SUBSCRIPTION_PLANS.BASIC_YEARLY,
  SUBSCRIPTION_PLANS.PREMIUM_MONTHLY,
  SUBSCRIPTION_PLANS.PREMIUM_YEARLY,
];

export const FREE_TRIAL_DAYS = 14;
