'use client';

/**
 * Credit Balance Display Component
 * PRD 7.1: Shows user's credit balance in navbar
 * PRD 7.3: Shows warning when credits ≤ 3
 * PRD 8: Links to pricing page when credits exhausted
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreditBalance() {
  const { userDetails, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  if (!isAuthenticated || !userDetails) {
    return null;
  }

  const creditsRemaining = userDetails.creditsRemaining ?? 0;
  const lowCreditWarning = userDetails.lowCreditWarning ?? false;
  const subscriptionTier = userDetails.subscriptionTier;

  // PRD 8: Credit exhaustion (credits = 0)
  const isExhausted = creditsRemaining === 0;

  // PRD 7.3: Low credit warning (credits ≤ 3)
  const isLowCredit = lowCreditWarning && creditsRemaining > 0;

  // Determine badge color based on credit status
  const getBadgeStyles = () => {
    if (isExhausted) {
      // PRD 8: Exhausted - Red, urgent
      return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
    } else if (isLowCredit) {
      // PRD 7.3: Low credits - Yellow warning
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
    } else {
      // Normal - Green
      return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
    }
  };

  const handleClick = () => {
    if (isExhausted || isLowCredit) {
      // PRD 8: Direct to pricing when exhausted or low
      router.push('/pricing');
    } else {
      // Normal state - go to billing/history
      router.push('/billing');
    }
  };

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-full border-2 cursor-pointer
        transition-all duration-200 select-none
        ${getBadgeStyles()}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isExhausted ? "You've run out of credits. Upgrade to continue." : 'Click to view billing details'}
    >
      {/* Credit Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Credit Count */}
      <span className="text-sm font-bold">{creditsRemaining}</span>

      {/* Label */}
      <span className="text-xs font-medium hidden sm:inline">{creditsRemaining === 1 ? 'credit' : 'credits'}</span>

      {/* Warning Icon for low/exhausted credits */}
      {(isLowCredit || isExhausted) && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4 animate-pulse"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      )}

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 p-3 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-2">
            {/* Status Message */}
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {isExhausted && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {isLowCredit && (
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {!isExhausted && !isLowCredit && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {isExhausted
                    ? "You've run out of credits"
                    : isLowCredit
                      ? "You're running low on credits"
                      : 'Credits available'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {isExhausted
                    ? 'Upgrade your plan to continue generating content'
                    : isLowCredit
                      ? 'Consider upgrading to avoid interruption'
                      : `You have ${creditsRemaining} credits remaining`}
                </p>
              </div>
            </div>

            {/* Subscription Tier */}
            {subscriptionTier && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Plan: <span className="font-semibold text-gray-700 capitalize">{subscriptionTier}</span>
                </p>
              </div>
            )}

            {/* Action CTA */}
            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(isExhausted || isLowCredit ? '/pricing' : '/billing');
                }}
                className="w-full py-2 px-3 text-xs font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
              >
                {isExhausted || isLowCredit ? 'Upgrade Plan' : 'View Billing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
