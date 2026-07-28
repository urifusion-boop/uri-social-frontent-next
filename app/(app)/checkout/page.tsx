'use client';

/**
 * Checkout Page (redirected from pricing)
 * This page typically won't be seen as users are immediately redirected to SQUAD
 * but serves as a loading/processing state
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BillingService } from '@/src/api/BillingService';
import { useAuth } from '@/src/providers/AuthProvider';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    const tierId = searchParams.get('tier');

    if (!tierId) {
      setStatus('error');
      setErrorMessage('No subscription tier selected');
      return;
    }

    const initializePayment = async (id: string) => {
      try {
        setStatus('processing');

        const paymentData = await BillingService.initializePayment(id);

        // Redirect to SQUAD checkout
        window.location.href = paymentData.payment_url;
      } catch (error: unknown) {
        console.error('Payment initialization failed:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment');
      }
    };

    initializePayment(tierId);
  }, [isAuthenticated, searchParams, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-black mb-4" style={{ color: 'black' }}>
              Payment Error
            </h1>

            <p className="text-gray-700 mb-6 font-medium">{errorMessage}</p>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Back to Pricing
              </button>
              <button
                onClick={() => router.push('/social-media')}
                className="flex-1 py-3 px-6 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Animated Loading Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-black animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-black mb-4" style={{ color: 'black' }}>
            Redirecting to Payment...
          </h1>

          <p className="text-gray-700 mb-6 font-medium">
            Please wait while we securely redirect you to our payment gateway (SQUAD).
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Secure Payment Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-black animate-spin rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-bold text-gray-700">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
