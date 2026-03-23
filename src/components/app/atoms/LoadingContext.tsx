'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = useState(false);
  return <LoadingContext.Provider value={{ isLoading, setLoading }}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => useContext(LoadingContext);
