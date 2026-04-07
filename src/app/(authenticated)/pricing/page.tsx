'use client';

import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import { BillingService, SubscriptionTier } from '@/src/api/BillingService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Container, Divider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { MdCheck, MdStar } from 'react-icons/md';

/**
 * Pricing Page - PRD Section 5 & 6
 * Displays subscription tiers with SQUAD payment integration
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
      // Redirect to SQUAD checkout page
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
        <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#CD1B78' }} />
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #F9FAFB 100%)', minHeight: '100vh', py: 6 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box textAlign="center" mb={6}>
            <Typography fontSize="36px" fontWeight={800} color="#111827" mb={2}>
              Choose Your Plan
            </Typography>
            <Typography fontSize="16px" color="#6B7280" maxWidth={600} mx="auto">
              Generate high-quality social media campaigns with AI. Pay only for what you use. Credits renew monthly.
            </Typography>
            {currentBalance && currentBalance.tier && (
              <Chip
                label={`Current Plan: ${currentBalance.tier} • ${currentBalance.credits} credits remaining`}
                sx={{
                  mt: 2,
                  background: '#CD1B78',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              />
            )}
          </Box>

          {/* Pricing Cards */}
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
            {tiers.map((tier) => {
              const isPopular = tier.name === 'Pro';
              const isCurrent = currentBalance?.tier === tier.name;
              const pricePerCredit = (tier.price_ngn / tier.credits).toFixed(0);

              return (
                <Card
                  key={tier.tier_id}
                  elevation={isPopular ? 8 : 2}
                  sx={{
                    position: 'relative',
                    border: isPopular ? '2px solid #CD1B78' : '1px solid #E5E7EB',
                    borderRadius: '16px',
                    transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s',
                    '&:hover': { transform: isPopular ? 'scale(1.07)' : 'scale(1.02)' },
                  }}
                >
                  {isPopular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                        color: '#fff',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        boxShadow: '0 4px 12px rgba(205, 27, 120, 0.4)',
                      }}
                    >
                      <MdStar size={14} />
                      <Typography fontSize="11px" fontWeight={700} letterSpacing={0.5}>
                        MOST POPULAR
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ p: 3 }}>
                    {/* Tier Name */}
                    <Typography fontSize="20px" fontWeight={700} color="#111827" mb={1}>
                      {tier.name}
                    </Typography>

                    {/* Price */}
                    <Box display="flex" alignItems="baseline" gap={0.5} mb={0.5}>
                      <Typography fontSize="32px" fontWeight={800} color="#CD1B78">
                        {BillingService.formatNGN(tier.price_ngn)}
                      </Typography>
                      <Typography fontSize="14px" color="#6B7280">
                        /month
                      </Typography>
                    </Box>

                    {/* Credits */}
                    <Typography fontSize="14px" color="#6B7280" mb={1}>
                      {tier.credits} campaigns • ₦{pricePerCredit}/campaign
                    </Typography>

                    {/* Features */}
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" flexDirection="column" gap={1.25} mb={3}>
                      {tier.features.map((feature, idx) => (
                        <Box key={idx} display="flex" alignItems="flex-start" gap={1}>
                          <MdCheck size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                          <Typography fontSize="13px" color="#374151" lineHeight={1.6}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Subscribe Button */}
                    <Button
                      fullWidth
                      variant={isPopular ? 'contained' : 'outlined'}
                      disabled={!tier.is_active || subscribing === tier.tier_id || isCurrent}
                      onClick={() => handleSubscribe(tier.tier_id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.25,
                        fontSize: '14px',
                        ...(isPopular
                          ? {
                              background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                              '&:hover': { background: 'linear-gradient(135deg, #A01560 0%, #CD1B78 100%)' },
                            }
                          : {
                              borderColor: '#CD1B78',
                              color: '#CD1B78',
                              '&:hover': { borderColor: '#A01560', background: '#FDF2F8' },
                            }),
                      }}
                    >
                      {subscribing === tier.tier_id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : (
                        `Subscribe to ${tier.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* FAQ / Additional Info */}
          <Box mt={8} textAlign="center" maxWidth={700} mx="auto">
            <Typography fontSize="14px" color="#6B7280" lineHeight={1.8}>
              <strong>How it works:</strong> Credits reset monthly on your subscription anniversary. Unused credits
              don't roll over. First campaign generation uses 1 credit. Additional retries may cost 1 credit (first
              retry is free). Cancel anytime — you'll retain access until your billing period ends.
            </Typography>
            <Typography fontSize="12px" color="#9CA3AF" mt={2}>
              Payments processed securely via <strong>SQUAD</strong>. Nigerian business payments powered by SQUAD
              Payment Gateway.
            </Typography>
          </Box>
        </Container>
      </Box>
    </DashboardLayout>
  );
};

export default PricingPage;
