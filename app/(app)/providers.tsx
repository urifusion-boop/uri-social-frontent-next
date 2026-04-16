'use client';

import { AuthProvider } from '@/src/providers/AuthProvider';
import { NotificationProvider } from '@/src/providers/NotificationProvider';
import Toaster from '@/src/components/app/atoms/Toaster';
import { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
}
