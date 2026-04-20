'use client';

import { useState, useEffect } from 'react';
import { NotificationService } from '@/src/api/NotificationService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPreferencesModal({ isOpen, onClose }: NotificationPreferencesModalProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [optOut, setOptOut] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current preferences from localStorage or API
      const savedEmailPref = localStorage.getItem('emailNotifications');
      const savedOptOut = localStorage.getItem('notificationOptOut');
      if (savedEmailPref !== null) setEmailNotifications(savedEmailPref === 'true');
      if (savedOptOut !== null) setOptOut(savedOptOut === 'true');
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await NotificationService.updatePreferences({
        email_notifications: emailNotifications,
        opt_out: optOut,
      });

      // Save to localStorage
      localStorage.setItem('emailNotifications', String(emailNotifications));
      localStorage.setItem('notificationOptOut', String(optOut));

      ToastService.showToast('Notification preferences updated', ToastTypeEnum.Success);
      onClose();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      ToastService.showToast('Failed to update preferences', ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '90%',
          maxWidth: 480,
          zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111', fontFamily: 'var(--wf)' }}>
          Notification Preferences
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', fontFamily: 'var(--wf)' }}>
          Manage how you receive notifications from URI Social
        </p>

        {/* Email Notifications Toggle */}
        <div
          style={{
            padding: 20,
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            marginBottom: 16,
            background: '#FAFAFA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'var(--wf)' }}>
                Email Notifications
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280', fontFamily: 'var(--wf)' }}>
                Receive email updates about content generation, posts, and activity
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 16 }}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: emailNotifications ? '#C2185B' : '#D1D5DB',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: emailNotifications ? 22 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Opt Out Toggle */}
        <div
          style={{
            padding: 20,
            border: '1px solid #FEE2E2',
            borderRadius: 12,
            marginBottom: 24,
            background: '#FEF2F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h4
                style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#DC2626', fontFamily: 'var(--wf)' }}
              >
                Disable All Notifications
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#991B1B', fontFamily: 'var(--wf)' }}>
                Turn off all notifications (not recommended - you may miss important updates)
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 16 }}>
              <input
                type="checkbox"
                checked={optOut}
                onChange={(e) => setOptOut(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: optOut ? '#DC2626' : '#D1D5DB',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: optOut ? 22 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              fontFamily: 'var(--wf)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: saving ? '#9CA3AF' : '#C2185B',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--wf)',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
