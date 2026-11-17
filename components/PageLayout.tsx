'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { AuthProvider } from '@/src/providers/AuthProvider';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show Navbar/Footer on app routes
  const isApp =
    pathname?.startsWith('/workspace') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/social-media') ||
    pathname?.startsWith('/settings') ||
    pathname === '/login' ||
    // The /ads landing page has its own minimal header and footer, so ad traffic isn't led away to other pages.
    pathname === '/ads' ||
    pathname === '/ads/' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isApp) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <Navbar />
      {children}
      <Footer />
    </AuthProvider>
  );
}
