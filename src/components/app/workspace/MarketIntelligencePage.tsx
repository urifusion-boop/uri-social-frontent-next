'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BellOff,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileText,
  Inbox,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  MessageSquare,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShoppingCart,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AccessGrant,
  ActionBrief,
  BrandBudget,
  ConfidenceBand,
  Development,
  DevelopmentStatus,
  Evidence,
  EvidenceType,
  InsightVersion,
  MarketIntelligenceService,
  MIAccessLevel,
  MINotificationPreferences,
  NotificationSensitivity,
  ScoreBreakdown,
  SourceCapability,
  Topic,
} from '@/src/api/MarketIntelligenceService';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

// A rejected MI request (e.g. a 403 from require_mi_write_access when a
// view-only teammate tries to act) is shaped like http.config.ts's
// Promise.reject(error.response) — an AxiosResponse whose body carries
// FastAPI's {detail}. Surface that real reason instead of a generic
// "could not X" toast, matching the fallback chain already used for the
// same shape elsewhere in the app (e.g. CustomGuideUploadModal).
function mutationErrorMessage(err: unknown, fallback: string): string {
  const detail =
    (err as { data?: { detail?: string } })?.data?.detail ??
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === 'string' && detail.length > 0 ? detail : fallback;
}

// ─── Design tokens (mapped onto the app's real CSS variables — no ad hoc
// hex colours; band/status colour is the one place a fixed semantic palette
// is intentional, since "high confidence" should read as unambiguously
// positive regardless of the brand accent) ──────────────────────────────────

