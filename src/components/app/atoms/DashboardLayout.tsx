'use client';

import { useAuth } from '@/src/providers/AuthProvider';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  excludeHeader?: boolean;
}

const DashboardLayout = ({ children, excludeHeader = false }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {!excludeHeader && <Navbar />}
      <div className={excludeHeader ? '' : 'pt-16'}>{children}</div>
    </div>
  );
};

export default DashboardLayout;
