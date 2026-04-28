'use client';

/**
 * Billing Page Component for Workspace
 * Displays credit balance, subscription, transaction history within workspace
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  BillingService,
  BillingCycle,
  CreditBalanceResponse,
  CreditTransaction,
  PaymentTransaction,
  SubscriptionResponse,
  SubscriptionTier,
} from '@/src/api/BillingService';
import Script from 'next/script';

// Squad Payment Modal TypeScript declaration
interface SquadPaymentData {
  transaction_ref: string;
  email: string;
  amount: number;
  [key: string]: unknown;
}

declare global {
  interface Window {
    squadPay: (config: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      transaction_ref: string;
      callback_url?: string;
      onClose?: () => void;
      onLoad?: () => void;
      onSuccess?: (data: SquadPaymentData) => void;
    }) => void;
  }
}

// Icon components
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    arrowUp: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
    arrowDown: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    loader: (
      <>
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </>
    ),
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" style={{ flexShrink: 0 }}>
      {paths[n]}
    </svg>
  );
};

const Bd = ({
  children,
  v = 'default',
}: {
  children: React.ReactNode;
  v?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const styles = {
    default: { bg: 'rgba(194,24,91,.08)', c: '#AD1457', b: 'rgba(194,24,91,.15)' },
    success: { bg: 'rgba(76,175,80,.08)', c: '#2e7d32', b: 'rgba(76,175,80,.15)' },
    warning: { bg: 'rgba(255,193,7,.1)', c: '#f57f17', b: 'rgba(255,193,7,.2)' },
    danger: { bg: 'rgba(220,38,38,.08)', c: '#dc2626', b: 'rgba(220,38,38,.15)' },
  };
  const s = styles[v];
  return (
    <span
      style={{
        background: s.bg,
        color: s.c,
        border: `1px solid ${s.b}`,
        padding: '3px 9px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
};

interface BillingPageProps {
  onBack: () => void;
  initialTab?: 'overview' | 'credits' | 'payments' | 'plans';
}

export default function BillingPage({ onBack, initialTab = 'overview' }: BillingPageProps) {
  const { refreshCreditBalance, userDetails } = useAuth();

  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'payments' | 'plans'>(initialTab);
  const [confirmTier, setConfirmTier] = useState<SubscriptionTier | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly'); // PRD 8.1: Billing cycle selection
  const [showTestTier, setShowTestTier] = useState(false);
  const [testAmount, setTestAmount] = useState<string>('100');
  const [testCredits, setTestCredits] = useState<string>('1');
  const [paymentModal, setPaymentModal] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>({ show: false, type: 'success', message: '' });
  // Production: Always use live mode
  const squadMode = 'live' as const;

  useEffect(() => {
    fetchBillingData();

    // Check if returning from payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference) {
      // User returned from Squad payment - verify the payment
      console.log('Verifying payment with reference:', reference);
      verifyPaymentCallback(reference);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const verifyPaymentCallback = async (transactionRef: string) => {
    try {
      console.log('🔍 Verifying payment:', transactionRef);
      const verified = await BillingService.verifyPayment(transactionRef);

      if (verified) {
        setPaymentModal({ show: true, type: 'success', message: 'Payment successful! Your credits have been added.' });
        // Refresh all data
        await refreshCreditBalance();
        await fetchBillingData();
      } else {
        setPaymentModal({
          show: true,
          type: 'warning',
          message: 'Payment verification failed. Please contact support if amount was deducted.',
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentModal({ show: true, type: 'error', message: 'Failed to verify payment. Please contact support.' });
    }
  };

  const fetchBillingData = async () => {
    try {
      console.log('🚀 [BillingPage] Starting fetchBillingData...');
      setLoading(true);

      console.log('🔍 [BillingPage] Making parallel API calls...');
      const [balanceData, subData, creditTxns, payments, tiersData] = await Promise.all([
        BillingService.getCreditBalance().catch((err) => {
          console.error('❌ [BillingPage] Failed to get credit balance:', err);
          return null;
        }),
        BillingService.getCurrentSubscription().catch((err) => {
          console.error('❌ [BillingPage] Failed to get subscription:', err);
          return null;
        }),
        BillingService.getTransactionHistory(50).catch((err) => {
          console.error('❌ [BillingPage] Failed to get transactions:', err);
          return [];
        }),
        BillingService.getPaymentHistory(20).catch((err) => {
          console.error('❌ [BillingPage] Failed to get payment history:', err);
          return [];
        }),
        BillingService.getSubscriptionTiers().catch((err) => {
          console.error('❌ [BillingPage] Failed to get tiers:', err);
          return [];
        }),
      ]);

      console.log('💰 [BillingPage] Balance data received:', balanceData);
      console.log('📊 [BillingPage] Subscription data:', subData);
      console.log('📜 [BillingPage] Transactions count:', creditTxns.length);

      setBalance(balanceData);
      setSubscription(subData);
      setCreditTransactions(creditTxns);
      setPaymentHistory(payments);
      setTiers(tiersData);

      console.log('✅ [BillingPage] All data fetched successfully');
    } catch (error) {
      console.error('❌ [BillingPage] Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    setConfirmTier(tier);
  };

  const confirmSubscription = async () => {
    if (!confirmTier) return;

    setSubscribing(confirmTier.tier_id);

    try {
      // For test tier, pass custom amounts
      const paymentData =
        confirmTier.tier_id === 'test'
          ? await BillingService.initializePayment(
              confirmTier.tier_id,
              'monthly',
              confirmTier.price_ngn,
              confirmTier.credits
            )
          : await BillingService.initializePayment(confirmTier.tier_id, selectedBillingCycle); // PRD 8.1: Pass selected billing cycle

      // Close confirmation modal
      setConfirmTier(null);

      // Initialize Squad inline payment modal
      if (typeof window !== 'undefined' && window.squadPay) {
        window.squadPay({
          key: paymentData.public_key,
          email: paymentData.email,
          amount: paymentData.amount * 100, // Convert to kobo
          currency: paymentData.currency || 'NGN',
          transaction_ref: paymentData.transaction_ref,
          onClose: () => {
            // User closed the modal without paying
            console.log('Payment modal closed');
            setSubscribing(null);
          },
          onLoad: () => {
            console.log('Payment modal loaded');
          },
          onSuccess: async (data: SquadPaymentData) => {
            // Payment successful - verify with backend
            console.log('Payment successful:', data);
            setSubscribing(null);

            // Verify payment with backend
            await verifyPaymentCallback(data.transaction_ref);
          },
        });
      } else {
        // Fallback to redirect if Squad SDK not loaded
        console.warn('Squad SDK not loaded, redirecting to payment page');
        window.location.href = paymentData.payment_url;
      }
    } catch (error: unknown) {
      console.error('Payment initialization failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.');
      setSubscribing(null);
      setConfirmTier(null);
    }
  };

  const isCurrentPlan = (tierId: string) => {
    return userDetails?.subscriptionTier === tierId;
  };

  const isPopular = (tierId: string) => {
    return tierId === 'growth';
  };

  const handleRefresh = async () => {
    console.log('🔄 [BillingPage] Manual refresh triggered');
    await refreshCreditBalance();
    await fetchBillingData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #f0f0f0',
              borderTop: '3px solid #C2185B',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ color: '#999', fontSize: 13 }}>Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Squad Payment SDK */}
      <Script src="https://checkout.squadco.com/widget/squad.min.js" strategy="lazyOnload" />

      <div
        style={{
          padding: '18px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
      `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#C2185B',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ← Back to Workspace
            </button>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0 }}>Billing & Credits</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Manage your credits and subscription</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleRefresh}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #e5e3df',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <I n="refresh" s={14} c="#666" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #edecea' }}>
          {['overview', 'plans', 'credits', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                color: activeTab === tab ? '#C2185B' : '#999',
                borderBottom: activeTab === tab ? '2px solid #C2185B' : '2px solid transparent',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'credits' ? 'Credit History' : tab === 'plans' ? 'Subscription Plans' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' && (
          <div>
            {/* Billing Cycle Selector - PRD 8.1 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#111' }}>Select Billing Cycle</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {(['monthly', '3_months', '6_months', '12_months'] as BillingCycle[]).map((cycle) => {
                  const isSelected = selectedBillingCycle === cycle;
                  const discount = BillingService.getDiscountPercentage(cycle);

                  return (
                    <button
                      key={cycle}
                      onClick={() => setSelectedBillingCycle(cycle)}
                      style={{
                        flex: '1 1 140px',
                        padding: '14px 18px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid #CD1B78' : '2px solid #e5e3df',
                        background: isSelected ? 'rgba(205,27,120,0.05)' : '#fff',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s',
                      }}
                    >
                      {discount > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: 8,
                            background: '#10b981',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Save {discount}%
                        </div>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#CD1B78' : '#111' }}>
                        {BillingService.getBillingCycleLabel(cycle)}
                      </div>
                      {discount > 0 && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>5% discount</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Payment Button - Hidden in production */}
            {process.env.NEXT_PUBLIC_ENV !== 'production' && process.env.NODE_ENV !== 'production' && false && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  background: '#FEF3C7',
                  borderRadius: 8,
                  border: '1px solid #FCD34D',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
                >
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                    🧪 Test Payment (Temporary)
                  </h4>
                  <button
                    onClick={() => setShowTestTier(!showTestTier)}
                    style={{
                      background: '#FBBF24',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#78350F',
                      cursor: 'pointer',
                    }}
                  >
                    {showTestTier ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showTestTier && (
                  <div>
                    <p style={{ fontSize: 12, color: '#92400E', margin: '0 0 12px' }}>
                      Test the payment flow with any amount. This will be removed in production.
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{ fontSize: 11, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 4 }}
                        >
                          Amount (NGN)
                        </label>
                        <input
                          type="number"
                          value={testAmount}
                          onChange={(e) => setTestAmount(e.target.value)}
                          min="100"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #FCD34D',
                            fontSize: 13,
                            fontFamily: 'var(--wf)',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{ fontSize: 11, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 4 }}
                        >
                          Credits to receive
                        </label>
                        <input
                          type="number"
                          value={testCredits}
                          onChange={(e) => setTestCredits(e.target.value)}
                          min="1"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #FCD34D',
                            fontSize: 13,
                            fontFamily: 'var(--wf)',
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const amount = parseInt(testAmount) || 100;
                        const credits = parseInt(testCredits) || 1;
                        const testTier: SubscriptionTier = {
                          tier_id: 'test',
                          name: 'Test Plan',
                          price_ngn_monthly: amount,
                          price_ngn_3months: amount * 3,
                          price_ngn_6months: amount * 6,
                          price_ngn_12months: amount * 12,
                          credits_monthly: credits,
                          price_ngn: amount,
                          credits: credits,
                          price_per_credit: amount / credits,
                          features: ['Test payment', 'Custom amount', 'Will be removed'],
                          is_active: true,
                        };
                        handleSelectPlan(testTier);
                      }}
                      disabled={subscribing !== null}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#F59E0B',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: subscribing ? 'not-allowed' : 'pointer',
                        opacity: subscribing ? 0.5 : 1,
                      }}
                    >
                      {subscribing === 'test' ? 'Processing...' : 'Test Payment'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {tiers
                .filter((tier) => tier.tier_id !== 'custom')
                .map((tier) => {
                  const current = isCurrentPlan(tier.tier_id);
                  const popular = isPopular(tier.tier_id);

                  // PRD Section 6 & 7: Calculate price and credits for selected billing cycle
                  const price = BillingService.getPriceForCycle(tier, selectedBillingCycle);
                  const credits = BillingService.getCreditsForCycle(tier, selectedBillingCycle);
                  const discount = BillingService.getDiscountPercentage(selectedBillingCycle);

                  return (
                    <div
                      key={tier.tier_id}
                      style={{
                        background: popular ? 'rgba(205, 27, 120, 0.05)' : '#fff',
                        borderRadius: 12,
                        border: popular ? '2px solid #CD1B78' : '1px solid #e5e3df',
                        padding: '20px 18px 18px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Popular Badge */}
                      {popular && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#CD1B78',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Most Popular
                        </div>
                      )}

                      {/* Current Badge */}
                      {current && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: '#10b981',
                            color: '#fff',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Current
                        </div>
                      )}

                      <div style={{ marginBottom: 12 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', color: '#111' }}>{tier.name}</h3>
                        <p style={{ fontSize: 11, color: '#666', margin: 0 }}>
                          {credits} campaigns{selectedBillingCycle !== 'monthly' && ` (${tier.credits_monthly}/mo)`}
                        </p>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 32, fontWeight: 900, color: '#CD1B78' }}>
                            {BillingService.formatNGN(price)}
                          </span>
                          {selectedBillingCycle === 'monthly' && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>/month</span>
                          )}
                        </div>
                        {selectedBillingCycle !== 'monthly' && (
                          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                            {BillingService.formatNGN(
                              Math.round(
                                price /
                                  (selectedBillingCycle === '3_months'
                                    ? 3
                                    : selectedBillingCycle === '6_months'
                                      ? 6
                                      : 12)
                              )
                            )}
                            /month
                          </div>
                        )}
                        {discount > 0 && (
                          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                            💰 Save {discount}% • {BillingService.getBillingCycleLabel(selectedBillingCycle)}
                          </div>
                        )}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #e5e3df', margin: '14px 0' }} />

                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: '0 0 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        {tier.features.map((feature, idx) => (
                          <li
                            key={idx}
                            style={{
                              fontSize: 12,
                              color: '#111',
                              display: 'flex',
                              alignItems: 'start',
                              gap: 6,
                              fontWeight: 500,
                            }}
                          >
                            <I n="check" s={16} c="#CD1B78" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => !current && tier.is_active && handleSelectPlan(tier)}
                        disabled={!tier.is_active || subscribing === tier.tier_id || current}
                        style={{
                          width: '100%',
                          padding: '11px 0',
                          borderRadius: 8,
                          border: current ? '1px solid #e5e3df' : 'none',
                          background: current ? '#f5f5f5' : '#CD1B78',
                          color: current ? '#999' : '#fff',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: current || !tier.is_active ? 'not-allowed' : 'pointer',
                          opacity: subscribing === tier.tier_id ? 0.7 : 1,
                        }}
                      >
                        {subscribing === tier.tier_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <I n="loader" s={14} c="#fff" />
                            Processing...
                          </div>
                        ) : current ? (
                          'Current Plan'
                        ) : (
                          'Subscribe Now'
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div>
            {/* Trial Status Card */}
            {userDetails?.isTrial && (
              <div
                style={{
                  background: userDetails.trialActive
                    ? 'linear-gradient(135deg, rgba(205,27,120,.04) 0%, rgba(160,21,96,.04) 100%)'
                    : 'rgba(239,68,68,.04)',
                  borderRadius: 12,
                  border: `1px solid ${userDetails.trialActive ? 'rgba(205,27,120,.15)' : 'rgba(239,68,68,.15)'}`,
                  padding: 18,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: userDetails.trialActive ? '#CD1B78' : '#DC2626',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {userDetails.trialActive ? '✦ Free Trial Active' : '✦ Free Trial Expired'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                    {userDetails.trialActive ? (
                      <>
                        <strong>{userDetails.trialDaysRemaining ?? 0}</strong> day
                        {(userDetails.trialDaysRemaining ?? 0) !== 1 ? 's' : ''} remaining
                        {' · '}
                        <strong>{userDetails.trialCreditsRemaining ?? 0}</strong> credit
                        {(userDetails.trialCreditsRemaining ?? 0) !== 1 ? 's' : ''} left
                      </>
                    ) : (
                      'Upgrade to a plan to continue creating content.'
                    )}
                  </div>
                </div>
                {!userDetails.subscriptionTier && (
                  <button
                    onClick={() => setActiveTab('plans')}
                    style={{
                      background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userDetails.trialActive ? 'View Plans' : 'Upgrade Now'}
                  </button>
                )}
              </div>
            )}

            {/* Credit Balance Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Total Credits */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <I n="trending" s={20} c="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>TOTAL CREDITS</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{balance?.total_credits || 0}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>Monthly allowance</div>
              </div>

              {/* Credits Used */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #ef4444, #f97316)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <I n="arrowDown" s={20} c="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>CREDITS USED</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{balance?.credits_used || 0}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>Consumed this cycle</div>
              </div>

              {/* Credits Remaining */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: `1px solid ${balance?.low_credit_warning ? '#fbbf24' : '#edecea'}`,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: balance?.low_credit_warning
                        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <I n="arrowUp" s={20} c="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>REMAINING</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>
                      {balance?.credits_remaining || 0}
                    </div>
                  </div>
                </div>
                {balance?.low_credit_warning ? (
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⚠️ Running low on credits</div>
                ) : (
                  <div style={{ fontSize: 11, color: '#666' }}>Available for use</div>
                )}
              </div>
            </div>

            {/* Subscription Info */}
            {subscription && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #edecea',
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', textTransform: 'capitalize' }}>
                      {subscription.name}
                    </h2>
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      ₦{subscription.price_ngn.toLocaleString()}/month • {subscription.credits} credits
                    </p>
                    {subscription.next_renewal && (
                      <p
                        style={{
                          fontSize: 12,
                          color: '#999',
                          margin: '8px 0 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <I n="calendar" s={14} c="#999" />
                        Renews on {new Date(subscription.next_renewal).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('plans')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #C2185B, #E91E63)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            {!subscription && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #edecea',
                  padding: 32,
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You don't have an active subscription</p>
                <button
                  onClick={() => setActiveTab('plans')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #C2185B, #E91E63)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  View Subscription Plans
                </button>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {creditTransactions.slice(0, 5).map((txn) => (
                  <div
                    key={txn._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 12,
                      background: '#fafafa',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize' }}>
                        {txn.reason.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {new Date(txn.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: txn.amount > 0 ? '#10b981' : '#ef4444' }}>
                        {txn.amount > 0 ? '+' : ''}
                        {txn.amount}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>Balance: {txn.balance_after}</div>
                    </div>
                  </div>
                ))}
                {creditTransactions.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>All Credit Transactions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {creditTransactions.map((txn) => (
                <div
                  key={txn._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 12,
                    background:
                      txn.type === 'allocation' ? '#f0fdf4' : txn.type === 'deduction' ? '#fef2f2' : '#fafafa',
                    borderRadius: 8,
                    border: `1px solid ${txn.type === 'allocation' ? '#d1fae5' : txn.type === 'deduction' ? '#fecaca' : '#e5e7eb'}`,
                  }}
                >
                  <div>
                    <Bd v={txn.type === 'allocation' ? 'success' : txn.type === 'deduction' ? 'danger' : 'default'}>
                      {txn.type}
                    </Bd>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6, textTransform: 'capitalize' }}>
                      {txn.reason.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      {new Date(txn.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: txn.amount > 0 ? '#10b981' : '#ef4444' }}>
                      {txn.amount > 0 ? '+' : ''}
                      {txn.amount}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      {txn.balance_before} → {txn.balance_after}
                    </div>
                  </div>
                </div>
              ))}
              {creditTransactions.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>No transactions yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paymentHistory.map((payment) => (
                <div key={payment._id} style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                        {payment.subscription_tier} Plan
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{payment.transaction_ref}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>₦{payment.amount.toLocaleString()}</div>
                      <Bd
                        v={
                          payment.status === 'completed'
                            ? 'success'
                            : payment.status === 'pending'
                              ? 'warning'
                              : payment.status === 'failed'
                                ? 'danger'
                                : 'default'
                        }
                      >
                        {payment.status}
                      </Bd>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(payment.created_at).toLocaleString()}</div>
                </div>
              ))}
              {paymentHistory.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>No payment history yet</p>
              )}
            </div>
          </div>
        )}

        {/* Subscription Confirmation Modal */}
        {confirmTier && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => !subscribing && setConfirmTier(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                maxWidth: 480,
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: '#111' }}>Confirm Subscription</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                You are about to subscribe to the <strong>{confirmTier.name}</strong> plan
              </p>

              <div
                style={{
                  background: '#f9f9f9',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                  border: '1px solid #e5e3df',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Plan</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{confirmTier.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Billing Cycle</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                    {BillingService.getBillingCycleLabel(selectedBillingCycle)}
                    {BillingService.getDiscountPercentage(selectedBillingCycle) > 0 && (
                      <span style={{ color: '#10b981', marginLeft: 6 }}>
                        (Save {BillingService.getDiscountPercentage(selectedBillingCycle)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Credits</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                    {BillingService.getCreditsForCycle(confirmTier, selectedBillingCycle)} campaigns
                    {selectedBillingCycle !== 'monthly' && (
                      <span style={{ color: '#666', fontWeight: 400, marginLeft: 6 }}>
                        ({confirmTier.credits_monthly}/mo)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Amount</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#CD1B78' }}>
                    {BillingService.formatNGN(BillingService.getPriceForCycle(confirmTier, selectedBillingCycle))}
                  </span>
                </div>
                {selectedBillingCycle !== 'monthly' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>Per month</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
                      {BillingService.formatNGN(
                        Math.round(
                          BillingService.getPriceForCycle(confirmTier, selectedBillingCycle) /
                            (selectedBillingCycle === '3_months' ? 3 : selectedBillingCycle === '6_months' ? 6 : 12)
                        )
                      )}
                    </span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #e5e3df', paddingTop: 12, marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {selectedBillingCycle === 'monthly'
                      ? 'Recurring monthly'
                      : `Billed every ${BillingService.getBillingCycleLabel(selectedBillingCycle).toLowerCase()}`}{' '}
                    • Cancel anytime
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setConfirmTier(null)}
                  disabled={subscribing !== null}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 10,
                    border: '2px solid #e5e3df',
                    background: '#fff',
                    color: '#666',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: subscribing ? 'not-allowed' : 'pointer',
                    opacity: subscribing ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubscription}
                  disabled={subscribing !== null}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: subscribing ? '#999' : '#CD1B78',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: subscribing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {subscribing ? (
                    <>
                      <I n="loader" s={16} c="#fff" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Status Modal */}
      {paymentModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setPaymentModal({ ...paymentModal, show: false })}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,.25)',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              style={{
                padding: '40px 32px 8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background:
                    paymentModal.type === 'success'
                      ? '#FCE4EC'
                      : paymentModal.type === 'warning'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: `3px solid ${
                    paymentModal.type === 'success'
                      ? '#C2185B'
                      : paymentModal.type === 'warning'
                        ? '#F59E0B'
                        : '#EF4444'
                  }`,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color:
                      paymentModal.type === 'success'
                        ? '#C2185B'
                        : paymentModal.type === 'warning'
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                >
                  {paymentModal.type === 'success' ? '✓' : paymentModal.type === 'warning' ? '!' : '✕'}
                </span>
              </div>
            </div>

            {/* Message Body */}
            <div style={{ padding: '0 32px 32px' }}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#111827',
                  margin: '0 0 12px',
                  textAlign: 'center',
                  fontFamily: 'var(--wf)',
                }}
              >
                {paymentModal.type === 'success'
                  ? 'Payment Successful'
                  : paymentModal.type === 'warning'
                    ? 'Payment Issue'
                    : 'Payment Failed'}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#6B7280',
                  margin: '0 0 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--wf)',
                }}
              >
                {paymentModal.message}
              </p>

              {/* Action Button */}
              <button
                onClick={() => {
                  setPaymentModal({ ...paymentModal, show: false });
                  if (paymentModal.type === 'success') {
                    setActiveTab('payments');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: paymentModal.type === 'success' ? '#C2185B' : '#111827',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = paymentModal.type === 'success' ? '#AD1457' : '#1F2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = paymentModal.type === 'success' ? '#C2185B' : '#111827';
                }}
              >
                {paymentModal.type === 'success' ? 'View Payment History' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
