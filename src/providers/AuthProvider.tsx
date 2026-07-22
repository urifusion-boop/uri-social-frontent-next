'use client';

import { STORE_KEYS } from '@/src/configs/store.config';
import { ITokenDetails, UserDto } from '@/src/types';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BillingService } from '@/src/api/BillingService';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

interface IAuthContext {
  userDetails: UserDto | null;
  tokenDetails: ITokenDetails | null;
  isAuthenticated: boolean;
  isPending: boolean;
  saveUserDetails: (data: UserDto) => void;
  saveUserTokens: (data: ITokenDetails) => void;
  logoutUser: () => void;
  refreshCreditBalance: () => Promise<void>; // PRD 7.1: Fetch latest credit balance
  refreshTrialStatus: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

// Module-level, not per-effect-instance: a burst of near-simultaneous 401/403s
// (a real scenario — several endpoints commonly fail together right when a token
// expires) each dispatch their own 'unauthorized' event, and React can also have
// more than one live effect instance (StrictMode's dev double-invoke). A flag
// local to the effect closure only dedupes within ONE of those instances; this
// dedupes across all of them, so the toast/redirect only ever fires once.
let handledUnauthorized = false;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userDetails, setUserDetails] = useState<UserDto | null>(null);
  const [tokenDetails, setTokenDetails] = useState<ITokenDetails | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(true);
  // The axios interceptor clears localStorage's tokens SYNCHRONOUSLY, before it
  // ever dispatches 'unauthorized' — so by the time that event's handler runs,
  // localStorage.getItem(STORE_KEYS.USER_TOKENS) is already null even for a real,
  // just-expired session. A ref mirrors React state instead, which the interceptor
  // has no way to touch, so it still reflects the truth at the moment the 403 fired.
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // PRD 7.1: Fetch credit balance on mount and auth change
  const refreshCreditBalance = useCallback(async () => {
    if (!isAuthenticated || !tokenDetails?.accessToken) return;

    try {
      const balance = await BillingService.getCreditBalance();
      const creditData = {
        creditsRemaining: balance.credits_remaining,
        creditBalance: balance.total_credits,
        subscriptionTier: balance.subscription_tier,
        lowCreditWarning: balance.low_credit_warning,
      };

      setUserDetails((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          ...creditData,
        };
        localStorage.setItem(STORE_KEYS.USER_DETAILS, JSON.stringify(updated));
        return updated;
      });

      // Emit event for other components to react
      EventBus.emit(EVENTS.CREDIT_UPDATED, creditData);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
      // Don't fail auth if credit fetch fails
    }
  }, [isAuthenticated, tokenDetails]);

  // Fetch trial status
  const refreshTrialStatus = useCallback(async () => {
    if (!isAuthenticated || !tokenDetails?.accessToken) return;

    try {
      const trial = await BillingService.getTrialStatus();
      setUserDetails((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          isTrial: trial.is_trial,
          trialActive: trial.trial_active,
          trialCreditsRemaining: trial.credits_remaining,
          trialDaysRemaining: trial.days_remaining,
          trialHoursRemaining: trial.hours_remaining,
          trialExpired: trial.trial_expired,
          trialEndDate: trial.trial_end_date,
        };
        localStorage.setItem(STORE_KEYS.USER_DETAILS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    }
  }, [isAuthenticated, tokenDetails]);

  useEffect(() => {
    const storedUserDetails = localStorage.getItem(STORE_KEYS.USER_DETAILS);
    const storedUserTokens = localStorage.getItem(STORE_KEYS.USER_TOKENS);

    if (storedUserTokens) {
      const tokens: ITokenDetails = JSON.parse(storedUserTokens);
      setTokenDetails(tokens);
      setIsAuthenticated(tokens?.accessToken?.length > 0);
    } else {
      setIsAuthenticated(false);
      setTokenDetails(null);
    }

    if (storedUserDetails) {
      setUserDetails(JSON.parse(storedUserDetails));
    }

    setIsPending(false);
  }, [pathname]);

  // Fetch credit balance and trial status when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isPending) {
      refreshCreditBalance();
      refreshTrialStatus();
    }
  }, [isAuthenticated, isPending, refreshCreditBalance, refreshTrialStatus]);

  // Listen for credit consumption events from other components
  useEffect(() => {
    const unsubscribe = EventBus.on(EVENTS.CREDIT_CONSUMED, () => {
      // Refresh both credit balance and trial status whenever credits are consumed
      refreshCreditBalance();
      refreshTrialStatus();
    });

    return () => unsubscribe();
  }, [refreshCreditBalance, refreshTrialStatus]);

  const saveUserDetails = (details: UserDto) => {
    localStorage.setItem(STORE_KEYS.USER_DETAILS, JSON.stringify(details));
    setUserDetails(details);
  };

  const saveUserTokens = (tokens: ITokenDetails) => {
    localStorage.setItem(STORE_KEYS.USER_TOKENS, JSON.stringify(tokens));
    setTokenDetails(tokens);
    setIsAuthenticated(tokens.accessToken?.length > 0);
    // A fresh, valid session — re-arm the unauthorized-event guard so a FUTURE
    // expiry of *this* session is handled too, not just the first one ever.
    handledUnauthorized = false;
  };

  const logoutUser = useCallback(() => {
    localStorage.removeItem(STORE_KEYS.USER_DETAILS);
    localStorage.removeItem(STORE_KEYS.USER_TOKENS);
    // Clear active brand so a different user logging in on the same browser
    // doesn't inherit the previous user's brand context (causes 403 → false redirects).
    localStorage.removeItem('@URI@ACTIVE_BRAND_ID');
    setUserDetails(null);
    setTokenDetails(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  // Listen for unauthorized events from HTTP interceptor (401/403 errors)
  useEffect(() => {
    const handleUnauthorized = () => {
      if (handledUnauthorized) return;
      handledUnauthorized = true;
      console.warn('[Auth] Unauthorized event detected - logging out user');
      // Only surface this as a "session expired" message when there was actually
      // a session to expire — an anonymous visitor hitting a gated page also fires
      // this same event, and telling them their (nonexistent) session expired would
      // be confusing rather than helpful. Can't check localStorage here — the
      // interceptor already cleared it (synchronously, before dispatching this
      // event) regardless of whether a real session just ended. The ref mirrors
      // React state instead, which is untouched by that clear.
      const hadSession = isAuthenticatedRef.current;
      if (hadSession) {
        ToastService.showToast('Your session has expired — please sign in again.', ToastTypeEnum.Error);
        // logoutUser() redirects immediately, which was racing the toast's own
        // render — the route change landed before the toast ever painted, so the
        // message that exists specifically to explain the redirect never got seen.
        // A short delay (same pattern the login page already uses for its own
        // post-toast redirects) lets the user actually read it first.
        setTimeout(logoutUser, 1200);
      } else {
        logoutUser();
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [logoutUser]);

  return (
    <AuthContext.Provider
      value={{
        userDetails,
        tokenDetails,
        isAuthenticated,
        isPending,
        saveUserDetails,
        saveUserTokens,
        logoutUser,
        refreshCreditBalance,
        refreshTrialStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
