'use client';

/**
 * Billing & Credit History Page
 * PRD 7.1: Credit balance display
 * PRD 11: Transaction history (all credit usage events)
 * Shows subscription details, credit transactions, payment history
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  BillingService,
  CreditBalanceResponse,
  CreditTransaction,
  PaymentTransaction,
  SubscriptionResponse,
} from '@/src/api/BillingService';
import { CreditCard, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();
  const { isAuthenticated, refreshCreditBalance } = useAuth();

  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'payments'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchBillingData();
  }, [isAuthenticated, router]);

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
      // Don't redirect on error, just show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshCreditBalance();
    await fetchBillingData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'allocation':
        return <ArrowUpRight className="w-5 h-5 text-green-600" />;
      case 'deduction':
        return <ArrowDownRight className="w-5 h-5 text-red-600" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'allocation':
        return 'text-green-700 bg-green-50';
      case 'deduction':
        return 'text-red-700 bg-red-50';
      case 'refund':
        return 'text-blue-700 bg-blue-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2" style={{ color: 'black' }}>
              Billing & Credits
            </h1>
            <p className="text-gray-600 font-medium">Manage your subscription and view credit usage</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Credit Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Credits */}
          <div className="bg-white rounded-2xl border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Credits</p>
                <p className="text-3xl font-black" style={{ color: 'black' }}>
                  {balance?.total_credits || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Monthly allowance</p>
          </div>

          {/* Credits Used */}
          <div className="bg-white rounded-2xl border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Credits Used</p>
                <p className="text-3xl font-black" style={{ color: 'black' }}>
                  {balance?.credits_used || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Consumed this cycle</p>
          </div>

          {/* Credits Remaining */}
          <div
            className={`bg-white rounded-2xl border-4 ${balance?.low_credit_warning ? 'border-yellow-500' : 'border-black'} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${balance?.low_credit_warning ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-500'} flex items-center justify-center text-white`}
              >
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Credits Remaining</p>
                <p className="text-3xl font-black" style={{ color: 'black' }}>
                  {balance?.credits_remaining || 0}
                </p>
              </div>
            </div>
            {balance?.low_credit_warning && (
              <p className="text-xs text-yellow-700 font-bold">⚠️ Running low on credits</p>
            )}
            {!balance?.low_credit_warning && <p className="text-xs text-gray-500">Available for use</p>}
          </div>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-white rounded-2xl border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black capitalize" style={{ color: 'black' }}>
                  {subscription.name}
                </h2>
                <p className="text-gray-600 font-medium">
                  {BillingService.formatNGN(subscription.price_ngn)}/month • {subscription.credits} credits
                </p>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Change Plan
              </button>
            </div>
            {subscription.next_renewal && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  Renews on {BillingService.formatDate(subscription.next_renewal)} (
                  {BillingService.getDaysUntilRenewal(subscription.next_renewal)} days remaining)
                </span>
              </div>
            )}
          </div>
        )}

        {!subscription && (
          <div className="bg-white rounded-2xl border-4 border-black p-8 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-gray-700 font-medium mb-4">You don't have an active subscription</p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Subscribe Now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                : 'bg-white border-3 border-black hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'credits'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                : 'bg-white border-3 border-black hover:bg-gray-50'
            }`}
          >
            Credit History
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'payments'
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
                : 'bg-white border-3 border-black hover:bg-gray-50'
            }`}
          >
            Payments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'black' }}>
              Recent Activity
            </h2>
            <div className="space-y-4">
              {creditTransactions.slice(0, 5).map((txn) => (
                <div key={txn._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(txn.type)}
                    <div>
                      <p className="font-bold text-sm capitalize">{txn.reason.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-600">{new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.amount > 0 ? '+' : ''}
                      {txn.amount} credits
                    </p>
                    <p className="text-xs text-gray-600">Balance: {txn.balance_after}</p>
                  </div>
                </div>
              ))}
              {creditTransactions.length === 0 && <p className="text-center text-gray-500 py-8">No transactions yet</p>}
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'black' }}>
              Credit Transaction History
            </h2>
            <div className="space-y-3">
              {creditTransactions.map((txn) => (
                <div
                  key={txn._id}
                  className={`flex items-center justify-between p-4 rounded-xl ${getTransactionColor(txn.type)}`}
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(txn.type)}
                    <div>
                      <p className="font-bold text-sm capitalize">{txn.type}</p>
                      <p className="text-xs opacity-75 capitalize">{txn.reason.replace('_', ' ')}</p>
                      <p className="text-xs opacity-60 mt-1">{new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${txn.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {txn.amount > 0 ? '+' : ''}
                      {txn.amount}
                    </p>
                    <p className="text-xs opacity-75">
                      Balance: {txn.balance_before} → {txn.balance_after}
                    </p>
                  </div>
                </div>
              ))}
              {creditTransactions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No credit transactions yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-6" style={{ color: 'black' }}>
              Payment History
            </h2>
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment._id} className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold capitalize">{payment.subscription_tier} Plan</p>
                      <p className="text-xs text-gray-600">{payment.transaction_ref}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black">{BillingService.formatNGN(payment.amount)}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{new Date(payment.created_at).toLocaleString()}</span>
                    <span className="font-semibold capitalize">{payment.payment_method || 'N/A'}</span>
                  </div>
                </div>
              ))}
              {paymentHistory.length === 0 && <p className="text-center text-gray-500 py-8">No payment history yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
