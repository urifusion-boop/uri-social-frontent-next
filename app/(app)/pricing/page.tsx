'use client';

/**
 * Interactive Pricing Page
 * PRD Section 5: Plan Structure - All 5 subscription tiers
 * PRD Section 6.3: Payment Flow - Initiates SQUAD checkout
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/providers/AuthProvider';
import { BillingService, SubscriptionTier } from '@/src/api/BillingService';
import { Check, Zap, TrendingUp, Briefcase, Star } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, userDetails } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const data = await BillingService.getSubscriptionTiers();
      setTiers(data);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tierId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setSelectedTier(tierId);
    setPurchasing(true);

    try {
      // PRD 6.3: Initialize SQUAD payment
      const paymentData = await BillingService.initializePayment(tierId);

      // Redirect to SQUAD checkout page
      window.location.href = paymentData.payment_url;
    } catch (error: unknown) {
      console.error('Payment initialization failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.');
      setPurchasing(false);
      setSelectedTier(null);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'starter':
        return <Zap className="w-8 h-8" />;
      case 'growth':
        return <TrendingUp className="w-8 h-8" />;
      case 'pro':
        return <Star className="w-8 h-8" />;
      case 'agency':
        return <Briefcase className="w-8 h-8" />;
      default:
        return <Check className="w-8 h-8" />;
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'starter':
        return 'from-blue-500 to-cyan-500';
      case 'growth':
        return 'from-green-500 to-emerald-500';
      case 'pro':
        return 'from-purple-500 to-pink-500';
      case 'agency':
        return 'from-orange-500 to-red-500';
      case 'custom':
        return 'from-gray-700 to-gray-900';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const isCurrentPlan = (tierId: string) => {
    return userDetails?.subscriptionTier === tierId;
  };

  const isRecommended = (tierId: string) => {
    return tierId === 'growth'; // PRD: Growth plan is best value
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6" style={{ color: 'black' }}>
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto font-medium">
            1 Credit = 1 Complete Content Campaign with AI-generated images and multi-platform formatting
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-yellow-100 border-3 border-yellow-400 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-bold text-yellow-800">First retry FREE • Second retry = 1 credit</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.tier_id}
              className={`
                relative rounded-2xl border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                hover:translate-x-[-4px] hover:translate-y-[-4px]
                ${isRecommended(tier.tier_id) ? 'xl:col-span-1 lg:scale-105' : ''}
              `}
            >
              {/* Recommended Badge */}
              {isRecommended(tier.tier_id) && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`px-4 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier.tier_id)} text-white text-xs font-bold uppercase shadow-lg`}
                  >
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan(tier.tier_id) && (
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">Current</div>
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getTierColor(tier.tier_id)} flex items-center justify-center text-white mb-4`}
              >
                {getTierIcon(tier.tier_id)}
              </div>

              {/* Tier Name */}
              <h3 className="text-2xl font-black mb-2" style={{ color: 'black' }}>
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black" style={{ color: 'black' }}>
                    {BillingService.formatNGN(tier.price_ngn)}
                  </span>
                  {tier.tier_id !== 'custom' && <span className="text-gray-600 font-semibold">/month</span>}
                </div>
                <p className="text-sm text-gray-600 font-medium mt-1">
                  {tier.tier_id === 'custom'
                    ? 'Per credit'
                    : `${tier.credits} credits • ${BillingService.formatNGN(tier.price_per_credit)}/credit`}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(tier.tier_id)}
                disabled={(purchasing && selectedTier === tier.tier_id) || isCurrentPlan(tier.tier_id)}
                className={`
                  w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-200
                  ${
                    isCurrentPlan(tier.tier_id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${getTierColor(tier.tier_id)} hover:scale-105 active:scale-95 shadow-lg`
                  }
                  ${purchasing && selectedTier === tier.tier_id ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                {purchasing && selectedTier === tier.tier_id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : isCurrentPlan(tier.tier_id) ? (
                  'Current Plan'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* PRD Details Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl font-black mb-6" style={{ color: 'black' }}>
              How Credits Work
            </h2>

            <div className="space-y-6">
              {/* Credit Usage */}
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Credit Usage
                </h3>
                <ul className="space-y-2 ml-8 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>1 credit = 1 complete content campaign (image + caption + multi-platform formatting)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>
                      First retry is <strong>FREE</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Second retry costs 1 credit</span>
                  </li>
                </ul>
              </div>

              {/* Text & Image Rules */}
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">✏️</span>
                  Text & Image Rules
                </h3>
                <ul className="space-y-2 ml-8 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>
                      <strong>Unlimited text rewrites</strong> (caption edits, tone changes, platform variations) — NO
                      COST
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>First image retry is FREE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Second image retry costs 1 credit</span>
                  </li>
                </ul>
              </div>

              {/* Monthly Reset */}
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Monthly Billing
                </h3>
                <ul className="space-y-2 ml-8 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">ℹ️</span>
                    <span>Credits reset every billing cycle (monthly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">ℹ️</span>
                    <span>Unused credits do NOT rollover (subscription plans only)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        {isAuthenticated && (
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/social-media')}
              className="px-8 py-3 rounded-xl bg-white border-3 border-black font-bold hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