const BAND_STYLES: Record<ConfidenceBand, { text: string; softBg: string; border: string; dot: string }> = {
  high: {
    text: 'text-emerald-700 dark:text-emerald-400',
    softBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
    dot: 'bg-emerald-500',
  },
  medium: {
    text: 'text-amber-700 dark:text-amber-400',
    softBg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  low: {
    text: 'text-rose-700 dark:text-rose-400',
    softBg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    dot: 'bg-rose-500',
  },
};

const TYPE_ICON: Record<EvidenceType, LucideIcon> = {
  purchase_inquiry: ShoppingCart,
  customer_concern: AlertTriangle,
  unmet_need: Lightbulb,
  product_praise: ThumbsUp,
  emerging_trend: TrendingUp,
  competitor_movement: Radar,
  upcoming_development: CalendarClock,
  reputation_risk: ShieldAlert,
  general_discussion: MessageSquare,
  noise: Ban,
};

const DEV_STATUS_META: Record<DevelopmentStatus, { label: string; className: string }> = {
  date_to_confirm: { label: 'Date to confirm', className: 'border-border text-muted-foreground' },
  scheduled: {
    label: 'Scheduled',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  postponed: {
    label: 'Postponed',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400',
  },
  occurred: { label: 'Occurred', className: 'border-border bg-muted text-muted-foreground' },
};

function formatTypeLabel(type: string): string {
  return type
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// ─── Small building blocks ──────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="text-xl leading-tight font-semibold tracking-tight text-foreground">{value}</div>
          </div>
        </div>
        {hint && <div className="truncate text-[11px] text-muted-foreground">{hint}</div>}
        {footer}
      </CardContent>
    </Card>
  );
}

function ScoreMeter({ label, score }: { label: string; score: ScoreBreakdown }) {
  const [open, setOpen] = useState(false);
  const band = BAND_STYLES[score.band];
  return (
    <div className={cn('rounded-lg border p-2.5', band.border, band.softBg)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', band.dot)} />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-semibold', band.text)}>
            {score.total}/10 · {score.band}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div className={cn('h-full rounded-full transition-all', band.dot)} style={{ width: `${score.total * 10}%` }} />
      </div>
      {open && (
        <div className="mt-2.5 space-y-2 border-t border-black/5 pt-2.5 dark:border-white/10">
          {score.components.map((c) => (
            <div key={c.name} className="text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground capitalize">{c.name.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">{c.points}/2</span>
              </div>
              <div className="text-muted-foreground">{c.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceDrawer({ insightId, onInsightRetracted }: { insightId: string; onInsightRetracted: () => void }) {
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setEvidence(null);
    MarketIntelligenceService.getInsightEvidence(insightId).then((res) => {
      if (res.status) setEvidence(res.responseData ?? []);
    });
  }, [insightId]);

  const handleRemove = async (evidenceId: string) => {
    if (!window.confirm('Remove this record? This cannot be undone.')) return;
    setRemovingId(evidenceId);
    try {
      const res = await MarketIntelligenceService.deleteEvidence(evidenceId);
      if (!res.status) {
        ToastService.showToast(res.responseMessage || 'Could not remove this record', ToastTypeEnum.Error);
        return;
      }
      setEvidence((prev) => (prev ?? []).filter((e) => e.id !== evidenceId));
      const retracted = (res.responseData?.insights_retracted as string[] | undefined) ?? [];
      if (retracted.includes(insightId)) {
        ToastService.showToast(
          'All evidence for this insight was removed — it has been retracted.',
          ToastTypeEnum.Warning
        );
        onInsightRetracted();
      } else {
        ToastService.showToast('Record removed.', ToastTypeEnum.Success);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not remove this record'), ToastTypeEnum.Error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Evidence</div>
      {evidence === null ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : evidence.length === 0 ? (
        <div className="text-xs text-muted-foreground">No evidence found for this insight.</div>
      ) : (
        <div className="divide-y divide-border">
          {evidence.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-[13px] text-foreground">{e.text}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                  <span>{e.author_handle ?? 'unknown author'}</span>
                  <span>·</span>
                  <span>{e.platform}</span>
                  <span>·</span>
                  <span>{e.published_at ? new Date(e.published_at).toLocaleDateString() : 'undated'}</span>
                  {e.url && (
                    <>
                      <span>·</span>
                      <a href={e.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        View original
                      </a>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={removingId === e.id}
                onClick={() => handleRemove(e.id)}
                aria-label="Remove record"
              >
                {removingId === e.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightListRow({
  insight,
  active,
  onClick,
}: {
  insight: InsightVersion;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[insight.type];
  const band = BAND_STYLES[insight.confidence.band];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/50',
        active && 'bg-primary/5 hover:bg-primary/5'
      )}
    >
      <div
        className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', band.softBg, band.text)}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {formatTypeLabel(insight.type)}
          </span>
          <span className="shrink-0 text-[10.5px] text-muted-foreground">
            {formatRelativeDate(insight.last_updated)}
          </span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium text-foreground">
          {insight.headline}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={cn('text-[10.5px] font-semibold', band.text)}>{insight.confidence.total}/10 confidence</span>
          {insight.urgency.is_urgent && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[9.5px]">
              Urgent
            </Badge>
          )}
          {insight.revision > 1 && (
            <Badge variant="outline" className="h-4 px-1.5 text-[9.5px]">
              Updated
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function InsightDetail({
  insight,
  onFeedback,
  onInsightRetracted,
}: {
  insight: InsightVersion;
  onFeedback: (id: string, verdict: 'useful' | 'not_relevant') => void;
  onInsightRetracted: () => void;
}) {
  const [snoozing, setSnoozing] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const Icon = TYPE_ICON[insight.type];

  useEffect(() => {
    setSnoozed(false);
  }, [insight.id]);

  const handleSnooze = async () => {
    setSnoozing(true);
    try {
      const res = await MarketIntelligenceService.snoozeInsight(insight.id);
      if (res.status) {
        setSnoozed(true);
        ToastService.showToast('Notifications for this insight are snoozed.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not snooze this insight', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not snooze this insight'), ToastTypeEnum.Error);
    } finally {
      setSnoozing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                BAND_STYLES[insight.confidence.band].softBg,
                BAND_STYLES[insight.confidence.band].text
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {formatTypeLabel(insight.type)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                insight.action_readiness === 'ready_to_act'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
              }
            >
              {insight.action_readiness === 'ready_to_act' ? 'Ready to act' : 'Check suitability'}
            </Badge>
            {insight.revision > 1 && <Badge variant="outline">Revision {insight.revision}</Badge>}
          </div>
        </div>

        <h3 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-foreground">{insight.headline}</h3>

        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">{insight.observed_change}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground italic">
          {insight.business_implication}
        </p>

        {insight.coverage_note && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{insight.coverage_note}</span>
          </div>
        )}

        {insight.assumptions.length > 0 && (
          <div className="mt-3 text-[11.5px] text-muted-foreground">
            <span className="font-medium">Assumptions:</span> {insight.assumptions.join('; ')}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="min-w-[160px] flex-1">
            <ScoreMeter label="Confidence" score={insight.confidence} />
          </div>
          <div className="min-w-[160px] flex-1">
            <ScoreMeter label="Relevance" score={insight.relevance} />
          </div>
        </div>

        {insight.urgency.is_urgent && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11.5px] font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            Urgent{insight.urgency.deadline ? ` · by ${new Date(insight.urgency.deadline).toLocaleDateString()}` : ''}
          </div>
        )}

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <div className="text-[11px] font-semibold tracking-wide text-primary uppercase">Suggested next step</div>
          <div className="mt-1 text-[13px] leading-relaxed text-foreground">{insight.suggested_next_step}</div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onFeedback(insight.id, 'useful')}>
            <ThumbsUp className="h-3.5 w-3.5" /> Useful
          </Button>
          <Button variant="outline" size="sm" onClick={() => onFeedback(insight.id, 'not_relevant')}>
            <X className="h-3.5 w-3.5" /> Not relevant
          </Button>
          <Button variant="ghost" size="sm" disabled={snoozing || snoozed} onClick={handleSnooze}>
            {snoozing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}
            {snoozed ? 'Snoozed' : 'Snooze notifications'}
          </Button>
        </div>

        <div className="mt-4">
          <ActionBriefPanel key={insight.id} insightId={insight.id} />
        </div>

        <div className="mt-4">
          <EvidenceDrawer key={insight.id} insightId={insight.id} onInsightRetracted={onInsightRetracted} />
        </div>
      </CardContent>
    </Card>
  );
}

// PRD §9 "Concern to action" journey + §13. "Where a destination module is
// unavailable, save an editable brief within Intelligence" — there's no
// real Jane Ads/content-calendar handoff yet (deliberately not rushed, see
// update_brief's own docstring), so this IS the complete action for now:
// draft, edit, done. Re-fetches per insight.id via the `key` prop on the
// parent, same pattern EvidenceDrawer already uses.
function ActionBriefPanel({ insightId }: { insightId: string }) {
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<ActionBrief | null>(null);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    MarketIntelligenceService.getBrief(insightId)
      .then((res) => {
        if (res.status && res.responseData) {
          setBrief(res.responseData);
          setMessage(res.responseData.proposed_message);
        }
      })
      .finally(() => setLoading(false));
  }, [insightId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await MarketIntelligenceService.createBrief(insightId);
      if (res.status && res.responseData) {
        setBrief(res.responseData);
        setMessage(res.responseData.proposed_message);
        ToastService.showToast('Action brief created.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not create brief', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not create brief'), ToastTypeEnum.Error);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await MarketIntelligenceService.updateBrief(insightId, message);
      if (res.status && res.responseData) {
        setBrief(res.responseData);
        setDirty(false);
        ToastService.showToast('Brief updated.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not save brief', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not save brief'), ToastTypeEnum.Error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-[12.5px] text-muted-foreground">
        Loading action brief…
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" /> No action brief yet
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          Draft a message for this insight — you can edit it before using it anywhere.
        </div>
        <Button size="sm" className="mt-3" disabled={creating} onClick={handleCreate}>
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          Create action brief
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" /> Action brief
        </div>
        <Badge variant="outline" className="text-[10.5px]">
          {brief.destination === 'market_intelligence' ? 'Saved draft' : brief.destination}
        </Badge>
      </div>

      <div className="mt-3 text-[11.5px] font-medium text-muted-foreground">Customer need</div>
      <div className="text-[12.5px] text-foreground">{brief.customer_need || '—'}</div>

      <div className="mt-3 text-[11.5px] font-medium text-muted-foreground">Proposed message</div>
      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setDirty(true);
        }}
        className="mt-1 min-h-[88px] text-[13px]"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          Backed by {brief.evidence_ids.length} evidence record{brief.evidence_ids.length === 1 ? '' : 's'}
        </span>
        <Button size="sm" disabled={!dirty || saving || !message.trim()} onClick={handleSave}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="max-w-sm text-[13px] text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

// ─── Upcoming items panel ───────────────────────────────────────────────────

function DevelopmentsPanel({ developments, onUpdated }: { developments: Development[]; onUpdated: () => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: DevelopmentStatus) => {
    setUpdatingId(id);
    try {
      const res = await MarketIntelligenceService.updateDevelopment(id, status);
      if (res.status) {
        ToastService.showToast(`Marked ${DEV_STATUS_META[status].label.toLowerCase()}.`, ToastTypeEnum.Success);
        onUpdated();
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update this item', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not update this item'), ToastTypeEnum.Error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (developments.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing tracked yet"
        description="Announcements and dated developments your scans pick up with a verifiable source and date will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {developments.map((d) => {
        const meta = DEV_STATUS_META[d.status];
        return (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] leading-snug font-semibold text-foreground">{d.headline}</div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">
                    {d.issuer ?? 'Unverified issuer'}
                    {d.location ? ` · ${d.location}` : ''} ·{' '}
                    {d.event_date ? new Date(d.event_date).toLocaleDateString() : 'Date to confirm'}
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0', meta.className)}>
                  {meta.label}
                </Badge>
              </div>

              {d.preparation_action && (
                <div className="mt-3 text-[12.5px] text-foreground">
                  <span className="font-medium">Prepare:</span> {d.preparation_action}
                </div>
              )}
              {d.registration_deadline && (
                <div className="mt-1.5 text-[11.5px] text-amber-700 dark:text-amber-400">
                  Registration deadline: {new Date(d.registration_deadline).toLocaleDateString()}
                </div>
              )}
              {d.source_url && (
                <a
                  href={d.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[11.5px] text-primary hover:underline"
                >
                  View source
                </a>
              )}

              {(d.status === 'scheduled' || d.status === 'postponed') && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === d.id}
                    onClick={() => handleUpdate(d.id, 'postponed')}
                  >
                    Mark postponed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === d.id}
                    onClick={() => handleUpdate(d.id, 'cancelled')}
                  >
                    Mark cancelled
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === d.id}
                    onClick={() => handleUpdate(d.id, 'occurred')}
                  >
                    Mark occurred
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Topics & sources panel ─────────────────────────────────────────────────

const DAY_PRESETS: { label: string; value: number }[] = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const addChip = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  return (
    <div>
      <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-2">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 text-[11px]">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addChip();
            }
          }}
          onBlur={addChip}
          placeholder={values.length === 0 ? placeholder : ''}
          className="min-w-[100px] flex-1 border-none bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function NewTopicForm({ onCreated, onCancel }: { onCreated: (topic: Topic) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [days, setDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [usingCustomDays, setUsingCustomDays] = useState(false);
  const [geographicScope, setGeographicScope] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [sensitivity, setSensitivity] = useState<NotificationSensitivity>('normal');
  const [sources, setSources] = useState<SourceCapability[]>([]);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    MarketIntelligenceService.listSources().then((res) => {
      if (res.status) {
        const list = res.responseData ?? [];
        setSources(list);
        setSelectedSources(new Set(list.map((s) => s.provider)));
      }
    });
  }, []);

  const handleSuggestKeywords = async () => {
    if (!question.trim()) return;
    setSuggesting(true);
    try {
      const res = await MarketIntelligenceService.suggestKeywords(question.trim());
      if (res.status && res.responseData) {
        setKeywords(res.responseData.keywords);
        setExcludedKeywords(res.responseData.excluded_keywords);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not suggest keywords', ToastTypeEnum.Error);
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleCreate = async () => {
    if (!question.trim()) return;
    setCreating(true);
    try {
      const requestedDays = usingCustomDays ? parseInt(customDays, 10) || 30 : days;
      const res = await MarketIntelligenceService.createTopic({
        question: question.trim(),
        keywords: keywords.length > 0 ? keywords : undefined,
        excluded_keywords: excludedKeywords,
        sources: selectedSources.size > 0 ? Array.from(selectedSources) : ['mock'],
        geographic_scope: geographicScope.trim() || undefined,
        requested_days: requestedDays,
        competitors,
        languages,
        notification_sensitivity: sensitivity,
      });
      if (res.status && res.responseData) {
        onCreated(res.responseData);
        ToastService.showToast('Topic created — click "Run scan" to collect evidence.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not create topic', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not create topic'), ToastTypeEnum.Error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3.5 p-4">
        <div className="text-[12.5px] text-muted-foreground">
          Ask a plain question, e.g. &ldquo;What stops Lagos customers from ordering ready-to-wear clothes
          online?&rdquo;
        </div>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to understand about your market?"
          className="min-h-[72px]"
        />

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-muted-foreground">Keywords</span>
            <Button variant="ghost" size="xs" disabled={suggesting || !question.trim()} onClick={handleSuggestKeywords}>
              {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Suggest keywords
            </Button>
          </div>
          <ChipInput label="" values={keywords} onChange={setKeywords} placeholder="Add a keyword and press Enter…" />
        </div>
        <ChipInput
          label="Exclude (negative keywords)"
          values={excludedKeywords}
          onChange={setExcludedKeywords}
          placeholder="Add a term to exclude…"
        />

        <div>
          <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Collection window</div>
          <div className="flex flex-wrap gap-1.5">
            {DAY_PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                size="sm"
                variant={!usingCustomDays && days === p.value ? 'default' : 'outline'}
                onClick={() => {
                  setDays(p.value);
                  setUsingCustomDays(false);
                }}
              >
                {p.label}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={usingCustomDays ? 'default' : 'outline'}
              onClick={() => setUsingCustomDays(true)}
            >
              Custom
            </Button>
            {usingCustomDays && (
              <Input
                type="number"
                min={1}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="days"
                className="h-8 w-20"
              />
            )}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Shown against each source&apos;s real accessible period before the scan starts — a shorter window never
            replaces this silently.
          </div>
        </div>

        {sources.length > 0 && (
          <div>
            <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Sources</div>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => {
                const active = selectedSources.has(s.provider);
                return (
                  <button
                    key={s.provider}
                    type="button"
                    onClick={() =>
                      setSelectedSources((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.provider)) next.delete(s.provider);
                        else next.add(s.provider);
                        return next;
                      })
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                    title={s.notes}
                  >
                    {s.provider} · {s.verified_lookback_days}d lookback
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')} />
          Advanced
        </button>

        {showAdvanced && (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Geographic scope</div>
              <Input
                value={geographicScope}
                onChange={(e) => setGeographicScope(e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className="h-8"
              />
            </div>
            <ChipInput
              label="Competitors"
              values={competitors}
              onChange={setCompetitors}
              placeholder="Add a competitor…"
            />
            <ChipInput label="Languages" values={languages} onChange={setLanguages} placeholder="e.g. en, pcm, yo…" />
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Notification sensitivity</div>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as NotificationSensitivity)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-[12.5px] text-foreground"
              >
                <option value="low">Low — only very confident findings</option>
                <option value="normal">Normal</option>
                <option value="high">High — surface more, earlier</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" disabled={creating || !question.trim()} onClick={handleCreate}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {creating ? 'Creating…' : 'Create topic'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicsPanel({
  topics,
  scanningTopicId,
  onRunScan,
  showNewTopic,
  setShowNewTopic,
  onTopicCreated,
  staleScan,
  checkingStale,
  onCheckStale,
}: {
  topics: Topic[];
  scanningTopicId: string | null;
  onRunScan: (topicId: string) => void;
  showNewTopic: boolean;
  setShowNewTopic: (v: boolean) => void;
  onTopicCreated: (topic: Topic) => void;
  staleScan: { topicId: string; scanId: string } | null;
  checkingStale: boolean;
  onCheckStale: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">Topics &amp; sources</div>
          <div className="text-[12.5px] text-muted-foreground">
            Each topic is a standing question Uri keeps evidence against.
          </div>
        </div>
        <Button size="sm" onClick={() => setShowNewTopic(!showNewTopic)}>
          <Plus className="h-3.5 w-3.5" /> New topic
        </Button>
      </div>

      {showNewTopic && (
        <NewTopicForm
          onCreated={(topic) => {
            onTopicCreated(topic);
            setShowNewTopic(false);
          }}
          onCancel={() => setShowNewTopic(false)}
        />
      )}

      {topics.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No topics yet"
          description="Create a topic above to start understanding your market — Uri will suggest keywords and show accessible coverage before it runs a scan."
        />
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="divide-y divide-border">
            {topics.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground">{t.question}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {t.sources.map((s) => (
                      <Badge key={s.provider} variant="secondary" className="text-[10px]">
                        {s.provider}
                      </Badge>
                    ))}
                    {t.keep_updating && (
                      <Badge variant="outline" className="text-[10px]">
                        Auto-updating
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{t.requested_days}d window</span>
                  </div>
                  {scanningTopicId === t.id && (
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      Collecting conversations from your selected sources. You can leave this page and return later.
                    </div>
                  )}
                  {staleScan?.topicId === t.id && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11.5px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                      <span>Still working on this scan. It&apos;s safe to leave and come back — check anytime.</span>
                      <Button
                        variant="outline"
                        size="xs"
                        className="ml-auto shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300"
                        disabled={checkingStale}
                        onClick={onCheckStale}
                      >
                        {checkingStale ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Check now
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={scanningTopicId === t.id}
                  onClick={() => onRunScan(t.id)}
                >
                  {scanningTopicId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {scanningTopicId === t.id ? 'Scanning…' : 'Run scan'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Settings panel ─────────────────────────────────────────────────────────

function SettingsPanel({
  budget,
  preferences,
  onToggleEmail,
}: {
  budget: BrandBudget | null;
  preferences: MINotificationPreferences | null;
  onToggleEmail: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wallet className="h-4 w-4 text-muted-foreground" /> Monthly budget
          </div>
          {budget ? (
            <>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  ${budget.spent_usd.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">of ${budget.monthly_allowance_usd.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, ((budget.spent_usd + budget.reserved_usd) / Math.max(budget.monthly_allowance_usd, 0.01)) * 100)}%`,
                  }}
                />
              </div>
              {budget.reserved_usd > 0 && (
                <div className="mt-1.5 text-[11.5px] text-muted-foreground">
                  ${budget.reserved_usd.toFixed(2)} currently reserved
                </div>
              )}
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                Resets each calendar month · period {budget.period}
              </div>
            </>
          ) : (
            <div className="mt-3 text-[12.5px] text-muted-foreground">Loading budget…</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings2 className="h-4 w-4 text-muted-foreground" /> Notifications
          </div>
          {preferences ? (
            <div className="mt-3 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <div className="text-[13px] font-medium text-foreground">Email me about important findings</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    Act-soon alerts, qualified inquiries and daily digests
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={onToggleEmail}
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-lg border border-border p-2.5">
                  <div className="text-muted-foreground">Timezone</div>
                  <div className="font-medium text-foreground">{preferences.timezone}</div>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <div className="text-muted-foreground">Digest time</div>
                  <div className="font-medium text-foreground">
                    {String(preferences.digest_hour_local).padStart(2, '0')}:00 local
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <div className="text-muted-foreground">Quiet hours</div>
                  <div className="font-medium text-foreground">
                    {String(preferences.quiet_hours_start_local).padStart(2, '0')}:00–
                    {String(preferences.quiet_hours_end_local).padStart(2, '0')}:00
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2.5">
                  <div className="text-muted-foreground">Muted topics</div>
                  <div className="font-medium text-foreground">{preferences.muted_topic_ids.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[12.5px] text-muted-foreground">Loading preferences…</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// PRD §7: "Add optional stock availability, delivery capability, lead time,
// budget ceiling and margin band." Feeds relevance scoring's
// fulfilment_feasibility component directly — an unset field here means
// "unknown," which scoring already treats as 0, never guessed.
function BusinessContextPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockAvailability, setStockAvailability] = useState('');
  const [deliveryCapability, setDeliveryCapability] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [budgetCeiling, setBudgetCeiling] = useState('');
  const [marginBand, setMarginBand] = useState('');

  useEffect(() => {
    BrandProfileService.get().then((res) => {
      if (res.status && res.responseData) {
        const p = res.responseData;
        setStockAvailability(p.stock_availability ?? '');
        setDeliveryCapability(p.delivery_capability ?? '');
        setLeadTime(p.lead_time ?? '');
        setBudgetCeiling(p.budget_ceiling != null ? String(p.budget_ceiling) : '');
        setMarginBand(p.margin_band ?? '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await BrandProfileService.save({
        stock_availability: stockAvailability,
        delivery_capability: deliveryCapability,
        lead_time: leadTime,
        budget_ceiling: budgetCeiling ? parseFloat(budgetCeiling) : undefined,
        margin_band: marginBand,
      });
      if (res.status) {
        ToastService.showToast('Business context saved.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not save business context', ToastTypeEnum.Error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="h-4 w-4 text-muted-foreground" /> Business context
        </div>
        <div className="mt-1 text-[11.5px] text-muted-foreground">
          Unknown facts stay unknown — Uri never assumes stock or delivery, and recommendations are labelled
          &ldquo;Check suitability&rdquo; until you fill these in.
        </div>
        {loading ? (
          <div className="mt-3 text-[12.5px] text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Stock availability</div>
              <Input
                value={stockAvailability}
                onChange={(e) => setStockAvailability(e.target.value)}
                placeholder="e.g. in stock"
                className="h-8"
              />
            </div>
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Delivery capability</div>
              <Input
                value={deliveryCapability}
                onChange={(e) => setDeliveryCapability(e.target.value)}
                placeholder="e.g. same-day in Lagos"
                className="h-8"
              />
            </div>
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Lead time</div>
              <Input
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="e.g. 2-3 business days"
                className="h-8"
              />
            </div>
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Budget ceiling (₦)</div>
              <Input
                type="number"
                value={budgetCeiling}
                onChange={(e) => setBudgetCeiling(e.target.value)}
                placeholder="e.g. 50000"
                className="h-8"
              />
            </div>
            <div>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Margin band</div>
              <select
                value={marginBand}
                onChange={(e) => setMarginBand(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-[12.5px] text-foreground"
              >
                <option value="">Unset</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        )}
        <Button size="sm" className="mt-3.5" disabled={saving || loading} onClick={handleSave}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}

// PRD §21. Renders nothing for anyone who isn't the brand owner (or an
// agency admin) — GET /access 403s for everyone else, and that's the
// signal to just hide this card rather than show an error a regular
// teammate has no use for.
function AccessControlPanel() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = () => {
    MarketIntelligenceService.listAccessGrants()
      .then((res) => {
        if (res.status) {
          setGrants(res.responseData ?? []);
          setVisible(true);
        }
      })
      .catch(() => {
        // 403 — not a manager for this brand. Stay hidden, no error toast.
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRestrict = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await MarketIntelligenceService.setAccessGrant(email.trim(), 'view_only');
      if (res.status) {
        ToastService.showToast(`${email.trim()} is now view-only for Market Intelligence.`, ToastTypeEnum.Success);
        setEmail('');
        load();
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update access', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not update access'), ToastTypeEnum.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreFull = async (grant: AccessGrant) => {
    setRestoringId(grant.id);
    try {
      const res = await MarketIntelligenceService.setAccessGrant(grant.email ?? '', 'full' as MIAccessLevel);
      if (res.status) {
        ToastService.showToast('Full access restored.', ToastTypeEnum.Success);
        load();
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update access', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not update access'), ToastTypeEnum.Error);
    } finally {
      setRestoringId(null);
    }
  };

  if (loading || !visible) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-muted-foreground" /> Team access
        </div>
        <div className="mt-1 text-[11.5px] text-muted-foreground">
          Everyone with access to this brand can act on Market Intelligence by default. Restrict a teammate to view-only
          if you don&apos;t want them running scans, creating topics or acting on insights.
        </div>

        {grants.length > 0 && (
          <div className="mt-3 space-y-2">
            {grants.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-foreground">
                    {g.user_name || g.email || g.user_id}
                  </div>
                  <div className="text-[11px] text-muted-foreground">View-only</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-[11.5px]"
                  disabled={restoringId === g.id || !g.email}
                  onClick={() => handleRestoreFull(g)}
                >
                  {restoringId === g.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Restore full access
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="h-8"
            type="email"
          />
          <Button size="sm" className="h-8 shrink-0" disabled={submitting || !email.trim()} onClick={handleRestrict}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Restrict to view-only
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

type TabId = 'overview' | 'topics' | 'upcoming' | 'settings';

// Survives a component remount (switching workspace tabs and coming back)
// within the same browser tab, so "leave and return" (PRD §9) actually
// shows the real in-progress state instead of nothing.
const ACTIVE_SCAN_STORAGE_KEY = 'mi_active_scan';

type StoredScan = { topicId: string; scanId: string };

function readStoredScan(): StoredScan | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_SCAN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredScan) : null;
  } catch {
    return null;
  }
}

function writeStoredScan(value: StoredScan | null) {
  try {
    if (value) sessionStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(ACTIVE_SCAN_STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — polling still works within this
    // page load, it just won't resume correctly after a remount. Non-fatal.
  }
}

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'topics', label: 'Topics & Sources', icon: Layers },
  { id: 'upcoming', label: 'Upcoming Items', icon: CalendarClock },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

/**
 * Uri Market Intelligence — PRD "Uri Market Intelligence" v1.0.
 * Organised into the distinct surfaces PRD §15 calls for (Intelligence home,
 * Topics, Upcoming items, Settings) rather than one long stacked column, with
 * a master-detail layout for insights matching §15's "Insight detail" +
 * evidence-drawer separation. Scans run against the mock adapter only until a
 * real provider adapter lands in uri-social-backend's scan_runner.ADAPTER_REGISTRY.
 */
export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [insights, setInsights] = useState<InsightVersion[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [budget, setBudget] = useState<BrandBudget | null>(null);
  const [preferences, setPreferences] = useState<MINotificationPreferences | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [scanningTopicId, setScanningTopicId] = useState<string | null>(null);
  const [staleScan, setStaleScan] = useState<{ topicId: string; scanId: string } | null>(null);
  const [checkingStale, setCheckingStale] = useState(false);
  const [lastScanHadGaps, setLastScanHadGaps] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Ties each poll() recursion to the sequence that started it, so a stray
  // setTimeout from a poll loop that's no longer relevant (component
  // unmounted, or a different scan started) can recognise that on its next
  // tick and quietly stop instead of firing a stale toast out of nowhere —
  // the exact bug behind "left the page, came back, saw a confusing
  // timeout message with nothing actually running."
  const pollSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      pollSeqRef.current += 1;
    };
  }, []);

  const loadDevelopments = async () => {
    const res = await MarketIntelligenceService.listDevelopments();
    if (res.status) setDevelopments(res.responseData ?? []);
  };

  const loadBudget = async () => {
    const res = await MarketIntelligenceService.getBudget();
    if (res.status) setBudget(res.responseData ?? null);
  };

  const loadPreferences = async () => {
    const res = await MarketIntelligenceService.getPreferences();
    if (res.status) setPreferences(res.responseData ?? null);
  };

  const handleToggleEmail = async () => {
    if (!preferences) return;
    try {
      const res = await MarketIntelligenceService.updatePreferences({ email_enabled: !preferences.email_enabled });
      if (res.status) {
        setPreferences(res.responseData ?? null);
        ToastService.showToast(
          res.responseData?.email_enabled ? 'Email alerts turned on.' : 'Email alerts turned off.',
          ToastTypeEnum.Success
        );
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update this preference', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not update this preference'), ToastTypeEnum.Error);
    }
  };

  const loadAll = async (preserveSelection = true) => {
    const [topicsRes, insightsRes] = await Promise.all([
      MarketIntelligenceService.listTopics(),
      MarketIntelligenceService.listInsights(),
    ]);
    loadDevelopments();
    loadBudget();
    if (topicsRes.status) setTopics(topicsRes.responseData ?? []);
    if (insightsRes.status) {
      const list = insightsRes.responseData ?? [];
      setInsights(list);
      setSelectedId((prev) => {
        if (preserveSelection && prev && list.some((i) => i.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll(false);
    loadPreferences();
    // PRD §9: "Return a job identifier immediately, allow the user to leave
    // and return." A scan started before a remount (switching workspace
    // tabs and coming back) is resumed here instead of just vanishing from
    // view with no indication it's still running.
    const stored = readStoredScan();
    if (stored) beginPolling(stored.topicId, stored.scanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicCreated = (topic: Topic) => {
    setTopics((prev) => [topic, ...prev]);
  };

  // A poll sequence carries the token it was started with (mySeq). Every
  // check — before AND after each await — compares against
  // pollSeqRef.current: if a newer sequence has since started (a fresh scan
  // kicked off) or the component unmounted (see the cleanup effect above,
  // which bumps the ref), this one recognises it's stale and stops
  // silently — no state update, no toast fired into a page the user isn't
  // even looking at anymore.
  const beginPolling = (topicId: string, scanId: string) => {
    pollSeqRef.current += 1;
    const mySeq = pollSeqRef.current;
    writeStoredScan({ topicId, scanId });
    setScanningTopicId(topicId);
    setStaleScan(null);

    const poll = async (attempt: number) => {
      if (pollSeqRef.current !== mySeq) return;
      const scanRes = await MarketIntelligenceService.getScan(scanId);
      if (pollSeqRef.current !== mySeq) return;

      const status = scanRes.responseData?.status;
      if (status === 'completed' || status === 'partial' || status === 'failed' || status === 'budget_limited') {
        setScanningTopicId(null);
        writeStoredScan(null);
        setLastScanHadGaps(status === 'partial' || status === 'budget_limited');
        await loadAll();
        loadBudget();
        if (status === 'budget_limited') {
          ToastService.showToast('This scan reached its collection limit. Results are partial.', ToastTypeEnum.Warning);
        } else if (status === 'partial') {
          ToastService.showToast('Results cover the available period shown below.', ToastTypeEnum.Success);
        } else if (status === 'failed') {
          ToastService.showToast('Scan failed. You can retry any time from Topics & Sources.', ToastTypeEnum.Error);
        } else {
          ToastService.showToast('Scan complete.', ToastTypeEnum.Success);
        }
        return;
      }
      if (attempt > 30) {
        // Not a dead end: the scan may genuinely still be running (a real
        // provider adapter can take longer than the mock one), and the
        // backend now self-heals a run that's actually stuck after a few
        // minutes. Stop auto-polling to avoid running forever in the
        // background, but leave a real, checkable status instead of a
        // one-shot toast that disappears and leaves no trace.
        setScanningTopicId(null);
        setStaleScan({ topicId, scanId });
        return;
      }
      setTimeout(() => poll(attempt + 1), 1000);
    };
    poll(0);
  };

  const handleRunScan = async (topicId: string) => {
    setScanningTopicId(topicId);
    try {
      const previewRes = await MarketIntelligenceService.getCoveragePreview(topicId);
      if (previewRes.status) {
        for (const p of previewRes.responseData ?? []) {
          if (p.capped && p.note) {
            ToastService.showToast(p.note, ToastTypeEnum.Warning);
          }
        }
      }

      const res = await MarketIntelligenceService.startScan(topicId);
      if (!res.status || !res.responseData) {
        ToastService.showToast(res.responseMessage || 'Could not start scan', ToastTypeEnum.Error);
        setScanningTopicId(null);
        return;
      }
      if (res.responseData.status === 'budget_limited') {
        setScanningTopicId(null);
        ToastService.showToast('This scan reached its collection limit. Results are partial.', ToastTypeEnum.Warning);
        loadBudget();
        return;
      }

      beginPolling(topicId, res.responseData.id);
    } catch (err) {
      setScanningTopicId(null);
      ToastService.showToast(mutationErrorMessage(err, 'Could not start scan'), ToastTypeEnum.Error);
    }
  };

  const handleCheckStale = async () => {
    if (!staleScan) return;
    setCheckingStale(true);
    try {
      const scanRes = await MarketIntelligenceService.getScan(staleScan.scanId);
      const status = scanRes.responseData?.status;
      if (status === 'completed' || status === 'partial' || status === 'failed' || status === 'budget_limited') {
        setStaleScan(null);
        writeStoredScan(null);
        setLastScanHadGaps(status === 'partial' || status === 'budget_limited');
        await loadAll();
        loadBudget();
        ToastService.showToast(
          status === 'failed' ? 'Scan failed. You can retry any time.' : 'Scan finished — results updated.',
          status === 'failed' ? ToastTypeEnum.Error : ToastTypeEnum.Success
        );
      } else {
        ToastService.showToast('Still working — check again in a moment.', ToastTypeEnum.Warning);
      }
    } finally {
      setCheckingStale(false);
    }
  };

  const handleFeedback = async (insightId: string, verdict: 'useful' | 'not_relevant') => {
    try {
      const res = await MarketIntelligenceService.submitFeedback(insightId, verdict);
      if (res.status) {
        ToastService.showToast('Thanks for the feedback.', ToastTypeEnum.Success);
        if (verdict === 'not_relevant') {
          setInsights((prev) => {
            const next = prev.filter((i) => i.id !== insightId);
            setSelectedId((prevSelected) => (prevSelected === insightId ? (next[0]?.id ?? null) : prevSelected));
            return next;
          });
        }
      } else {
        ToastService.showToast(res.responseMessage || 'Could not submit feedback', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(mutationErrorMessage(err, 'Could not submit feedback'), ToastTypeEnum.Error);
    }
  };

  const handleInsightRetracted = () => {
    loadAll(false);
  };

  const filteredInsights = useMemo(() => {
    return insights.filter((i) => {
      if (typeFilter !== 'all' && i.type !== typeFilter) return false;
      if (search.trim() && !i.headline.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [insights, search, typeFilter]);

  const selectedInsight = insights.find((i) => i.id === selectedId) ?? null;
  const urgentCount = insights.filter((i) => i.urgency.is_urgent).length;
  const autoUpdatingCount = topics.filter((t) => t.keep_updating).length;
  const soonestDevelopment = [...developments]
    .filter((d) => d.event_date && (d.status === 'scheduled' || d.status === 'postponed'))
    .sort((a, b) => new Date(a.event_date as string).getTime() - new Date(b.event_date as string).getTime())[0];

  const availableTypes = useMemo(() => Array.from(new Set(insights.map((i) => i.type))), [insights]);

  return (
    <div className="w-full bg-background">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Market Intelligence</h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              What customers want, what stops them buying, and what&apos;s changing in your market — with evidence, not
              guesses.
            </p>
          </div>
          <Button
            onClick={() => {
              setActiveTab('topics');
              setShowNewTopic(true);
            }}
          >
            <Plus className="h-4 w-4" /> New topic
          </Button>
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={Layers}
            label="Active topics"
            value={topics.length}
            hint={`${autoUpdatingCount} auto-updating`}
          />
          <KpiCard
            icon={LayoutDashboard}
            label="Active insights"
            value={insights.length}
            hint={urgentCount > 0 ? `${urgentCount} urgent` : 'none urgent'}
          />
          <KpiCard
            icon={CalendarClock}
            label="Upcoming items"
            value={developments.length}
            hint={
              soonestDevelopment
                ? `next: ${new Date(soonestDevelopment.event_date as string).toLocaleDateString()}`
                : 'none tracked'
            }
          />
          <KpiCard
            icon={Wallet}
            label="Budget this month"
            value={budget ? `$${budget.spent_usd.toFixed(2)}` : '—'}
            hint={budget ? `of $${budget.monthly_allowance_usd.toFixed(2)} allowance` : undefined}
            footer={
              budget ? (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, ((budget.spent_usd + budget.reserved_usd) / Math.max(budget.monthly_allowance_usd, 0.01)) * 100)}%`,
                    }}
                  />
                </div>
              ) : undefined
            }
          />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === 'upcoming' && developments.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9.5px]">
                    {developments.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="mt-5">
          {activeTab === 'overview' &&
            (loading ? (
              <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your market intelligence…
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={topics.length === 0 ? 'Create a topic to get started' : 'No strong findings yet'}
                description={
                  topics.length === 0
                    ? 'Create a topic to start understanding your market.'
                    : lastScanHadGaps
                      ? 'We found some relevant conversations, but there is not enough comparable data to assess a trend.'
                      : 'No strong findings in this period. Try a broader question or keep tracking.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[400px_1fr]">
                <Card className="overflow-hidden py-0">
                  <div className="flex items-center gap-2 border-b border-border p-3">
                    <div className="relative flex-1">
                      <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search insights…"
                        className="h-8 pl-8 text-[12.5px]"
                      />
                    </div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground"
                    >
                      <option value="all">All types</option>
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>
                          {formatTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {filteredInsights.length === 0 ? (
                      <div className="p-6 text-center text-[12.5px] text-muted-foreground">
                        No insights match your filters.
                      </div>
                    ) : (
                      filteredInsights.map((insight) => (
                        <InsightListRow
                          key={insight.id}
                          insight={insight}
                          active={insight.id === selectedId}
                          onClick={() => setSelectedId(insight.id)}
                        />
                      ))
                    )}
                  </div>
                </Card>

                <div>
                  {selectedInsight ? (
                    <InsightDetail
                      insight={selectedInsight}
                      onFeedback={handleFeedback}
                      onInsightRetracted={handleInsightRetracted}
                    />
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Select an insight"
                      description="Pick an insight from the list to see the full detail and evidence."
                    />
                  )}
                </div>
              </div>
            ))}

          {activeTab === 'topics' && (
            <TopicsPanel
              topics={topics}
              scanningTopicId={scanningTopicId}
              onRunScan={handleRunScan}
              showNewTopic={showNewTopic}
              setShowNewTopic={setShowNewTopic}
              onTopicCreated={handleTopicCreated}
              staleScan={staleScan}
              checkingStale={checkingStale}
              onCheckStale={handleCheckStale}
            />
          )}

          {activeTab === 'upcoming' && <DevelopmentsPanel developments={developments} onUpdated={loadDevelopments} />}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <SettingsPanel budget={budget} preferences={preferences} onToggleEmail={handleToggleEmail} />
              <BusinessContextPanel />
              <AccessControlPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
