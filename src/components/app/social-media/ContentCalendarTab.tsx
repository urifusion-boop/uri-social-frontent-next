'use client';

import { CalendarDayItem, ContentCalendarPlan, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { ToastService } from '@/src/utils/toast.util';
import { useEffect, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  x: '#000',
  twitter: '#1DA1F2',
  tiktok: '#010101',
  youtube: '#FF0000',
  threads: '#000',
  bluesky: '#0085FF',
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  facebook: '👥',
  linkedin: '💼',
  x: '𝕏',
  twitter: '𝕏',
  tiktok: '🎵',
  youtube: '▶️',
  threads: '🧵',
  bluesky: '🦋',
};

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  educational:      { bg: 'rgba(10,102,194,.1)',   color: '#0a66c2', label: 'Educational' },
  relatable:        { bg: 'rgba(22,163,74,.1)',     color: '#15803d', label: 'Relatable' },
  promotional:      { bg: 'rgba(194,24,91,.1)',     color: '#C2185B', label: 'Promotional' },
  behind_the_scenes:{ bg: 'rgba(234,88,12,.1)',     color: '#c2410c', label: 'Behind the Scenes' },
  engagement:       { bg: 'rgba(109,40,217,.1)',    color: '#6d28d9', label: 'Engagement' },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CONNECTED_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'twitter', 'tiktok', 'threads'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        letterSpacing: 0.2,
      }}
    >
      {s.label}
    </span>
  );
};

const PlatformDots = ({ platforms }: { platforms: string[] }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {platforms.map((p) => (
      <span
        key={p}
        title={p}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: (PLATFORM_COLORS[p] ?? '#999') + '22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
        }}
      >
        {PLATFORM_ICONS[p] ?? '🌐'}
      </span>
    ))}
  </div>
);

// ─── Day Card ─────────────────────────────────────────────────────────────────

