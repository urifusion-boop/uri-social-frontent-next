'use client';

import { AuthProvider } from '@/src/providers/AuthProvider';
import Toaster from '@/src/components/app/atoms/Toaster';
import { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
