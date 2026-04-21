'use client';

import { useState } from 'react';
import { X, Bug, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BugReportService } from '@/src/api/BugReportService';

const CATEGORIES = [
  { value: 'ui', label: 'UI / Display issue' },
  { value: 'content', label: 'Content generation' },
  { value: 'posting', label: 'Social posting / publishing' },
  { value: 'billing', label: 'Billing & credits' },
  { value: 'performance', label: 'Slow / performance' },
  { value: 'other', label: 'Other' },
];

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setCategory('');
    setTitle('');
    setDescription('');
    setSteps('');
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await BugReportService.submitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        steps_to_reproduce: steps.trim() || undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });

      if (res.status) {
        setSubmitted(true);
      } else {
        toast.error(res.responseMessage || 'Failed to submit. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9998,
          animation: 'brFadeIn 0.2s ease',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 20,
          width: '90%',
          maxWidth: 520,
          zIndex: 9999,
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          animation: 'brSlideUp 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#FFF1F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bug size={18} color="#CD1B78" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111', fontFamily: 'var(--wf)' }}>
              Report a Bug
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              Help us improve by describing what went wrong
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              color: '#9CA3AF',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div
            style={{
              padding: '48px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={32} color="#22C55E" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111', fontFamily: 'var(--wf)' }}>
                Report received!
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Thanks for taking the time to report this. Our team will investigate and get it fixed.
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                marginTop: 8,
                padding: '10px 28px',
                borderRadius: 10,
                border: 'none',
                background: '#CD1B78',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--wf)',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} style={{ padding: '20px 28px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Category */}
              <div>
                <label style={labelStyle}>Category *</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      paddingRight: 36,
                      color: category ? '#111' : '#9CA3AF',
                    }}
                  >
                    <option value="" disabled>
                      Select a category…
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} style={{ color: '#111' }}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color="#9CA3AF"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={labelStyle}>Bug title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Images not loading on workspace"
                  required
                  minLength={5}
                  maxLength={200}
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>What happened? *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the bug in as much detail as possible…"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
                />
              </div>

              {/* Steps */}
              <div>
                <label style={labelStyle}>
                  Steps to reproduce <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Go to…&#10;2. Click on…&#10;3. See error"
                  maxLength={2000}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--wf)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !category || !title.trim() || !description.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: submitting || !category || !title.trim() || !description.trim() ? '#E5E7EB' : '#CD1B78',
                  color: submitting || !category || !title.trim() || !description.trim() ? '#9CA3AF' : '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting || !category || !title.trim() || !description.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--wf)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                {submitting && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        @keyframes brFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes brSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -46%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  fontFamily: 'var(--wf)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #E5E7EB',
  fontSize: 14,
  color: '#111',
  fontFamily: 'var(--wf)',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