const DayCard = ({
  day,
  onClick,
  isRegenerating,
}: {
  day: CalendarDayItem;
  onClick: () => void;
  isRegenerating: boolean;
}) => {
  const today = isToday(day.date);
  const d = new Date(day.date + 'T00:00:00');
  const dateNum = d.getDate();

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 12,
        border: `1.5px solid ${today ? '#C2185B' : '#edecea'}`,
        padding: '12px 14px',
        cursor: 'pointer',
        minWidth: 160,
        flex: '1 1 160px',
        transition: 'box-shadow .15s',
        opacity: isRegenerating ? 0.6 : 1,
      }}
    >
      {/* Day header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: today ? '#C2185B' : '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {DAY_LABELS[day.day_index]}
          </span>
          <span style={{ fontSize: 11, color: '#bbb' }}>{dateNum}</span>
        </div>
        {today && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: '#C2185B',
              color: '#fff',
              borderRadius: 20,
              padding: '1px 6px',
              letterSpacing: 0.3,
            }}
          >
            TODAY
          </span>
        )}
      </div>

      {/* Type badge */}
      <div style={{ marginBottom: 7 }}>
        <TypeBadge type={day.content_type} />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: '#111',
          lineHeight: 1.4,
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {isRegenerating ? '…' : day.title}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PlatformDots platforms={day.platforms} />
        {day.acted_on && (
          <span style={{ fontSize: 14 }} title="Draft created">
            ✅
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

const DayDetailModal = ({
  day,
  planId,
  plan,
  onClose,
  onPlanUpdated,
  onGenerated,
}: {
  day: CalendarDayItem;
  planId: string;
  plan: ContentCalendarPlan;
  onClose: () => void;
  onPlanUpdated: (p: ContentCalendarPlan) => void;
  onGenerated: () => void;
}) => {
  const [regenerating, setRegenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await SocialMediaAgentService.regenerateCalendarDay(planId, day.day_index);
      if (res.status && res.responseData) {
        onPlanUpdated(res.responseData);
        onClose();
        ToastService.showToast('Day regenerated', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Regeneration failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Regeneration failed', ToastTypeEnum.Error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCreateDraft = async () => {
    setCreating(true);
    try {
      const res = await SocialMediaAgentService.createDraftFromCalendarDay(
        planId,
        day.day_index,
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

  const ts = TYPE_STYLE[day.content_type] ?? { bg: '#f5f4f0', color: '#888', label: day.content_type };

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
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px 24px 20px',
          maxWidth: 460,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {DAY_LABELS[day.day_index]}
            </span>
            <span style={{ fontSize: 12, color: '#bbb' }}>
              {new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {isToday(day.date) && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  background: '#C2185B',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '1px 6px',
                }}
              >
                TODAY
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#bbb',
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Type */}
        <div style={{ marginBottom: 12 }}>
          <TypeBadge type={day.content_type} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 800, color: '#111', lineHeight: 1.35, marginBottom: 10 }}>
          {day.title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 13,
            color: '#555',
            lineHeight: 1.65,
            marginBottom: 16,
            background: '#fafaf8',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          {day.description}
        </div>

        {/* Platforms */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Platforms
          </span>
          <PlatformDots platforms={day.platforms} />
        </div>

        {/* Include image toggle */}
        <div
          onClick={() => setIncludeImages((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: includeImages ? '#C2185B' : '#ddd',
              position: 'relative',
              transition: 'background .2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: includeImages ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                transition: 'left .2s',
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
            Include AI-generated image
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCreateDraft}
            disabled={creating || regenerating}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: creating ? '#e5c9d8' : '#C2185B',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: creating || regenerating ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--wf)',
              transition: 'background .15s',
            }}
          >
            {creating ? 'Creating…' : day.acted_on ? 'Create Another Draft' : 'Create Draft'}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating || creating}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #edecea',
              background: '#fff',
              color: '#555',
              fontSize: 13,
              fontWeight: 600,
              cursor: regenerating || creating ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--wf)',
              whiteSpace: 'nowrap',
            }}
          >
            {regenerating ? '…' : '↻ New idea'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ContentCalendarTabProps {
  onGenerated: () => void;
}

const ContentCalendarTab = ({ onGenerated }: ContentCalendarTabProps) => {
  const [plan, setPlan] = useState<ContentCalendarPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDayItem | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await SocialMediaAgentService.getCalendarPlan();
      if (res.status && res.responseData) setPlan(res.responseData);
      else setPlan(null);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (force = false) => {
    if (platforms.length === 0) {
      ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
      return;
    }
    setGenerating(true);
    try {
      const res = await SocialMediaAgentService.generateCalendarPlan(platforms, force);
      if (res.status && res.responseData) {
        setPlan(res.responseData);
        ToastService.showToast("This week's plan is ready", ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Generation failed', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Generation failed', ToastTypeEnum.Error);
    } finally {
      setGenerating(false);
    }
  };

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                flex: '1 1 140px',
                height: 140,
                borderRadius: 12,
                background: 'linear-gradient(90deg, #f5f4f0 25%, #edecea 50%, #f5f4f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #edecea',
          padding: '32px 28px',
          textAlign: 'center',
          maxWidth: 500,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 8 }}>
          No plan for this week yet
        </div>
        <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6, marginBottom: 20 }}>
          Generate a 7-day content plan tailored to your brand. Each day gets a specific idea and content type.
        </div>

        {/* Platform selector */}
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Platforms
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CONNECTED_PLATFORMS.map((p) => {
              const active = platforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: `1.5px solid ${active ? PLATFORM_COLORS[p] ?? '#C2185B' : '#e5e3df'}`,
                    background: active ? (PLATFORM_COLORS[p] ?? '#C2185B') + '14' : '#fff',
                    color: active ? PLATFORM_COLORS[p] ?? '#C2185B' : '#666',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--wf)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {PLATFORM_ICONS[p] ?? '🌐'} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => handleGenerate(false)}
          disabled={generating}
          style={{
            padding: '11px 24px',
            borderRadius: 10,
            border: 'none',
            background: generating ? '#e5c9d8' : '#C2185B',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--wf)',
            width: '100%',
          }}
        >
          {generating ? 'Building your plan…' : 'Generate Week Plan'}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Week header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>
            Week of {formatWeekLabel(plan.week_start)}
          </div>
          <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 2 }}>
            {plan.brand_snapshot?.brand_name ?? 'Your brand'} · {plan.platforms.join(', ')}
          </div>
        </div>
        <button
          onClick={() => handleGenerate(true)}
          disabled={generating}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '1.5px solid #edecea',
            background: '#fff',
            color: '#888',
            fontSize: 12,
            fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--wf)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {generating ? '…' : '↻ Regenerate week'}
        </button>
      </div>

      {/* Content mix pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(plan.content_mix)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([type, ratio]) => {
            const s = TYPE_STYLE[type] ?? { bg: '#f5f4f0', color: '#888', label: type };
            return (
              <span
                key={type}
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: s.bg,
                  color: s.color,
                }}
              >
                {s.label} {Math.round(ratio * 100)}%
              </span>
            );
          })}
      </div>

      {/* Day cards grid */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[...plan.days]
          .sort((a, b) => a.day_index - b.day_index)
          .map((day) => (
            <DayCard
              key={day.day_index}
              day={day}
              onClick={() => setSelectedDay(day)}
              isRegenerating={regeneratingDay === day.day_index}
            />
          ))}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          planId={plan.plan_id}
          plan={plan}
          onClose={() => setSelectedDay(null)}
          onPlanUpdated={(updated) => {
            setPlan(updated);
            setSelectedDay(null);
          }}
          onGenerated={onGenerated}
        />
      )}
    </>
  );
};

export default ContentCalendarTab;
