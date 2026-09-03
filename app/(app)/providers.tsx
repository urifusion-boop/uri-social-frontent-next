'use client';

import { AuthProvider } from '@/src/providers/AuthProvider';
import { NotificationProvider } from '@/src/providers/NotificationProvider';
import Toaster from '@/src/components/app/atoms/Toaster';
import BugReportButton from '@/src/components/app/atoms/BugReportButton';
import ConnectionExpiredModal from '@/src/components/app/workspace/ConnectionExpiredModal';
import { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <Toaster />
        <BugReportButton />
        <ConnectionExpiredModal />
      </NotificationProvider>
    </AuthProvider>
  );
}
