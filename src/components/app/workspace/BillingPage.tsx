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
} from '@/src/api/BillingService';
import { useRouter } from 'next/navigation';

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
}

export default function BillingPage({ onBack }: BillingPageProps) {
  const { refreshCreditBalance } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'payments'>('overview');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      const [balanceData, subData, creditTxns, payments] = await Promise.all([
        BillingService.getCreditBalance().catch(() => null),
        BillingService.getCurrentSubscription().catch(() => null),
        BillingService.getTransactionHistory(50).catch(() => []),
        BillingService.getPaymentHistory(20).catch(() => []),
      ]);

      setBalance(balanceData);
      setSubscription(subData);
      setCreditTransactions(creditTxns);
      setPaymentHistory(payments);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
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
    <div style={{ padding: '18px 24px', maxWidth: 1200, margin: '0 auto' }}>
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

      {/* Credit Balance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
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
              <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{balance?.credits_remaining || 0}</div>
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
          style={{ background: '#fff', borderRadius: 12, border: '1px solid #edecea', padding: 18, marginBottom: 24 }}
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
              onClick={() => router.push('/pricing')}
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
              Change Plan
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
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You don't have an active subscription</p>
          <button
            onClick={() => router.push('/pricing')}
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
            Subscribe Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #edecea' }}>
        {['overview', 'credits', 'payments'].map((tab) => (
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
            {tab === 'credits' ? 'Credit History' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
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
                  background: txn.type === 'allocation' ? '#f0fdf4' : txn.type === 'deduction' ? '#fef2f2' : '#fafafa',
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
    </div>
  );
}
