'use client';

import { STORE_KEYS } from '@/src/configs/store.config';
import { ITokenDetails, UserDto } from '@/src/types';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { BillingService } from '@/src/api/BillingService';

interface IAuthContext {
  userDetails: UserDto | null;
  tokenDetails: ITokenDetails | null;
  isAuthenticated: boolean;
  isPending: boolean;
  saveUserDetails: (data: UserDto) => void;
  saveUserTokens: (data: ITokenDetails) => void;
  logoutUser: () => void;
  refreshCreditBalance: () => Promise<void>; // PRD 7.1: Fetch latest credit balance
}

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

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

  // PRD 7.1: Fetch credit balance on mount and auth change
  const refreshCreditBalance = useCallback(async () => {
    if (!isAuthenticated || !tokenDetails?.accessToken) return;

    try {
      const balance = await BillingService.getCreditBalance();
      setUserDetails((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          creditsRemaining: balance.credits_remaining,
          creditBalance: balance.total_credits,
          subscriptionTier: balance.subscription_tier,
          lowCreditWarning: balance.low_credit_warning,
        };
        localStorage.setItem(STORE_KEYS.USER_DETAILS, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
      // Don't fail auth if credit fetch fails
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

  // Fetch credit balance when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isPending) {
      refreshCreditBalance();
    }
  }, [isAuthenticated, isPending, refreshCreditBalance]);

  const saveUserDetails = (details: UserDto) => {
    localStorage.setItem(STORE_KEYS.USER_DETAILS, JSON.stringify(details));
    setUserDetails(details);
  };

  const saveUserTokens = (tokens: ITokenDetails) => {
    localStorage.setItem(STORE_KEYS.USER_TOKENS, JSON.stringify(tokens));
    setTokenDetails(tokens);
    setIsAuthenticated(tokens.accessToken?.length > 0);
  };

  const logoutUser = useCallback(() => {
    localStorage.removeItem(STORE_KEYS.USER_DETAILS);
    localStorage.removeItem(STORE_KEYS.USER_TOKENS);
    setUserDetails(null);
    setTokenDetails(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
