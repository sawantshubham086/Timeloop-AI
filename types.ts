export interface SceneSegment {
  timestamp: string;
  timestampSeconds: number;
  description: string;
  prompt: string;
  screenshotUrl?: string;
}

export interface AnalysisResult {
  prompt: string;
  details: {
    subject: string;
    action: string;
    camera: string;
    lighting: string;
    style: string;
  };
  segments: SceneSegment[];
}

export interface VideoData {
  file: File;
  previewUrl: string;
  base64Data: string;
  mimeType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PREVIEW = 'PREVIEW',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Subscription Types
export enum SubscriptionTier {
  FREE_TRIAL = 'free_trial',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  name: string;
  description: string;
  price: number; // in paise for Razorpay
  priceDisplay: string; // formatted for display
  features: string[];
  videoLimit: number;
  sceneLimit: number;
  supportLevel: 'community' | 'email' | 'priority';
  apiAccess: boolean;
  razorpayPlanId?: string; // for Razorpay subscription plans
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  status: 'active' | 'cancelled' | 'expired' | 'on_trial';
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  videosUsedThisMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'on_trial';
  videosUsedThisMonth: number;
  videoLimit: number;
  daysRemaining: number;
  renewalDate?: string;
  nextBillingDate?: string;
}
