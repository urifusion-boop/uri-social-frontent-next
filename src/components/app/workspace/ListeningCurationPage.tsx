'use client';

/**
 * Listening curation console (PRD §6.3's curation console, §17's human
 * review/quality tooling) — platform-admin only. A market and its topics,
 * sources and readings are shared across every subscribed business, not
 * any one tenant's own data, so this lives outside the brand-scoped
 * Market Intelligence page and is gated the same way AdminUsersPage.tsx
 * is: client-side redirect for UX, every endpoint re-checks server-side
 * regardless.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  Gauge,
  Globe2,
  Inbox,
  Loader2,
  Radio,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Star,
  Tags,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  CurationMarket,
  CurationTopic,
  GoldenExample,
  MarketIntelligenceService,
  PendingReview,
  ProductMetrics,
  ReplayResult,
  SourcePermission,
  TopicStatus,
} from '@/src/api/MarketIntelligenceService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const errMsg = (err: unknown, fallback: string): string => {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === 'string' && detail ? detail : fallback;
};

const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
};

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
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
      </CardContent>
    </Card>
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

const SelectEl = ({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={cn('h-8 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground', className)}
  >
    {children}
  </select>
);

const TOPIC_STATUS_META: Record<TopicStatus, { label: string; className: string }> = {
  observed: { label: 'Observed', className: 'bg-muted text-muted-foreground border-border' },
  candidate: { label: 'Candidate', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  monitored: { label: 'Monitored', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: 'Paused', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  retired: { label: 'Retired', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

type TabId = 'topics' | 'sources' | 'reviews' | 'golden' | 'replay' | 'metrics';
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'topics', label: 'Topics', icon: Tags },
  { id: 'sources', label: 'Sources', icon: ShieldCheck },
  { id: 'reviews', label: 'Review queue', icon: Inbox },
  { id: 'golden', label: 'Golden sets', icon: Star },
  { id: 'replay', label: 'Replay', icon: FlaskConical },
  { id: 'metrics', label: 'Metrics', icon: Gauge },
];

/* ══════════════════════════════════ Topics tab ══════════════════════════ */

