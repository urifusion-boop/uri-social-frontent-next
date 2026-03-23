import { AppProviders } from './providers';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
