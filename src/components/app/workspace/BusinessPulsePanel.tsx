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
        }
      })
      .catch(() => ToastService.showToast('Could not load Business Pulse. Please try again.', ToastTypeEnum.Error))
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
      ToastService.showToast('Business Pulse saved.', ToastTypeEnum.Success);
    } catch {
      ToastService.showToast('Could not save. Please try again.', ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 8,
    border: '1.5px solid #e5e3df',
    fontSize: 13.5,
    fontFamily: 'var(--wf, inherit)',
    outline: 'none',
    background: '#fafaf8',
    color: '#111',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={URI_PINK} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111' }}>Business Pulse</h1>
        </div>
        <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
          What&rsquo;s happening in your business right now. Keep this current — it feeds directly into your content
          calendar, so a stale promotion here means stale content in your posts.
        </p>
      </div>

      <div
        style={{
          margin: '14px 0 20px',
          fontSize: 12,
          color: updatedAt ? '#9CA3AF' : '#C2185B',
          fontWeight: 500,
        }}
      >
        {updatedAt
          ? `Last updated ${timeAgo(updatedAt)}`
          : "Never updated — fill this in so your calendar reflects what's current"}
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                {f.label}
                {f.list && <span style={{ textTransform: 'none', fontWeight: 400 }}> (comma-separated)</span>}
              </label>
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

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              alignSelf: 'flex-start',
              marginTop: 8,
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: URI_PINK,
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              fontFamily: 'var(--wf, inherit)',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