function TopicsTab({ markets, market }: { markets: CurationMarket[]; market: string }) {
  const [status, setStatus] = useState<string>('');
  const [topics, setTopics] = useState<CurationTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingKey, setDecidingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketIntelligenceService.getCurationTopics({
        status: status || undefined,
        market: market || undefined,
        limit: 100,
      });
      setTopics(res.status ? (res.responseData ?? []) : []);
    } catch {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [status, market]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (t: CurationTopic, newStatus: TopicStatus) => {
    setDecidingKey(t.key);
    try {
      const res = await MarketIntelligenceService.decideCurationTopic(t.market, t.key, { status: newStatus });
      if (res.status) {
        ToastService.showToast(
          `"${t.name || t.key}" set to ${TOPIC_STATUS_META[newStatus].label}.`,
          ToastTypeEnum.Success
        );
        setTopics((ts) => ts.filter((x) => !(x.market === t.market && x.key === t.key)));
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update topic', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not update topic'), ToastTypeEnum.Error);
    } finally {
      setDecidingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectEl value={status} onChange={setStatus}>
          <option value="">Observed + Candidate (default)</option>
          <option value="observed">Observed</option>
          <option value="candidate">Candidate</option>
          <option value="monitored">Monitored</option>
          <option value="paused">Paused</option>
          <option value="retired">Retired</option>
        </SelectEl>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading topics…
        </div>
      ) : topics.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nothing waiting on a decision"
          description="Topics appear here once they're observed or candidate — words and phrases Uri has seen but hasn't promoted to a monitored search term yet."
        />
      ) : (
        <>
          {/* Table on wider screens — dense and scannable for many rows. */}
          <Card className="hidden overflow-hidden py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Decided by</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics.map((t) => {
                  const meta = TOPIC_STATUS_META[t.status] ?? TOPIC_STATUS_META.observed;
                  const busy = decidingKey === t.key;
                  return (
                    <TableRow key={`${t.market}:${t.key}`}>
                      <TableCell className="font-medium text-foreground">{t.name || t.key}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {markets.find((m) => m.key === t.market)?.label || t.market}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            meta.className
                          )}
                        >
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(t.last_seen)}</TableCell>
                      <TableCell className="text-muted-foreground">{t.decided_by || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {t.status !== 'monitored' && (
                            <Button size="xs" variant="outline" disabled={busy} onClick={() => decide(t, 'monitored')}>
                              Promote
                            </Button>
                          )}
                          {t.status !== 'retired' && (
                            <Button size="xs" variant="ghost" disabled={busy} onClick={() => decide(t, 'retired')}>
                              Retire
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Card stack on narrow screens — a wide table here either clips
              the Status/Action columns off-screen with no scroll hint, or
              forces a side-scroll nobody expects on a phone. */}
          <div className="space-y-2.5 md:hidden">
            {topics.map((t) => {
              const meta = TOPIC_STATUS_META[t.status] ?? TOPIC_STATUS_META.observed;
              const busy = decidingKey === t.key;
              return (
                <Card key={`${t.market}:${t.key}`}>
                  <CardContent className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-foreground">{t.name || t.key}</div>
                        <div className="truncate text-[11.5px] text-muted-foreground">
                          {markets.find((m) => m.key === t.market)?.label || t.market}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          meta.className
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Last seen {fmtDate(t.last_seen)}
                      {t.decided_by ? ` · decided by ${t.decided_by}` : ''}
                    </div>
                    <div className="flex gap-1.5">
                      {t.status !== 'monitored' && (
                        <Button size="xs" variant="outline" disabled={busy} onClick={() => decide(t, 'monitored')}>
                          Promote
                        </Button>
                      )}
                      {t.status !== 'retired' && (
                        <Button size="xs" variant="ghost" disabled={busy} onClick={() => decide(t, 'retired')}>
                          Retire
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════ Sources tab ═════════════════════════ */

function SourcesTab() {
  const [sources, setSources] = useState<SourcePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySource, setBusySource] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketIntelligenceService.getSourcePermissions();
      setSources(res.status ? (res.responseData ?? []) : []);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (s: SourcePermission) => {
    setBusySource(s.source);
    try {
      const res = await MarketIntelligenceService.setSourceApproval(s.source, { approved: !s.approved });
      if (res.status && res.responseData) {
        setSources((ss) => ss.map((x) => (x.source === s.source ? res.responseData! : x)));
        ToastService.showToast(
          res.responseData.approved
            ? `${s.source} approved — collection resumes on its next run.`
            : `${s.source} revoked — collection stops on its next run.`,
          ToastTypeEnum.Success
        );
      } else {
        ToastService.showToast(res.responseMessage || 'Could not update source', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not update source'), ToastTypeEnum.Error);
    } finally {
      setBusySource(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading sources…
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No source permission records yet"
        description="Each connector (X, X Pro, …) gets a permission record — terms, allowed use, retention and display rules — approved before it can collect anything."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {sources.map((s) => (
        <Card key={s.source}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    s.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  )}
                >
                  {s.approved ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                </div>
                <div className="text-[14px] font-semibold text-foreground">{s.source}</div>
              </div>
              <Badge variant={s.approved ? 'default' : 'destructive'} className="text-[10px]">
                {s.approved ? 'Approved' : 'Revoked'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <div>
                <span className="text-foreground">Retention:</span> {s.retention_days ?? '—'} days
              </div>
              <div>
                <span className="text-foreground">Approved by:</span> {s.approved_by || '—'}
              </div>
              <div className="col-span-2">
                <span className="text-foreground">Allowed use:</span> {(s.allowed_use || []).join(', ') || '—'}
              </div>
              {s.display_rules && (
                <div className="col-span-2">
                  <span className="text-foreground">Display rules:</span> max {s.display_rules.max_excerpt_chars ?? '—'}{' '}
                  chars
                  {s.display_rules.require_link ? ', link required' : ''}
                  {s.display_rules.require_attribution ? ', attribution required' : ''}
                </div>
              )}
              {s.notes && <div className="col-span-2 italic text-muted-foreground">{s.notes}</div>}
            </div>
            <Button
              size="sm"
              variant={s.approved ? 'outline' : 'default'}
              disabled={busySource === s.source}
              onClick={() => toggle(s)}
            >
              {busySource === s.source ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : s.approved ? (
                <ShieldOff className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {s.approved ? 'Revoke' : 'Approve'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ══════════════════════════════════ Reviews tab ═════════════════════════ */

function ReviewRow({ r, onResolved }: { r: PendingReview; onResolved: (r: PendingReview) => void }) {
  const [open, setOpen] = useState(false);
  const [onTopic, setOnTopic] = useState<boolean | undefined>(r.on_topic);
  const [intent, setIntent] = useState(r.intent || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    setBusy(true);
    try {
      const res = await MarketIntelligenceService.resolveReview(r.market, r.source_id, {
        on_topic: onTopic,
        intent: intent || undefined,
        note: note || undefined,
      });
      if (res.status) {
        ToastService.showToast('Correction recorded.', ToastTypeEnum.Success);
        onResolved(r);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not resolve', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not resolve'), ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
  };

  const markGolden = async () => {
    setBusy(true);
    try {
      const res = await MarketIntelligenceService.markGolden(r.market, r.source_id);
      if (res.status) {
        ToastService.showToast('Marked as a golden example.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not mark golden', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not mark golden'), ToastTypeEnum.Error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="space-y-2.5 p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {r.market}
          </Badge>
          <span>confidence {r.confidence != null ? Math.round(r.confidence * 100) : '—'}%</span>
          <span>·</span>
          <span>{r.intent || 'no intent yet'}</span>
          <span>·</span>
          <span>on-topic: {r.on_topic === undefined ? '—' : r.on_topic ? 'yes' : 'no'}</span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="ml-auto inline-flex items-center gap-1 font-medium text-primary"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
            {open ? 'Close' : 'Resolve'}
          </button>
        </div>
        {r.text && <p className="text-[13px] leading-relaxed text-foreground/90">"{r.text}"</p>}
        {r.url && (
          <a href={r.url} target="_blank" rel="noreferrer" className="text-[11.5px] text-primary">
            View source
          </a>
        )}
        {open && (
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[12px] text-foreground">
                <input type="radio" checked={onTopic === true} onChange={() => setOnTopic(true)} /> On-topic
              </label>
              <label className="flex items-center gap-1.5 text-[12px] text-foreground">
                <input type="radio" checked={onTopic === false} onChange={() => setOnTopic(false)} /> Off-topic
              </label>
              <Input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Corrected intent (optional)"
                className="h-7 max-w-55 text-[12px]"
              />
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note for the training record (optional)"
              className="min-h-15 text-[12px]"
            />
            <div className="flex gap-2">
              <Button size="xs" disabled={busy} onClick={resolve}>
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Save correction
              </Button>
              <Button size="xs" variant="outline" disabled={busy} onClick={markGolden}>
                <Star className="h-3 w-3" /> Mark golden
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewsTab({ market }: { market: string }) {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketIntelligenceService.getPendingReviews({ market: market || undefined, limit: 50 });
      setReviews(res.status ? (res.responseData ?? []) : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the review queue…
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing waiting on review"
        description="Low-confidence classifications land here, most uncertain first, so a curator can correct them before they feed training data."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow
          key={`${r.market}:${r.source_id}`}
          r={r}
          onResolved={() => setReviews((rs) => rs.filter((x) => x.source_id !== r.source_id))}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════ Golden tab ══════════════════════════ */

function GoldenTab({ market }: { market: string }) {
  const [items, setItems] = useState<GoldenExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketIntelligenceService.getGoldenExamples({ market: market || undefined, limit: 200 });
      setItems(res.status ? (res.responseData ?? []) : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    load();
  }, [load]);

  const unmark = async (g: GoldenExample) => {
    setBusyId(g.source_id);
    try {
      const res = await MarketIntelligenceService.unmarkGolden(g.market, g.source_id);
      if (res.status) {
        setItems((is) => is.filter((x) => x.source_id !== g.source_id));
        ToastService.showToast('Removed from the golden set.', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(res.responseMessage || 'Could not remove', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not remove'), ToastTypeEnum.Error);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading golden examples…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No golden examples yet"
        description="Resolve a reading in the review queue and mark it golden to start an evaluation anchor set — hand-confirmed labels for relevance, intent, sentiment and buying intent."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((g) => (
        <Card key={`${g.market}:${g.source_id}`}>
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">
                  {g.market}
                </Badge>
                <span>{g.intent || 'no intent'}</span>
                <span>·</span>
                <span>on-topic: {g.on_topic ? 'yes' : 'no'}</span>
                {g.sentiment && (
                  <>
                    <span>·</span>
                    <span>{g.sentiment}</span>
                  </>
                )}
              </div>
              {g.text && <p className="text-[13px] text-foreground/90">"{g.text}"</p>}
              <div className="text-[11px] text-muted-foreground">
                Marked by {g.marked_by || '—'} · {fmtDate(g.marked_at)}
              </div>
            </div>
            <Button size="xs" variant="ghost" disabled={busyId === g.source_id} onClick={() => unmark(g)}>
              {busyId === g.source_id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ══════════════════════════════════ Replay tab ══════════════════════════ */

function ReplayTab({ markets, market }: { markets: CurationMarket[]; market: string }) {
  const [selectedMarket, setSelectedMarket] = useState(market || markets[0]?.key || '');
  const [timestamps, setTimestamps] = useState(() => new Date().toISOString().slice(0, 16));
  const [overridesText, setOverridesText] = useState('{}');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReplayResult[] | null>(null);

  useEffect(() => {
    if (market) setSelectedMarket(market);
  }, [market]);

  const run = async () => {
    if (!selectedMarket) {
      ToastService.showToast('Pick a market to replay.', ToastTypeEnum.Warning);
      return;
    }
    let overrides: Record<string, unknown> = {};
    try {
      overrides = overridesText.trim() ? JSON.parse(overridesText) : {};
    } catch {
      ToastService.showToast('Candidate overrides must be valid JSON.', ToastTypeEnum.Error);
      return;
    }
    const at = timestamps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.length === 16 ? `${s}:00` : s));
    if (at.length === 0) {
      ToastService.showToast('Add at least one timestamp to replay.', ToastTypeEnum.Warning);
      return;
    }
    setRunning(true);
    setResults(null);
    try {
      const res = await MarketIntelligenceService.replayDetection({
        market: selectedMarket,
        at,
        candidate_overrides: overrides,
      });
      if (res.status) {
        setResults(res.responseData ?? []);
      } else {
        ToastService.showToast(res.responseMessage || 'Replay failed', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Replay failed'), ToastTypeEnum.Error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="text-[13px] font-medium text-foreground">
            Run a candidate detection config against stored history
          </div>
          <p className="text-[12px] text-muted-foreground">
            Nothing here is persisted — compares what a candidate config (e.g. different thresholds) would have produced
            against what the live config actually stored, before a change ships.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] font-medium text-muted-foreground">Market</div>
              <SelectEl value={selectedMarket} onChange={setSelectedMarket} className="w-full">
                <option value="">Select a market…</option>
                {markets.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label || m.key}
                  </option>
                ))}
              </SelectEl>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                Timestamps to replay (one per line)
              </div>
              <Textarea
                value={timestamps}
                onChange={(e) => setTimestamps(e.target.value)}
                className="min-h-9.5 font-mono text-[12px]"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-muted-foreground">Candidate config overrides (JSON)</div>
            <Textarea
              value={overridesText}
              onChange={(e) => setOverridesText(e.target.value)}
              className="min-h-17.5 font-mono text-[12px]"
              placeholder='{"trend": {"min_accounts": 5}}'
            />
          </div>
          <Button size="sm" disabled={running} onClick={run}>
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            Run replay
          </Button>
        </CardContent>
      </Card>

      {results &&
        (results.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No results"
            description="The replay ran but returned nothing to compare."
          />
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <Card key={`${r.market}:${r.day}`}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
                    <span className="font-medium text-foreground">{r.day}</span>
                    <span className="text-muted-foreground">candidate: {r.candidate_signal_count} signals</span>
                    <span className="text-muted-foreground">compared: {r.compared_signal_count} signals</span>
                    <span className="text-muted-foreground">agreement: {r.agreement_count}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-700">New signals (candidate only)</div>
                      {r.new_signals.length === 0 ? (
                        <div className="text-[11.5px] text-muted-foreground">None</div>
                      ) : (
                        <ul className="mt-1 space-y-0.5 text-[12px] text-foreground">
                          {r.new_signals.map((s, i) => (
                            <li key={i}>
                              {s.topic} <span className="text-muted-foreground">({s.type})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-rose-700">Missed signals (compared only)</div>
                      {r.missed_signals.length === 0 ? (
                        <div className="text-[11.5px] text-muted-foreground">None</div>
                      ) : (
                        <ul className="mt-1 space-y-0.5 text-[12px] text-foreground">
                          {r.missed_signals.map((s, i) => (
                            <li key={i}>
                              {s.topic} <span className="text-muted-foreground">({s.type})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
}

/* ══════════════════════════════════ Metrics tab ═════════════════════════ */

function MetricsTab({ markets, market }: { markets: CurationMarket[]; market: string }) {
  const [selectedMarket, setSelectedMarket] = useState(market);
  const [windowDays, setWindowDays] = useState(30);
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedMarket(market);
  }, [market]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MarketIntelligenceService.getProductMetrics({
        market: selectedMarket || undefined,
        window_days: windowDays,
      });
      setMetrics(res.status ? (res.responseData ?? null) : null);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMarket, windowDays]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectEl value={selectedMarket} onChange={setSelectedMarket}>
          <option value="">All markets</option>
          {markets.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label || m.key}
            </option>
          ))}
        </SelectEl>
        <Input
          type="number"
          value={windowDays}
          onChange={(e) => setWindowDays(Math.max(1, Number(e.target.value) || 30))}
          className="h-8 w-20 text-[12px]"
        />
        <span className="text-[12px] text-muted-foreground">days</span>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading metrics…
        </div>
      ) : !metrics || metrics.cards_shown === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No cards shown in this window"
          description="Metrics are computed only from cards actually shown to a business and the actions taken on them — nothing to show yet for this window."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={Sparkles}
              label="Cards shown"
              value={metrics.cards_shown}
              hint={`last ${metrics.window_days} days`}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Useful or acted on"
              value={
                metrics.useful_or_acted_on_rate != null ? `${Math.round(metrics.useful_or_acted_on_rate * 100)}%` : '—'
              }
            />
            <KpiCard
              icon={AlertCircle}
              label="Dismissal rate"
              value={metrics.dismissal_rate != null ? `${Math.round(metrics.dismissal_rate * 100)}%` : '—'}
            />
            <KpiCard
              icon={Sparkles}
              label="Content created"
              value={metrics.content_created_count ?? '—'}
              hint={
                metrics.content_created_rate != null
                  ? `${Math.round(metrics.content_created_rate * 100)}% of cards`
                  : undefined
              }
            />
          </div>

          {metrics.dismissal_reasons && Object.keys(metrics.dismissal_reasons).length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 text-[12.5px] font-medium text-foreground">Top dismissal reasons</div>
                <div className="space-y-1.5">
                  {Object.entries(metrics.dismissal_reasons).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">{reason}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.not_available && Object.keys(metrics.not_available).length > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="mb-2 text-[12.5px] font-medium text-foreground">Not yet available</div>
                <div className="space-y-1.5">
                  {Object.entries(metrics.not_available).map(([key, reason]) => (
                    <div key={key} className="text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground">{key.replace(/_/g, ' ')}:</span> {reason}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════ Main page ═══════════════════════════ */

export default function ListeningCurationPage({ onBack }: { onBack: () => void }) {
  const { isAdminUser, isAdminStatusPending } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('topics');
  const [markets, setMarkets] = useState<CurationMarket[]>([]);
  const [market, setMarket] = useState('');
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  useEffect(() => {
    if (!isAdminStatusPending && !isAdminUser) {
      router.push('/workspace/');
    }
  }, [isAdminUser, isAdminStatusPending, router]);

  useEffect(() => {
    MarketIntelligenceService.getCurationMarkets()
      .then((res) => setMarkets(res.status ? (res.responseData ?? []) : []))
      .catch(() => setMarkets([]))
      .finally(() => setLoadingMarkets(false));
  }, []);

  if (isAdminStatusPending || !isAdminUser) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <Radio className="h-5 w-5 text-primary" /> Listening Curation
            </h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
              Topics, sources, review queue, golden datasets, offline replay and product metrics for the Listening
              Intelligence Platform — shared across every subscribed business, admin-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            <SelectEl value={market} onChange={setMarket} className="min-w-50">
              <option value="">All markets {loadingMarkets ? '(loading…)' : `(${markets.length})`}</option>
              {markets.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label || m.key} {m.subscriber_count ? `· ${m.subscriber_count} subscribers` : ''}
                </option>
              ))}
            </SelectEl>
          </div>
        </div>

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
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {activeTab === 'topics' && <TopicsTab markets={markets} market={market} />}
          {activeTab === 'sources' && <SourcesTab />}
          {activeTab === 'reviews' && <ReviewsTab market={market} />}
          {activeTab === 'golden' && <GoldenTab market={market} />}
          {activeTab === 'replay' && <ReplayTab markets={markets} market={market} />}
          {activeTab === 'metrics' && <MetricsTab markets={markets} market={market} />}
        </div>
      </div>
    </div>
  );
}
