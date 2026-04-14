'use client';

/**
 * Workspace Profile Dropdown Component
 * User profile menu with billing, settings, and logout options
 */

import { useState } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';

// Icon component
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" style={{ flexShrink: 0 }}>
      {paths[n]}
    </svg>
  );
};

interface WorkspaceProfileDropdownProps {
  onNavigate: (nav: string) => void;
  onLogout: () => void;
}

export default function WorkspaceProfileDropdown({ onNavigate, onLogout }: WorkspaceProfileDropdownProps) {
  const { userDetails } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!userDetails) return null;

  const handleNavigate = (nav: string) => {
    setIsOpen(false);
    onNavigate(nav);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px 5px 5px',
          borderRadius: 9,
          border: '1px solid #e5e3df',
          background: isOpen ? '#f9f9f9' : '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--wf)',
          transition: 'all 0.15s',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#880E4F,#C2185B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {userDetails.firstName?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{userDetails.firstName || 'User'}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 260,
              background: '#fff',
              border: '1px solid #e5e3df',
              borderRadius: 11,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            {/* User Info Section */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111', marginBottom: 3 }}>
                {userDetails.firstName || ''} {userDetails.lastName || ''}
              </div>
              <div style={{ fontSize: 11.5, color: '#888' }}>{userDetails.email || ''}</div>
            </div>

            {/* Credit Summary */}
            {userDetails && (
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: '#fafafa',
                }}
              >
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>CREDITS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#C2185B' }}>
                    {userDetails.trialActive
                      ? (userDetails.trialCreditsRemaining ?? 0)
                      : (userDetails.creditsRemaining ?? 0)}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#666' }}>remaining</span>
                </div>
                {userDetails.subscriptionTier && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: '#999',
                      marginBottom: 8,
                      textTransform: 'capitalize',
                    }}
                  >
                    {userDetails.subscriptionTier} Plan
                  </div>
                )}
                {/* Upgrade button for free trial users */}
                {(!userDetails.subscriptionTier || userDetails.subscriptionTier === 'free') && (
                  <button
                    onClick={() => handleNavigate('billing')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 7,
                      border: 'none',
                      background: 'linear-gradient(135deg, #C2185B, #E91E63)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      fontFamily: 'var(--wf)',
                    }}
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div style={{ padding: '6px 0' }}>
              <button
                onClick={() => handleNavigate('billing')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#333',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <I n="trending" s={16} c="#666" />
                View Billing
              </button>
              <button
                onClick={() => handleNavigate('settings')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#333',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <I n="settings" s={16} c="#666" />
                Settings
              </button>
            </div>

            {/* Logout Section */}
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '6px 0' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#dc2626',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <I n="logout" s={16} c="#dc2626" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
