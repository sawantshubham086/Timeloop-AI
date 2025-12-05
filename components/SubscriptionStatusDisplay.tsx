import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { SubscriptionStatus, SubscriptionTier } from '../types';

interface SubscriptionStatusDisplayProps {
  status: SubscriptionStatus | null;
  loading: boolean;
}

export const SubscriptionStatusDisplay: React.FC<SubscriptionStatusDisplayProps> = ({
  status,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-center h-24">
        <div className="animate-pulse text-gray-400">Loading subscription...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getTierColor = () => {
    switch (status.tier) {
      case SubscriptionTier.PREMIUM:
        return 'from-indigo-500 to-purple-500';
      case SubscriptionTier.BASIC:
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-600 to-gray-500';
    }
  };

  const getTierLabel = () => {
    switch (status.tier) {
      case SubscriptionTier.PREMIUM:
        return 'Premium';
      case SubscriptionTier.BASIC:
        return 'Basic';
      default:
        return 'Free Trial';
    }
  };

  const getStatusBadge = () => {
    switch (status.status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          text: 'Active',
          bgColor: 'bg-green-500/10 border border-green-500/30',
        };
      case 'on_trial':
        return {
          icon: <Clock className="w-5 h-5 text-blue-400" />,
          text: 'Trial',
          bgColor: 'bg-blue-500/10 border border-blue-500/30',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          text: 'Cancelled',
          bgColor: 'bg-red-500/10 border border-red-500/30',
        };
      case 'expired':
        return {
          icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
          text: 'Expired',
          bgColor: 'bg-yellow-500/10 border border-yellow-500/30',
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-400" />,
          text: 'Unknown',
          bgColor: 'bg-gray-500/10 border border-gray-500/30',
        };
    }
  };

  const usagePercentage = Math.min(
    100,
    (status.videosUsedThisMonth / status.videoLimit) * 100
  );
  const statusBadge = getStatusBadge();

  return (
    <div className={`bg-gradient-to-r ${getTierColor()} rounded-lg p-0.5 mb-6`}>
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold">{getTierLabel()} Plan</h3>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusBadge.bgColor}`}>
                {statusBadge.icon}
                <span className="text-sm font-semibold">{statusBadge.text}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              {status.status === 'on_trial' || status.status === 'active'
                ? `${status.daysRemaining} days remaining`
                : 'Plan not active'}
            </p>
          </div>

          {status.status === 'active' || status.status === 'on_trial' ? (
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-sm transition">
              Upgrade Plan
            </button>
          ) : (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-sm transition">
              Reactivate
            </button>
          )}
        </div>

        {/* Video Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">Videos this month</span>
            </div>
            <span className="font-semibold">
              {status.videosUsedThisMonth} / {status.videoLimit === 999999 ? '∞' : status.videoLimit}
            </span>
          </div>
          {status.videoLimit !== 999999 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Renewal Info */}
        {status.nextBillingDate && (
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
            Next billing date:{' '}
            <span className="text-gray-300 font-semibold">
              {new Date(status.nextBillingDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatusDisplay;
