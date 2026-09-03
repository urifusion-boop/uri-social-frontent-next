'use client';

/**
 * Content Calendar V2 — 30-day content intelligence engine.
 *
 * Deliberately separate from the production Content Calendar tab and its
 * /content-calendar/* backend — staging-only experimental build per the
 * user-supplied PRD ("URI Social — Live Content Calendar Engine"), scoped
 * to the PRD's own §48 MVP list. Not wired to v1's state, collection, or
 * component tree in any way — see the implementation plan this was built
 * against for the full isolation rationale.
 */

import {
  AdCopyV2,
  CalendarV2Item,
  CalendarV2VersionEntry,
  ContentCalendarV2Plan,
  SocialMediaAgentService,
} from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';

// ── Constants (deliberately a standalone copy, not shared with v1 — same
// isolation principle as the backend's _cal_v2_scope) ──────────────────────

const PINK = '#CD1B78';
const BORDER = '#E5E7EB';
const GRAY = '#6B7280';

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  educational: { bg: 'rgba(10,102,194,.1)', color: '#0a66c2', label: 'Educational' },
  relatable: { bg: 'rgba(22,163,74,.1)', color: '#15803d', label: 'Relatable' },
  promotional: { bg: 'rgba(194,24,91,.1)', color: '#C2185B', label: 'Promotional' },
  behind_the_scenes: { bg: 'rgba(234,88,12,.1)', color: '#c2410c', label: 'Behind the Scenes' },
  engagement: { bg: 'rgba(109,40,217,.1)', color: '#6d28d9', label: 'Engagement' },
};

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
];

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

// ── Small badges ────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
  const s = TYPE_STYLE[type] ?? { bg: '#f5f4f0', color: '#888', label: type };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 10.5,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};

const AdBadge = ({ score }: { score: number }) => (
  <span
    title={`Ad opportunity score: ${score}/100`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '2px 7px',
      borderRadius: 20,
      fontSize: 10.5,
      fontWeight: 700,
      background: 'rgba(5,150,105,.1)',
      color: '#059669',
    }}
  >
    💰 Ad candidate
  </span>
);

// ── Item card (30-day grid cell) ────────────────────────────────────────────

