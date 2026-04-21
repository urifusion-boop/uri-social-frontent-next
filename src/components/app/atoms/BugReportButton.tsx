'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import BugReportModal from './BugReportModal';

export default function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report a bug"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
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
