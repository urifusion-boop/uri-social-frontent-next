'use client';

/**
 * Checkout Callback Page
 * PRD 6.3: Payment Flow - Step 7-9
 * User lands here after completing payment on SQUAD
 * Frontend polls backend to verify payment completion
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BillingService } from '@/src/api/BillingService';
import { useAuth } from '@/src/providers/AuthProvider';
import { Check, X, Loader2 } from 'lucide-react';

type VerificationStatus = 'verifying' | 'success' | 'failed' | 'pending';

function CheckoutCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCreditBalance } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const transactionRef = searchParams.get('reference') || searchParams.get('transaction_ref');

    if (!transactionRef) {
      setStatus('failed');
      setMessage('No transaction reference found');
      return;
    }

    const verifyPayment = async (ref: string, attempt: number = 0) => {
      try {
        setAttempts(attempt + 1);

        // PRD 6.3: Frontend polls backend to verify payment
        const verified = await BillingService.verifyPayment(ref);

        if (verified) {
          // Success! Payment completed and credits allocated
          setStatus('success');
          setMessage('Your subscription is now active!');

          // Refresh credit balance in auth context
          await refreshCreditBalance();

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/social-media?welcome=true');
          }, 3000);
        } else if (attempt < 10) {
          // Still pending, retry after 2 seconds
          setStatus('verifying');
          setMessage(`Verifying payment... (${attempt + 1}/10)`);

          setTimeout(() => {
            verifyPayment(ref, attempt + 1);
          }, 2000);
        } else {
          // Max attempts reached, still not verified
          setStatus('pending');
          setMessage('Payment verification is taking longer than expected');
        }
      } catch (error: unknown) {
        console.error('Payment verification error:', error);

        if (attempt < 10) {
          // Retry on error
          setTimeout(() => {
            verifyPayment(ref, attempt + 1);
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(error instanceof Error ? error.message : 'Payment verification failed');
        }
      }
    };

    verifyPayment(transactionRef);
  }, [searchParams, router, refreshCreditBalance]);

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
          </div>
        );
      case 'failed':
        return (
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-12 h-12 text-red-600" strokeWidth={3} />
          </div>
        );
      case 'pending':
        return (
          <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'from-blue-500 to-cyan-500';
      case 'success':
        return 'from-green-500 to-emerald-500';
      case 'failed':
        return 'from-red-500 to-pink-500';
      case 'pending':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">{getStatusIcon()}</div>

          {/* Title */}
          <h1 className="text-3xl font-black mb-4" style={{ color: 'black' }}>
            {getTitle()}
          </h1>

          {/* Message */}
          <p className="text-gray-700 mb-6 font-medium">{message || 'Processing your payment...'}</p>

          {/* Progress Bar for Verifying */}
          {status === 'verifying' && (
            <div className="mb-6">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500`}
                  style={{ width: `${Math.min((attempts / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Attempt {attempts} of 10</p>
            </div>
          )}

          {/* Success Details */}
          {status === 'success' && (
            <div className="bg-green-50 rounded-xl p-4 mb-6 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-bold text-green-900 mb-1">Credits Allocated</p>
                  <p className="text-sm text-green-700">
                    Your credits have been added to your account and you can start creating content immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'success' && (
            <button
              onClick={() => router.push('/social-media')}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Go to Dashboard
            </button>
          )}

          {status === 'failed' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/billing')}
                className="w-full py-3 px-6 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all"
              >
                View Billing History
              </button>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Check Status Again
              </button>
              <button
                onClick={() => router.push('/billing')}
                className="w-full py-3 px-6 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all"
              >
                View Billing History
              </button>
              <p className="text-xs text-gray-500 mt-4">
                If your payment was successful, it will appear in your billing history shortly. Contact support if
                issues persist.
              </p>
            </div>
          )}

          {/* Verifying - No Action Needed */}
          {status === 'verifying' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">Please do not close this page</span>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/contact" className="font-bold text-black underline hover:text-gray-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutCallbackContent />
    </Suspense>
  );
}
