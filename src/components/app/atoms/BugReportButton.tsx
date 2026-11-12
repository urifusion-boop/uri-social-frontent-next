'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import BugReportModal from './BugReportModal';
import { useIsMobile } from '@/src/hooks/useIsMobile';

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report a bug"
        style={{
          position: 'fixed',
          // Clear the mobile bottom nav (56px + safe area) instead of sitting on top of it.
          bottom: isMobile ? 'calc(56px + 16px + env(safe-area-inset-bottom, 0px))' : 24,
          right: isMobile ? 16 : 24,
          zIndex: 9000,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#fff',
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: '#6B7280',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#FFF1F7';
          e.currentTarget.style.borderColor = '#CD1B78';
          e.currentTarget.style.color = '#CD1B78';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(205,27,120,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.color = '#6B7280';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        }}
      >
        <Bug size={18} />
      </button>

      <BugReportModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