const ItemCard = ({ item, onClick }: { item: CalendarV2Item; onClick: () => void }) => {
  const today = isToday(item.date);
  const dateObj = new Date(item.date + 'T00:00:00');
  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px solid ${today ? PINK : BORDER}`,
        borderRadius: 10,
        padding: 10,
        cursor: 'pointer',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 110,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: today ? PINK : GRAY }}>
          {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          {today && ' · TODAY'}
        </span>
        {item.format === 'carousel' && (
          <span style={{ fontSize: 11 }} title="Carousel (3 slides)">
            🖼️🖼️🖼️
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{item.title}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
        <TypeBadge type={item.content_type} />
        {item.ad_opportunity?.is_ad_candidate && <AdBadge score={item.ad_opportunity.score} />}
        {!item.diversity_check.passed && (
          <span title="Flagged as similar to another idea in this plan" style={{ fontSize: 10.5, color: '#B45309' }}>
            ⚠️
          </span>
        )}
        {item.status === 'approved' && <span style={{ fontSize: 10.5, color: '#059669' }}>✓ approved</span>}
      </div>
    </div>
  );
};

// ── Ad opportunity panel ────────────────────────────────────────────────────

const AdOpportunityPanel = ({ score, adCopy }: { score: number; adCopy: AdCopyV2 | null }) => {
  if (!adCopy) return null;
  return (
    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 8 }}>
        💰 Ad opportunity — scored {score}/100
      </div>
      <div style={{ fontSize: 12.5, color: '#111827', marginBottom: 4 }}>
        <strong>Headline:</strong> {adCopy.headline}
      </div>
      <div style={{ fontSize: 12.5, color: '#374151', marginBottom: 4 }}>{adCopy.primary_text}</div>
      <div style={{ fontSize: 11.5, color: GRAY, marginBottom: 4 }}>
        <em>Short: {adCopy.short_copy}</em>
      </div>
      <div style={{ fontSize: 12, color: PINK, fontWeight: 600 }}>CTA: {adCopy.cta}</div>
    </div>
  );
};

// ── Version history ─────────────────────────────────────────────────────────

const VersionHistoryList = ({ versions }: { versions: CalendarV2VersionEntry[] }) => {
  if (!versions.length) return <div style={{ fontSize: 12, color: GRAY }}>No previous versions yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {versions
        .slice()
        .reverse()
        .map((v, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10.5, color: GRAY, marginBottom: 4 }}>
              {new Date(v.edited_at).toLocaleString()} {v.reason && `— ${v.reason}`}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{String(v.snapshot?.title ?? '')}</div>
          </div>
        ))}
    </div>
  );
};

// ── Item detail modal ───────────────────────────────────────────────────────

const ItemDetailModal = ({
  item,
  planId,
  plan,
  onClose,
  onPlanUpdated,
  onGenerated,
}: {
  item: CalendarV2Item;
  planId: string;
  plan: ContentCalendarV2Plan;
  onClose: () => void;
  onPlanUpdated: (p: ContentCalendarV2Plan) => void;
  onGenerated: () => void;
}) => {
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await SocialMediaAgentService.regenerateCalendarItemV2(planId, item.day_index, 'manual regenerate');
      if (res.status && res.responseData) {
        onPlanUpdated(res.responseData);
        onClose();
        ToastService.showToast('Item regenerated — prior version saved', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Regeneration failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Regeneration failed', ToastTypeEnum.Error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await SocialMediaAgentService.approveCalendarItemV2(planId, item.day_index);
      if (res.status && res.responseData) {
        onPlanUpdated(res.responseData);
        ToastService.showToast('Approved', ToastTypeEnum.Success);
      }
    } catch {
      ToastService.showToast('Approve failed', ToastTypeEnum.Error);
    } finally {
      setApproving(false);
    }
  };

  const handleCreateDraft = async () => {
    setCreating(true);
    try {
      const res = await SocialMediaAgentService.createDraftFromCalendarItemV2(
        planId,
        item.day_index,
        plan.platforms,
        includeImages
      );
      if (res.status) {
        ToastService.showToast('Draft created — switching to Drafts', ToastTypeEnum.Success);
        onClose();
        onGenerated();
      } else {
        ToastService.showToast(res.responseMessage || 'Failed to create draft', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Failed to create draft', ToastTypeEnum.Error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: 560,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <TypeBadge type={item.content_type} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '8px 0 2px' }}>{item.title}</h3>
            <div style={{ fontSize: 12, color: GRAY }}>
              {new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: GRAY }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            background: '#FAFAFA',
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>WHY THIS POST?</div>
          <div style={{ fontSize: 12.5, color: '#374151' }}>{item.reasoning}</div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>HOOK</div>
          <div style={{ fontSize: 13, color: '#111827' }}>{item.hook}</div>
        </div>

        {item.key_points.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>KEY POINTS</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#374151' }}>
              {item.key_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {item.exact_copy?.caption && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>PUBLISH-READY CAPTION</div>
            <div
              style={{
                fontSize: 12.5,
                color: '#111827',
                whiteSpace: 'pre-wrap',
                background: '#F9FAFB',
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: 10,
              }}
            >
              {item.exact_copy.caption}
            </div>
            {!!item.exact_copy.hashtags?.length && (
              <div style={{ fontSize: 11.5, color: PINK, marginTop: 4 }}>
                {item.exact_copy.hashtags.map((h) => `#${h}`).join(' ')}
              </div>
            )}
          </div>
        )}

        {item.carousel && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6 }}>CAROUSEL — 3 SLIDES</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {item.carousel.slides.map((s) => (
                <div
                  key={s.slide_index}
                  style={{
                    minWidth: 140,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: 10,
                    background: '#F9FAFB',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: PINK, marginBottom: 4 }}>
                    Slide {s.slide_index + 1}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{s.headline}</div>
                  <div style={{ fontSize: 11, color: '#374151' }}>{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>AI IMAGE PROMPT</div>
          <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }}>{item.ai_image_prompt}</div>
        </div>

        {item.ad_opportunity?.is_ad_candidate && (
          <AdOpportunityPanel score={item.ad_opportunity.score} adCopy={item.ad_opportunity.ad_copy} />
        )}

        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowVersions((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: PINK,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showVersions ? '▾' : '▸'} Version history ({item.version_history.length})
          </button>
          {showVersions && (
            <div style={{ marginTop: 8 }}>
              <VersionHistoryList versions={item.version_history} />
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', marginTop: 16 }}>
          <input type="checkbox" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} />
          Include AI-generated image
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button
            onClick={handleCreateDraft}
            disabled={creating}
            style={{
              background: PINK,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create Draft'}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{
              background: '#fff',
              color: '#374151',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: regenerating ? 0.6 : 1,
            }}
          >
            {regenerating ? 'Regenerating…' : '↻ New idea'}
          </button>
          <button
            onClick={handleApprove}
            disabled={approving || item.status === 'approved'}
            style={{
              background: '#fff',
              color: item.status === 'approved' ? '#059669' : '#374151',
              border: `1.5px solid ${item.status === 'approved' ? '#059669' : BORDER}`,
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: approving ? 0.6 : 1,
            }}
          >
            {item.status === 'approved' ? '✓ Approved' : approving ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main tab ─────────────────────────────────────────────────────────────────

interface Props {
  onGenerated: () => void;
}

export default function ContentCalendarV2Tab({ onGenerated }: Props) {
  const [plan, setPlan] = useState<ContentCalendarV2Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [selectedItem, setSelectedItem] = useState<CalendarV2Item | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await SocialMediaAgentService.getCalendarPlanV2();
        if (res.status && res.responseData) {
          setPlan(res.responseData);
          setPlatforms(res.responseData.platforms);
        }
      } catch {
        // 404 — no active plan yet, show the empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const togglePlatform = (key: string) =>
    setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));

  const handleGenerate = async (force: boolean) => {
    if (platforms.length === 0) {
      ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
      return;
    }
    setGenerating(true);
    try {
      const res = await SocialMediaAgentService.generateCalendarPlanV2(platforms, force);
      if (res.status && res.responseData) {
        setPlan(res.responseData);
        ToastService.showToast(force ? 'Plan regenerated' : 'Plan generated', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Generation failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast(
        'Generation failed — this can take up to a few minutes for 30 days, try again',
        ToastTypeEnum.Error
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: GRAY, fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div
        style={{
          background: '#FFF7FB',
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#831843',
        }}
      >
        🧪 <strong>Beta — Content Calendar V2.</strong> A 30-day content intelligence engine (ad-opportunity detection,
        creative-diversity validation, version history). Staging only, fully separate from the Calendar tab — nothing
        here affects it.
      </div>

      {!plan ? (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗓️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>No 30-day plan yet</div>
          <div style={{ fontSize: 12.5, color: GRAY, marginBottom: 16 }}>
            Generate a 30-day content plan tailored to your brand — including ad-ready posts and exact copy.
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6 }}>PLATFORMS</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => togglePlatform(p.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${platforms.includes(p.key) ? PINK : BORDER}`,
                  background: platforms.includes(p.key) ? '#FCE7F3' : '#fff',
                  color: platforms.includes(p.key) ? PINK : '#374151',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            style={{
              background: PINK,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? 'Generating 30-day plan… (~2-3 min)' : 'Generate 30-Day Plan'}
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                {formatPeriodLabel(plan.period_start, plan.period_end)}
              </div>
              <div style={{ fontSize: 11.5, color: GRAY, marginTop: 2 }}>
                {plan.generation_method === 'data_driven' && '📊 Data-driven'}
                {plan.generation_method === 'trend_driven' && '📈 Trend-driven'}
                {plan.generation_method === 'ai' && '✨ AI-generated'}
                {' · '}
                {plan.items.filter((i) => i.ad_opportunity?.is_ad_candidate).length} ad candidates
                {' · '}
                {plan.items.filter((i) => !i.diversity_check.passed).length} flagged for review
              </div>
            </div>
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              style={{
                background: '#fff',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              {generating ? 'Regenerating…' : '↻ Regenerate 30-day plan'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            {plan.items.map((item) => (
              <ItemCard key={item.item_id} item={item} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        </>
      )}

      {selectedItem && plan && (
        <ItemDetailModal
          item={selectedItem}
          planId={plan.plan_id}
          plan={plan}
          onClose={() => setSelectedItem(null)}
          onPlanUpdated={(p) => {
            setPlan(p);
            const refreshed = p.items.find((i) => i.day_index === selectedItem.day_index);
            if (refreshed) setSelectedItem(refreshed);
          }}
          onGenerated={onGenerated}
        />
      )}
    </div>
  );
}
