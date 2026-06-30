'use client';

/**
 * Pricing Page - Modern, Professional Design
 * PRD Section 5: Plan Structure
 * PRD Section 6.3: Payment Flow - SQUAD Integration
 * Brand colors: Pink (#CD1B78), White, Gray
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/providers/AuthProvider';
import { BillingService, SubscriptionTier, BillingCycle } from '@/src/api/BillingService';
import posthog from 'posthog-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, userDetails } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');

  useEffect(() => {
    fetchTiers();
    posthog.capture('pricing_viewed');
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

    setSubscribing(tierId);
    posthog.capture('plan_selected', { tier_id: tierId });

    try {
      // PRD 6.3: Initialize SQUAD payment
      const paymentData = await BillingService.initializePayment(
        tierId,
        selectedBillingCycle,
        undefined,
        undefined,
        currency
      );

      posthog.capture('checkout_started', { tier_id: tierId, currency, billing_cycle: selectedBillingCycle });
      // Redirect to SQUAD checkout page
      window.location.href = paymentData.payment_url;
    } catch (error: unknown) {
      console.error('Payment initialization failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.');
      setSubscribing(null);
    }
  };

  const isCurrentPlan = (tierId: string) => {
    return userDetails?.subscriptionTier === tierId;
  };

  const isPopular = (tierId: string) => {
    return tierId === 'growth';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#CD1B78]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            1 Credit = 1 Complete Content Campaign with AI-generated images and multi-platform formatting
          </p>

          {/* Currency Selector */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setCurrency('NGN')}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                currency === 'NGN'
                  ? 'bg-[#CD1B78] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              ₦ NGN (Naira)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                currency === 'USD'
                  ? 'bg-[#CD1B78] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              $ USD (US Dollar)
            </button>
          </div>

          {/* Billing Cycle Selector */}
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {(['monthly', '3_months', '6_months', '12_months'] as BillingCycle[]).map((cycle) => {
              const isSelected = selectedBillingCycle === cycle;
              const discount = BillingService.getDiscountPercentage(cycle);

              return (
                <button
                  key={cycle}
                  onClick={() => setSelectedBillingCycle(cycle)}
                  className={`relative px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    isSelected
                      ? 'bg-[#CD1B78] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {discount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                      Save {discount}%
                    </span>
                  )}
                  {BillingService.getBillingCycleLabel(cycle)}
                </button>
              );
            })}
          </div>

          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border border-yellow-300 px-4 py-1.5">
            ⚡ First retry FREE • Second retry = 1 credit
          </Badge>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16 items-stretch">
          {tiers
            .filter((tier) => tier.tier_id !== 'custom')
            .map((tier) => {
              const current = isCurrentPlan(tier.tier_id);
              const popular = isPopular(tier.tier_id);
              const price = BillingService.getPriceForCycle(tier, selectedBillingCycle, currency);
              const credits = BillingService.getCreditsForCycle(tier, selectedBillingCycle);
              const discount = BillingService.getDiscountPercentage(selectedBillingCycle);

              return (
                <Card
                  key={tier.tier_id}
                  className={`relative flex flex-col h-full ${
                    popular
                      ? 'border-2 border-[#CD1B78] shadow-lg ring-2 ring-[#CD1B78] ring-opacity-20'
                      : 'border border-gray-200 hover:border-gray-300'
                  } transition-all duration-200 hover:shadow-md bg-white`}
                >
                  {/* Popular Badge */}
                  {popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#CD1B78] hover:bg-[#CD1B78] text-white px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Current Badge */}
                  {current && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">Current</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 min-h-[80px] flex flex-col justify-start">
                    <CardTitle className="text-xl font-bold text-gray-900">{tier.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      {credits} campaigns
                      {selectedBillingCycle !== 'monthly' && ` (${tier.credits_monthly || tier.credits}/mo)`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 pb-6 flex flex-col">
                    {/* Price */}
                    <div className="mb-6 min-h-[80px]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-[#CD1B78]">
                          {BillingService.formatCurrency(price, currency)}
                        </span>
                        {selectedBillingCycle === 'monthly' && (
                          <span className="text-gray-500 text-sm font-medium">/month</span>
                        )}
                      </div>
                      {selectedBillingCycle !== 'monthly' && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-600">
                            {BillingService.formatCurrency(
                              Math.round(
                                price /
                                  (selectedBillingCycle === '3_months'
                                    ? 3
                                    : selectedBillingCycle === '6_months'
                                      ? 6
                                      : 12)
                              ),
                              currency
                            )}{' '}
                            per month
                          </div>
                          {discount > 0 && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              💰 Save {discount}% • {BillingService.getBillingCycleLabel(selectedBillingCycle)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-2 mt-auto">
                    <Button
                      onClick={() => handleSelectPlan(tier.tier_id)}
                      disabled={!tier.is_active || subscribing === tier.tier_id || current}
                      className={`w-full font-semibold ${
                        current
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-not-allowed'
                          : 'bg-[#CD1B78] hover:bg-[#A01560] text-white'
                      }`}
                    >
                      {subscribing === tier.tier_id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : current ? (
                        'Current Plan'
                      ) : (
                        'Subscribe Now'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>

        {/* How It Works Section */}
        {/* <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">How Credits Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Credit Usage
                </h3>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>Text-only posts: 1 credit • Carousels: 1 credit per image (2-5 images)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>
                      First retry is <strong>FREE</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>Second retry costs 1 credit</span>
                  </li>
                </ul>
              </div>

             
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✏️</span>
                  Text & Image Rules
                </h3>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Unlimited text rewrites</strong> (caption edits, tone changes, platform variations) — NO
                      COST
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>First image retry is FREE</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>Second image retry costs 1 credit</span>
                  </li>
                </ul>
              </div>

             
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Monthly Billing
                </h3>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Credits reset every billing cycle (monthly)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                    <span>Unused subscription credits roll over to next billing cycle</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Cancel anytime — you'll retain access until your billing period ends</span>
                  </li>
                </ul>
              </div>

           
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Payments processed securely via <strong className="text-gray-900">SQUAD</strong>. Nigerian business
                  payments powered by SQUAD Payment Gateway.
                </p>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Back to Dashboard */}
        {isAuthenticated && (
          <div className="text-center mt-12">
            <Button onClick={() => router.push('/social-media')} variant="outline" className="px-8">
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
