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
  { key: 'tiktok', label: 'TikTok' },
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

// PRD territory label — a short human-readable form of the "A_PROBLEM" style
// key, e.g. "Problem". Falls back to the raw key if it doesn't match the
// expected "X_LABEL" shape.
function territoryLabel(territory: string): string {
  const withoutPrefix = territory.replace(/^[A-Z]_/, '');
  return withoutPrefix
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

const TerritoryBadge = ({ territory }: { territory: string }) => {
  if (!territory) return null;
  return (
    <span
      title="Content territory (PRD Layer 1)"
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 10.5,
        fontWeight: 700,
        background: 'rgba(107,114,128,.12)',
        color: '#374151',
      }}
    >
      {territoryLabel(territory)}
    </span>
  );
};

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
          <span style={{ fontSize: 11 }} title={`Carousel (${item.carousel?.slides.length ?? '?'} slides)`}>
            {'🖼️'.repeat(item.carousel?.slides.length || 3)}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{item.title}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
        <TypeBadge type={item.content_type} />
        <TerritoryBadge territory={item.territory} />
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

const AdOpportunityPanel = ({
  score,
  angle,
  reason,
  adCopy,
}: {
  score: number;
  angle: string | null;
  reason: string;
  adCopy: AdCopyV2 | null;
}) => {
  if (!adCopy) return null;
  return (
    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14, marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 4 }}>
        💰 Ad opportunity — scored {score}/100{angle && ` · ${territoryLabel(angle)} angle`}
      </div>
      {reason && <div style={{ fontSize: 11, color: '#15803d', marginBottom: 8 }}>{reason}</div>}
      <div style={{ fontSize: 12.5, color: '#111827', marginBottom: 4 }}>
        <strong>Headline:</strong> {adCopy.headline}
      </div>
      <div style={{ fontSize: 12.5, color: '#374151', marginBottom: 4 }}>{adCopy.primary_text}</div>
      <div style={{ fontSize: 11.5, color: GRAY, marginBottom: 4 }}>
        <em>Short: {adCopy.short_copy}</em>
      </div>
      <div style={{ fontSize: 12, color: PINK, fontWeight: 600, marginBottom: 4 }}>CTA: {adCopy.cta}</div>
      {adCopy.image_prompt && (
        <div style={{ fontSize: 11, color: GRAY, fontStyle: 'italic' }}>Ad visual: {adCopy.image_prompt}</div>
      )}
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
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <TypeBadge type={item.content_type} />
              <TerritoryBadge territory={item.territory} />
            </div>
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

        {!item.diversity_check.passed && (
          <div
            style={{
              fontSize: 11,
              color: '#B45309',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              padding: '6px 10px',
              marginBottom: 10,
            }}
          >
            ⚠️ Flagged as similar to another idea in this plan (similarity score{' '}
            {item.diversity_check.similarity_score.toFixed(1)})
            {item.last_regenerated_reason === 'diversity_auto' &&
              ' — already auto-regenerated once, still flagged for manual review'}
          </div>
        )}
        {item.last_regenerated_reason === 'diversity_auto' && item.diversity_check.passed && (
          <div style={{ fontSize: 11, color: '#059669', marginBottom: 10 }}>
            ↻ Automatically regenerated after a creative-diversity review
          </div>
        )}
        {item.creative_quality_review_note && (
          <div
            style={{
              fontSize: 11,
              color: '#374151',
              background: '#F9FAFB',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: '6px 10px',
              marginBottom: 10,
            }}
          >
            📝 Creative quality review: {item.creative_quality_review_note}
          </div>
        )}

        {(item.creative_concept_name || item.subject || item.creative_angle || item.creative_device?.label) && (
          <div
            style={{
              background: '#FDF4F9',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6 }}>CREATIVE CONCEPT</div>
            {item.creative_concept_name && (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                {item.creative_concept_name}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: '#374151' }}>
              {item.subject && (
                <span>
                  <strong>Subject:</strong> {item.subject}
                </span>
              )}
              {item.creative_angle && (
                <span>
                  <strong>Angle:</strong> {territoryLabel(item.creative_angle)}
                </span>
              )}
              {item.creative_device?.label && (
                <span>
                  <strong>Device:</strong> {territoryLabel(item.creative_device.label)} ({item.creative_device.category}
                  )
                </span>
              )}
            </div>
          </div>
        )}

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
            {item.exact_copy.headline && (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                {item.exact_copy.headline}
              </div>
            )}
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
                {item.exact_copy.hashtags.map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
              </div>
            )}
          </div>
        )}

        {item.carousel && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6 }}>
              CAROUSEL — {item.carousel.slides.length} SLIDE{item.carousel.slides.length === 1 ? '' : 'S'}
            </div>
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
                  <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>{s.body}</div>
                  {s.visual_note && (
                    <div style={{ fontSize: 10, color: GRAY, fontStyle: 'italic' }}>{s.visual_note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>AI IMAGE PROMPT</div>
          <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }}>{item.ai_image_prompt}</div>
        </div>

        {(item.creative_direction?.central_visual_idea ||
          item.design_style ||
          item.layout_direction ||
          item.visual_metaphor) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>VISUAL DIRECTION</div>
            <div style={{ fontSize: 12, color: '#374151', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {item.creative_direction?.central_visual_idea && <div>{item.creative_direction.central_visual_idea}</div>}
              {item.design_style && (
                <div>
                  <strong>Style:</strong> {item.design_style}
                </div>
              )}
              {item.layout_direction && (
                <div>
                  <strong>Layout:</strong> {item.layout_direction}
                </div>
              )}
              {item.visual_metaphor && (
                <div>
                  <strong>Metaphor:</strong> {item.visual_metaphor}
                </div>
              )}
              {item.creative_direction?.mood && (
                <div>
                  <strong>Mood:</strong> {item.creative_direction.mood}
                </div>
              )}
            </div>
          </div>
        )}

        {(item.required_assets?.length > 0 || item.designer_execution_notes) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 4 }}>PRODUCTION NOTES</div>
            {item.required_assets?.length > 0 && (
              <ul style={{ margin: '0 0 4px', paddingLeft: 18, fontSize: 11.5, color: '#374151' }}>
                {item.required_assets.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            {item.designer_execution_notes && (
              <div style={{ fontSize: 11.5, color: '#374151' }}>{item.designer_execution_notes}</div>
            )}
          </div>
        )}

        {item.data_provenance && Object.values(item.data_provenance).includes('unknown') && (
          <div style={{ fontSize: 10.5, color: '#B45309', marginBottom: 10 }}>
            ⚠️ Verify before publishing —{' '}
            {Object.entries(item.data_provenance)
              .filter(([, v]) => v === 'unknown')
              .map(([k]) => k.replace(/_/g, ' '))
              .join(', ')}{' '}
            not sourced from the brand profile.
          </div>
        )}

        {item.ad_opportunity?.is_ad_candidate && (
          <AdOpportunityPanel
            score={item.ad_opportunity.score}
            angle={item.ad_opportunity.angle}
            reason={item.ad_opportunity.reason}
            adCopy={item.ad_opportunity.ad_copy}
          />
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

  // The pipeline runs 4-6 min as a background job; while the newest plan is
  // still 'generating', poll GET /plan until it flips to 'active' or 'failed'.
  useEffect(() => {
    if (plan?.status !== 'generating') {
      setGenerating(false);
      return;
    }
    setGenerating(true);
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await SocialMediaAgentService.getCalendarPlanV2();
        if (cancelled) return;
        if (res.status && res.responseData) {
          setPlan(res.responseData);
          if (res.responseData.status === 'active') {
            ToastService.showToast('Plan ready', ToastTypeEnum.Success);
            onGenerated();
          } else if (res.responseData.status === 'failed') {
            ToastService.showToast(res.responseData.error || 'Generation failed — try again', ToastTypeEnum.Error);
          }
        }
      } catch {
        // transient — keep polling
      }
    };
    const id = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [plan?.status, onGenerated]);

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
        // A 'generating' placeholder comes back near-instantly; the polling
        // effect (keyed on plan.status) takes over from here. An 'active'
        // plan means one already existed and force was false.
        if (res.responseData.status === 'generating') {
          ToastService.showToast('Building your 30-day plan — this takes a few minutes', ToastTypeEnum.Success);
        } else {
          setGenerating(false);
        }
      } else {
        ToastService.showToast(res.responseMessage || 'Generation failed', ToastTypeEnum.Error);
        setGenerating(false);
      }
    } catch {
      ToastService.showToast('Could not start generation — try again', ToastTypeEnum.Error);
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

      {!plan || plan.status === 'generating' || plan.status === 'failed' ? (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {plan?.status === 'generating' ? '⏳' : plan?.status === 'failed' ? '⚠️' : '🗓️'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {plan?.status === 'generating'
              ? 'Building your 30-day plan…'
              : plan?.status === 'failed'
                ? 'Generation didn’t finish'
                : 'No 30-day plan yet'}
          </div>
          <div style={{ fontSize: 12.5, color: GRAY, marginBottom: 16 }}>
            {plan?.status === 'generating' ? (
              'The engine is drafting a candidate pool, scoring it, then writing copy for the 30 selected ideas. This runs in the background and takes about 4-6 minutes — you can leave this tab and come back.'
            ) : plan?.status === 'failed' ? (
              <>
                {plan.error || 'Something went wrong during generation.'} Adjust your platforms if needed and try again.
              </>
            ) : (
              'Generate a 30-day content plan tailored to your brand — including ad-ready posts and exact copy.'
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 6 }}>PLATFORMS</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => !generating && togglePlatform(p.key)}
                disabled={generating}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${platforms.includes(p.key) ? PINK : BORDER}`,
                  background: platforms.includes(p.key) ? '#FCE7F3' : '#fff',
                  color: platforms.includes(p.key) ? PINK : '#374151',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: generating ? 'default' : 'pointer',
                  opacity: generating ? 0.6 : 1,
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
            {generating
              ? 'Generating 30-day plan… (~4-6 min — candidates, scoring, then copy)'
              : plan?.status === 'failed'
                ? 'Try again'
                : 'Generate 30-Day Plan'}
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
                🧠 Framework-driven{plan.framework_version && ` · v${plan.framework_version}`}
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 14,
              padding: '8px 12px',
              background: '#F9FAFB',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: GRAY }}>PLATFORMS</span>
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1.5px solid ${on ? PINK : BORDER}`,
                    background: on ? '#FCE7F3' : '#fff',
                    color: on ? PINK : '#9CA3AF',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {on ? '✓ ' : ''}
                  {p.label}
                </button>
              );
            })}
            {JSON.stringify([...platforms].sort()) !== JSON.stringify([...plan.platforms].sort()) && (
              <span style={{ fontSize: 11, color: '#B45309' }}>
                — changed from {plan.platforms.join(', ')}; regenerate to apply
              </span>
            )}
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
