import React, { useState, useEffect } from 'react';
import { Check, X, Zap, Crown, Gift } from 'lucide-react';
import { SubscriptionTier, BillingCycle, SubscriptionStatus } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import { createRazorpayOrder, openRazorpayCheckout } from '../services/paymentService';

interface PricingCardProps {
  tier: string;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier, isCurrentPlan, onSelect, isLoading }) => {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan) return null;

  const isFreeTrial = plan.tier === SubscriptionTier.FREE_TRIAL;
  const isBasic = plan.tier === SubscriptionTier.BASIC;
  const isPremium = plan.tier === SubscriptionTier.PREMIUM;

  const bgColor = isPremium
    ? 'border-2 border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/10'
    : isBasic
      ? 'border border-gray-600 bg-gray-800/50'
      : 'border border-gray-700 bg-gray-900/50';

  const badgeColor = isPremium ? 'bg-indigo-500' : isBasic ? 'bg-blue-500' : 'bg-gray-600';
  const icon = isPremium ? <Crown className="w-5 h-5" /> : isBasic ? <Zap className="w-5 h-5" /> : <Gift className="w-5 h-5" />;

  return (
    <div className={`rounded-lg p-6 ${bgColor} relative h-full flex flex-col`}>
      {isPremium && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className={`${badgeColor} p-2 rounded-lg text-white`}>{icon}</div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </div>

      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

      <div className="mb-6">
        <div className="text-3xl font-bold mb-1">
          {plan.price === 0 ? 'Free' : plan.priceDisplay}
        </div>
        {plan.tier !== SubscriptionTier.FREE_TRIAL && (
          <p className="text-xs text-gray-400">
            {plan.billingCycle === BillingCycle.MONTHLY ? 'Billed monthly' : 'Billed yearly'}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <button className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold cursor-default opacity-60">
          Current Plan
        </button>
      ) : (
        <button
          onClick={() => onSelect(tier)}
          disabled={isLoading}
          className={`w-full py-2 rounded-lg font-semibold transition ${isPremium
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
            : isBasic
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
              : 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
            }`}
        >
          {isLoading ? 'Processing...' : isFreeTrial ? 'Start Free Trial' : 'Subscribe Now'}
        </button>
      )}

      {plan.tier === SubscriptionTier.BASIC && plan.billingCycle === BillingCycle.YEARLY && (
        <p className="text-xs text-green-400 text-center mt-2">Save 17% with yearly billing</p>
      )}
      {plan.tier === SubscriptionTier.PREMIUM && plan.billingCycle === BillingCycle.YEARLY && (
        <p className="text-xs text-green-400 text-center mt-2">Save 20% with yearly billing</p>
      )}
    </div>
  );
};

interface SubscriptionPlansSectionProps {
  currentPlan?: SubscriptionStatus;
  onSubscriptionSuccess?: () => void;
}

export const SubscriptionPlansSection: React.FC<SubscriptionPlansSectionProps> = ({
  currentPlan,
  onSubscriptionSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [isLoading, setIsLoading] = useState(false);

  // Get plans based on billing cycle
  const plansTier: { free: string; basic: string; premium: string } = {
    free: 'FREE_TRIAL',
    basic: billingCycle === BillingCycle.MONTHLY ? 'BASIC_MONTHLY' : 'BASIC_YEARLY',
    premium: billingCycle === BillingCycle.MONTHLY ? 'PREMIUM_MONTHLY' : 'PREMIUM_YEARLY',
  };

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        console.error('Invalid plan selected', { planId, availablePlans: Object.keys(SUBSCRIPTION_PLANS) });
        // provide more info to user for debugging
        alert(`Invalid plan selected: ${String(planId)}\nSee console for details.`);
        throw new Error('Invalid plan');
      }

      if (plan.price === 0) {
        // Free trial - no payment needed, just update DB
        console.log('Starting free trial...');
        // TODO: Call backend to create free trial subscription
        // await createFreeTrialSubscription();
        alert('Free trial started! (Backend integration needed)');
        onSubscriptionSuccess?.();
      } else {
        // Paid plan - create Razorpay order
        const orderData = await createRazorpayOrder(
          plan.price,
          plan.priceDisplay
        );

        const result = await openRazorpayCheckout({
          orderId: orderData.orderId,
          amount: orderData.amount,
          keyId: orderData.keyId,
          description: `${plan.name} - Timeloop AI Subscription`,
          prefill: {
            email: undefined, // TODO: Get from user context
          },
        });

        console.log('Payment successful:', result);
        // TODO: Create subscription in backend using payment details
        onSubscriptionSuccess?.();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Subscription failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle(BillingCycle.MONTHLY)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${billingCycle === BillingCycle.MONTHLY
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle(BillingCycle.YEARLY)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${billingCycle === BillingCycle.YEARLY
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <PricingCard
          tier={plansTier.free}
          isCurrentPlan={currentPlan?.tier === SubscriptionTier.FREE_TRIAL && currentPlan?.status === 'on_trial'}
          onSelect={handleSelectPlan}
          isLoading={isLoading}
        />
        <PricingCard
          tier={plansTier.basic}
          isCurrentPlan={currentPlan?.tier === SubscriptionTier.BASIC && currentPlan?.status === 'active'}
          onSelect={handleSelectPlan}
          isLoading={isLoading}
        />
        <PricingCard
          tier={plansTier.premium}
          isCurrentPlan={currentPlan?.tier === SubscriptionTier.PREMIUM && currentPlan?.status === 'active'}
          onSelect={handleSelectPlan}
          isLoading={isLoading}
        />
      </div>

      {/* Comparison Table (optional) */}
      <div className="mt-12 text-center">
        <p className="text-gray-400 text-sm">
          All plans include access to core features. Upgrade anytime — no commitment required.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlansSection;
