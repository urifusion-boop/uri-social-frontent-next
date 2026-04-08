'use client';

import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { BillingService, SubscriptionTier } from '@/src/api/BillingService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/**
 * Pricing Page - Modern redesign with Tailwind + shadcn
 * Clean, professional, brand-focused design
 */
const PricingPage = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<{
    credits: number;
    tier: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiersData, balance] = await Promise.all([
          BillingService.getSubscriptionTiers(),
          BillingService.getCreditBalance().catch(() => null),
        ]);
        setTiers(tiersData);
        if (balance) {
          setCurrentBalance({
            credits: balance.credits_remaining,
            tier: balance.subscription_tier,
          });
        }
      } catch (error) {
        console.error('Failed to load pricing:', error);
        ToastService.showToast('Failed to load pricing tiers', ToastTypeEnum.Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (tierId: string) => {
    setSubscribing(tierId);
    try {
      const response = await BillingService.initializePayment(tierId);
      window.location.href = response.payment_url;
    } catch (error: unknown) {
      console.error('Payment initialization failed:', error);
      const err = error as { response?: { data?: { responseMessage?: string } } };
      ToastService.showToast(
        err?.response?.data?.responseMessage || 'Failed to initialize payment',
        ToastTypeEnum.Error
      );
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#CD1B78]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">Choose Your Plan</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate high-quality social media campaigns with AI. Pay only for what you use. Credits renew monthly.
            </p>
            {currentBalance && currentBalance.tier && (
              <Badge className="mt-4 bg-[#CD1B78] hover:bg-[#A01560] text-white px-4 py-1.5">
                Current Plan: {currentBalance.tier} • {currentBalance.credits} credits remaining
              </Badge>
            )}
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {tiers
              .filter((tier) => tier.tier_id !== 'custom')
              .map((tier) => {
                const isPopular = tier.name === 'Growth Plan';
                const isCurrent = currentBalance?.tier === tier.name;
                const pricePerCredit = (tier.price_ngn / tier.credits).toFixed(0);

                return (
                  <Card
                    key={tier.tier_id}
                    className={`relative flex flex-col ${
                      isPopular
                        ? 'border-2 border-[#CD1B78] shadow-lg ring-2 ring-[#CD1B78] ring-opacity-20'
                        : 'border border-gray-200 hover:border-gray-300'
                    } transition-all duration-200 hover:shadow-md bg-white`}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[#CD1B78] hover:bg-[#CD1B78] text-white px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-gray-900">{tier.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {tier.credits} campaigns • ₦{pricePerCredit}/campaign
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 pb-6">
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-[#CD1B78]">
                            {BillingService.formatNGN(tier.price_ngn)}
                          </span>
                          <span className="text-gray-500 text-sm font-medium">/month</span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <Check className="h-5 w-5 text-[#CD1B78] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button
                        onClick={() => handleSubscribe(tier.tier_id)}
                        disabled={!tier.is_active || subscribing === tier.tier_id || isCurrent}
                        className={`w-full font-semibold ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-not-allowed'
                            : 'bg-[#CD1B78] hover:bg-[#A01560] text-white'
                        }`}
                      >
                        {subscribing === tier.tier_id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrent ? (
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

          {/* Footer Info */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="font-semibold text-gray-900">How it works:</strong> Credits reset monthly on your
              subscription anniversary. Unused credits don't roll over. First campaign generation uses 1 credit.
              Additional retries may cost 1 credit (first retry is free). Cancel anytime — you'll retain access until
              your billing period ends.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Payments processed securely via <strong className="text-gray-700">SQUAD</strong>. Nigerian business
              payments powered by SQUAD Payment Gateway.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PricingPage;
