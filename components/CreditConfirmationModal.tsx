'use client';

/**
 * Credit Confirmation Modal
 * PRD 3.3: System must show "This action will use 1 credit. Continue?" before second retry
 * PRD 8: Shows upgrade prompt when credits exhausted
 */

import { useRouter } from 'next/navigation';
import { X, AlertTriangle, Zap } from 'lucide-react';

interface CreditConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creditsRemaining: number;
  retryNumber: number;
  isExhausted?: boolean;
}

export default function CreditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  creditsRemaining,
  retryNumber,
  isExhausted = false,
}: CreditConfirmationModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // PRD 8: Credit exhaustion
  if (isExhausted || creditsRemaining === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-center mb-4" style={{ color: 'black' }}>
            Out of Credits
          </h2>

          {/* PRD 8: "You've run out of credits. Upgrade to continue." */}
          <p className="text-center text-gray-700 mb-6 font-medium">
            You've run out of credits. Upgrade your plan to continue generating content.
          </p>

          {/* Current Status */}
          <div className="bg-red-50 rounded-xl p-4 mb-6 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-900">Credits Remaining</span>
              <span className="text-2xl font-black text-red-600">0</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRD 3.3: Confirmation for second+ retry (costs 1 credit)
  const isFirstRetry = retryNumber === 1;
  const willUseCredit = !isFirstRetry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full ${willUseCredit ? 'bg-yellow-100' : 'bg-green-100'} flex items-center justify-center mx-auto mb-6`}
        >
          {willUseCredit ? (
            <Zap className="w-8 h-8 text-yellow-600" />
          ) : (
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-center mb-4" style={{ color: 'black' }}>
          {willUseCredit ? 'Confirm Retry' : 'Free Retry Available'}
        </h2>

        {/* Message */}
        <p className="text-center text-gray-700 mb-6 font-medium">
          {willUseCredit ? (
            // PRD 3.3: "This action will use 1 credit. Continue?"
            <>
              This action will use <strong>1 credit</strong>. Continue?
            </>
          ) : (
            // First retry is FREE
            <>
              This is your <strong>first retry</strong> — it's completely free! The next retry will cost 1 credit.
            </>
          )}
        </p>

        {/* Credit Info */}
        <div
          className={`rounded-xl p-4 mb-6 border-2 ${willUseCredit ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${willUseCredit ? 'text-yellow-900' : 'text-green-900'}`}>
              Credits Remaining
            </span>
            <span className={`text-2xl font-black ${willUseCredit ? 'text-yellow-600' : 'text-green-600'}`}>
              {creditsRemaining}
            </span>
          </div>
          {willUseCredit && (
            <div className="flex items-center justify-between pt-2 border-t-2 border-yellow-200">
              <span className="text-sm font-semibold text-yellow-900">After This Action</span>
              <span className="text-lg font-black text-yellow-600">{creditsRemaining - 1}</span>
            </div>
          )}
        </div>

        {/* Retry Counter */}
        <div className="bg-gray-100 rounded-lg p-3 mb-6 text-center">
          <p className="text-xs text-gray-600 font-semibold">
            Retry #{retryNumber} {isFirstRetry ? '(FREE)' : '(-1 credit)'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl border-3 border-black bg-white font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-6 rounded-xl ${
              willUseCredit
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            } text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg`}
          >
            {willUseCredit ? 'Use 1 Credit' : 'Retry for Free'}
          </button>
        </div>

        {/* Low Credit Warning */}
        {creditsRemaining <= 3 && creditsRemaining > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <p className="text-xs text-orange-800 font-semibold text-center">
              ⚠️ You're running low on credits. Consider upgrading your plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
