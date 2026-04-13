'use client';

/**
 * Billing Page Component for Workspace
 * Displays credit balance, subscription, transaction history within workspace
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  BillingService,
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
  const [squadMode, setSquadMode] = useState<'sandbox' | 'live'>('sandbox');
  const [loadingMode, setLoadingMode] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      const [balanceData, subData, creditTxns, payments, tiersData, modeData] = await Promise.all([
        BillingService.getCreditBalance().catch(() => null),
        BillingService.getCurrentSubscription().catch(() => null),
        BillingService.getTransactionHistory(50).catch(() => []),
        BillingService.getPaymentHistory(20).catch(() => []),
        BillingService.getSubscriptionTiers().catch(() => []),
        BillingService.getSquadMode().catch(() => ({
          current_mode: 'sandbox',
          available_modes: { sandbox: true, live: false },
        })),
      ]);

      setBalance(balanceData);
      setSubscription(subData);
      setCreditTransactions(creditTxns);
      setPaymentHistory(payments);
      setTiers(tiersData);
      setSquadMode(modeData.current_mode as 'sandbox' | 'live');
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setShowModeModal(true);
  };

  const confirmModeSwitch = async () => {
    const newMode = squadMode === 'sandbox' ? 'live' : 'sandbox';
    setLoadingMode(true);

    try {
      await BillingService.setSquadMode(newMode);
      setSquadMode(newMode);
      setShowModeModal(false);
      // Refresh billing data to reflect new mode
      fetchBillingData();
    } catch (error) {
      console.error('Failed to switch mode:', error);
      alert('Failed to switch payment mode. Please try again or contact support.');
    } finally {
      setLoadingMode(false);
    }
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    setConfirmTier(tier);
  };

  const confirmSubscription = async () => {
    if (!confirmTier) return;

    setSubscribing(confirmTier.tier_id);

    try {
      const paymentData = await BillingService.initializePayment(confirmTier.tier_id);

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
            // Payment successful
            console.log('Payment successful:', data);
            alert('Payment successful! Your credits will be added shortly.');
            setSubscribing(null);
            // Refresh billing data
            fetchBillingData();
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
            {/* Squad Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid #e5e3df',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: '#999' }}>Mode:</span>
              <button
                onClick={handleToggleMode}
                disabled={loadingMode}
                style={{
                  position: 'relative',
                  width: 42,
                  height: 22,
                  borderRadius: 11,
                  border: 'none',
                  background: squadMode === 'live' ? '#10b981' : '#f59e0b',
                  cursor: loadingMode ? 'not-allowed' : 'pointer',
                  opacity: loadingMode ? 0.6 : 1,
                  transition: 'background 0.3s ease',
                }}
                title="Click to switch payment mode"
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: squadMode === 'live' ? 22 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.3s ease',
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: squadMode === 'live' ? '#10b981' : '#f59e0b',
                  textTransform: 'uppercase',
                  minWidth: 48,
                }}
              >
                {loadingMode ? 'Wait...' : squadMode === 'live' ? 'Live' : 'Test'}
              </span>
            </div>

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {tiers
              .filter((tier) => tier.tier_id !== 'custom')
              .map((tier) => {
                const current = isCurrentPlan(tier.tier_id);
                const popular = isPopular(tier.tier_id);

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
                      <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{tier.credits} campaigns</p>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: '#CD1B78' }}>
                        {BillingService.formatNGN(tier.price_ngn)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>/month</span>
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
        )}

        {activeTab === 'overview' && (
          <div>
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
                  <span style={{ fontSize: 14, color: '#666' }}>Credits</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{confirmTier.credits} campaigns</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#666' }}>Amount</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#CD1B78' }}>
                    {BillingService.formatNGN(confirmTier.price_ngn)}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #e5e3df', paddingTop: 12, marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: '#999' }}>Recurring monthly • Cancel anytime</span>
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

        {/* Squad Mode Switch Confirmation Modal */}
        {showModeModal && (
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
            onClick={() => !loadingMode && setShowModeModal(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 24,
                maxWidth: 400,
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background:
                      squadMode === 'sandbox'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {squadMode === 'sandbox' ? '🔴' : '🧪'}
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 900, marginBottom: 6, color: '#111' }}>
                  Switch to {squadMode === 'sandbox' ? 'Live' : 'Test'} Mode?
                </h2>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                  {squadMode === 'sandbox' ? 'Enable live payment processing' : 'Switch to test mode'}
                </p>
              </div>

              <div
                style={{
                  background: squadMode === 'sandbox' ? '#fef2f2' : '#fef3c7',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 18,
                  border: `1px solid ${squadMode === 'sandbox' ? '#fecaca' : '#fde68a'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                    {squadMode === 'sandbox' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: squadMode === 'sandbox' ? '#dc2626' : '#d97706',
                        marginBottom: 5,
                      }}
                    >
                      {squadMode === 'sandbox' ? 'Warning: Real Payments' : 'Test Mode Information'}
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        fontSize: 11.5,
                        color: '#666',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      {squadMode === 'sandbox' ? (
                        <>
                          <li>Real money will be charged from customer accounts</li>
                          <li>All transactions will be processed through Squad's live payment gateway</li>
                          <li>Ensure you are ready for production use</li>
                        </>
                      ) : (
                        <>
                          <li>No real money will be charged</li>
                          <li>Use test card details for payments</li>
                          <li>Perfect for testing subscription flows</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowModeModal(false)}
                  disabled={loadingMode}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: '2px solid #e5e3df',
                    background: '#fff',
                    color: '#666',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: loadingMode ? 'not-allowed' : 'pointer',
                    opacity: loadingMode ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModeSwitch}
                  disabled={loadingMode}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    background: loadingMode
                      ? '#999'
                      : squadMode === 'sandbox'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: loadingMode ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {loadingMode ? (
                    <>
                      <I n="loader" s={14} c="#fff" />
                      Switching...
                    </>
                  ) : (
                    `Switch to ${squadMode === 'sandbox' ? 'Live' : 'Test'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
