'use client';

import { STORE_KEYS } from '@/src/configs/store.config';
import { ITokenDetails, UserDto } from '@/src/types';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

interface IAuthContext {
  userDetails: UserDto | null;
  tokenDetails: ITokenDetails | null;
  isAuthenticated: boolean;
  isPending: boolean;
  saveUserDetails: (data: UserDto) => void;
  saveUserTokens: (data: ITokenDetails) => void;
  logoutUser: () => void;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
