'use client';

import React, { useEffect, useState } from 'react';
import { BrandProfileService, BusinessPulseData } from '@/src/api/BrandProfileService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const URI_PINK = '#C2185B';

const FIELDS: Array<{
  key: keyof BusinessPulseData;
  label: string;
  placeholder: string;
  list: boolean;
}> = [
  {
    key: 'current_period_goal',
    label: "This period's goal",
    placeholder: 'e.g. Push the new sourdough line before month-end (distinct from your long-term goal)',
    list: false,
  },
  {
    key: 'current_promotions',
    label: 'Current promotions / offers',
    placeholder: 'e.g. 20% off all orders this weekend',
    list: true,
  },
  {
    key: 'current_campaigns',
    label: 'Current campaigns',
    placeholder: 'e.g. Valentine’s pre-order campaign',
    list: true,
  },
  {
    key: 'new_products_services',
    label: 'New products / services',
    placeholder: 'e.g. Sourdough loaf (recent additions, not your full catalog)',
    list: true,
  },
  {
    key: 'recent_milestones',
    label: 'Recent milestones',
    placeholder: 'e.g. Just hit 1,000 orders delivered',
    list: true,
  },
  {
    key: 'business_news_announcements',
    label: 'News / announcements',
    placeholder: 'e.g. Opening a second location in June',
    list: true,
  },
];

/** Formats an ISO timestamp as a short relative "X ago" string. */
const timeAgo = (iso?: string | null): string | null => {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

// Same field-row shape as Brand Playbook's PbRow/PbInput (WorkspaceDashboard.tsx) —
// duplicated in this file rather than imported since those are local, non-exported
// helpers and importing them here would create a circular import (WorkspaceDashboard
// already imports this component).
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  borderRadius: 8,
  border: '1.5px solid #e5e3df',
  fontSize: 13,
  fontFamily: 'var(--wf, inherit)',
  outline: 'none',
  background: '#fafaf8',
  color: '#111',
  boxSizing: 'border-box',
};

/**
 * A separate, always-editable surface from the main 21-step Brand Playbook —
 * these fields are time-sensitive (current promotions/campaigns/news/
 * milestones/new products) and need frequent updates, so this stays out of
 * the onboarding wizard entirely. Saves as one atomic unit via its own
 * dedicated endpoint (BrandProfileService.getBusinessPulse/saveBusinessPulse),
 * never touching the other ~50 brand profile fields.
 */
export default function BusinessPulsePanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({
    current_period_goal: '',
    current_promotions: '',
    current_campaigns: '',
    new_products_services: '',
    recent_milestones: '',
    business_news_announcements: '',
  });

  useEffect(() => {
    BrandProfileService.getBusinessPulse()
      .then((res) => {
        if (res.status && res.responseData) {
          const d = res.responseData;
          setValues({
            current_period_goal: d.current_period_goal ?? '',
            current_promotions: (d.current_promotions ?? []).join(', '),
            current_campaigns: (d.current_campaigns ?? []).join(', '),
            new_products_services: (d.new_products_services ?? []).join(', '),
            recent_milestones: (d.recent_milestones ?? []).join(', '),
            business_news_announcements: (d.business_news_announcements ?? []).join(', '),
          });
          setUpdatedAt(d.updated_at ?? null);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => {
        setLoadError(true);
        ToastService.showToast('Could not load Business Pulse. Please try again.', ToastTypeEnum.Error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toList = (v: string) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      const payload: Partial<BusinessPulseData> = {
        current_period_goal: values.current_period_goal,
        current_promotions: toList(values.current_promotions),
        current_campaigns: toList(values.current_campaigns),
        new_products_services: toList(values.new_products_services),
        recent_milestones: toList(values.recent_milestones),
        business_news_announcements: toList(values.business_news_announcements),
      };
      const res = await BrandProfileService.saveBusinessPulse(payload);
      if (!res.status) throw new Error(res.responseMessage || 'Save failed');
      setUpdatedAt(res.responseData?.business_pulse_updated_at ?? new Date().toISOString());
      setLoadError(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      ToastService.showToast('Could not save. Please try again.', ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  const freshness = timeAgo(updatedAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — matches SubPage's chrome (WorkspaceDashboard.tsx) used by every other page */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #edecea' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={URI_PINK} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          Business Pulse
        </h2>
        <p style={{ fontSize: 12.5, color: '#999', marginTop: 2 }}>
          What&rsquo;s happening in your business right now &mdash; feeds directly into your content calendar
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
        {/* Action bar — mirrors Brand Playbook's sticky save bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            backgroundColor: '#fff',
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: updatedAt ? '#999' : URI_PINK }}>
            {saved
              ? '✓ Changes saved'
              : freshness
                ? `Last updated ${freshness}`
                : loadError
                  ? ''
                  : "Never updated — fill this in so your calendar reflects what's current"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: URI_PINK,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              opacity: saving || loading ? 0.7 : 1,
              fontFamily: 'var(--wf, inherit)',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading...</div>
        ) : (
          <>
            {loadError && (
              <div
                style={{
                  background: '#fdf0f6',
                  border: `1px solid ${URI_PINK}33`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: URI_PINK,
                  marginBottom: 12,
                }}
              >
                Couldn&rsquo;t load your saved Business Pulse. You can still fill this in and save — just double-check
                it after your next visit.
              </div>
            )}

            {/* Section card — matches PbSection styling from Brand Playbook */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #edecea',
                padding: '16px 18px',
                marginBottom: 10,
              }}
            >
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: URI_PINK,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 12,
                }}
              >
                What&rsquo;s current
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      {f.label}
                      {f.list && <span style={{ textTransform: 'none', fontWeight: 400 }}> (comma-separated)</span>}
                    </div>
                    <input
                      value={values[f.key as string] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = URI_PINK)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e3df')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
