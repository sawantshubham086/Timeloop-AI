import React, { useState, useEffect } from 'react';
import { SubscriptionPlansSection } from '../../components/SubscriptionPlansSection';
import { SubscriptionStatusDisplay } from '../../components/SubscriptionStatusDisplay';
import { DatabaseService } from '../services/databaseService';
import { SubscriptionStatus } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface PricingPageProps {
  onBack?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const status = await DatabaseService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    // Refresh subscription status after purchase
    loadSubscriptionStatus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Subscription Plans
            </h1>
            <p className="text-gray-400 text-lg">
              Choose the perfect plan for your video analysis needs
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        {/* Current Subscription Status */}
        {subscriptionStatus && (
          <div className="mb-12">
            <SubscriptionStatusDisplay status={subscriptionStatus} loading={loading} />
          </div>
        )}

        {/* Pricing Cards */}
        <SubscriptionPlansSection
          currentPlan={subscriptionStatus}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />

        {/* FAQ Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-3">❓ Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-1">Can I cancel anytime?</h4>
                <p className="text-gray-400 text-sm">Yes, cancel your subscription anytime. No lock-in period.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Do you offer a free trial?</h4>
                <p className="text-gray-400 text-sm">Yes! Get 14 days free with 5 videos/month. Upgrade anytime.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Can I switch plans?</h4>
                <p className="text-gray-400 text-sm">Yes, upgrade or downgrade anytime. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">What payment methods do you accept?</h4>
                <p className="text-gray-400 text-sm">We accept all major cards via Razorpay (UPI, NetBanking, Cards).</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-3">✨ Premium Perks</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-1">Unlimited Videos</h4>
                <p className="text-gray-400 text-sm">Analyze as many videos as you want, no monthly limits.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">API Access</h4>
                <p className="text-gray-400 text-sm">Integrate Timeloop AI into your own applications.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Priority Support</h4>
                <p className="text-gray-400 text-sm">Get priority support from our team 24/7.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Advanced Features</h4>
                <p className="text-gray-400 text-sm">Access upcoming advanced AI analysis features first.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Questions? Contact us at <span className="text-indigo-400">support@timeloop.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
