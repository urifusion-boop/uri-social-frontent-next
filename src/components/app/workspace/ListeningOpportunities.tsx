'use client';

/**
 * Market opportunities from Listening Intelligence: what's rising, emerging or
 * repeatedly asked in this business's market, why it matters to them, and a
 * ready action. Every number shown comes from measured data (the backend
 * builds the observation sentence); "Create this" generates the draft
 * server-side in one click (POST /listening/cards/{id}/create) and lands on
 * the Create tab where it's already waiting — no re-typing, no second
 * "press Generate" step.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  Radar,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ListeningCard,
  ListeningCardAction,
  ListeningSignalType,
  ListeningStatus,
  MarketIntelligenceService,
} from '@/src/api/MarketIntelligenceService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const TYPE_META: Record<ListeningSignalType, { label: string; icon: LucideIcon; className: string }> = {
  rising: { label: 'Rising', icon: TrendingUp, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  spike: { label: 'Spike today', icon: Zap, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  emerging: { label: 'Emerging signal', icon: Sparkles, className: 'bg-sky-50 text-sky-700 border-sky-200' },
  new_entity: {
    label: 'New in your market',
    icon: Flame,
    className: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  },
  recurring_need: {
    label: 'Customers keep asking',
    icon: HelpCircle,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
  },
};

const errMsg = (err: unknown, fallback: string): string => {
  const detail =
    (err as { data?: { detail?: string } })?.data?.detail ??
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === 'string' && detail ? detail : fallback;
};

const ago = (iso?: string | null): string => {
  if (!iso) return 'not yet';
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)} days ago`;
};

function OpportunityCard({
  card,
  onAct,
  onCreated,
}: {
  card: ListeningCard;
  onAct: (c: ListeningCard, a: ListeningCardAction) => void;
  onCreated: (c: ListeningCard) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const meta = TYPE_META[card.type] ?? TYPE_META.emerging;
  const Icon = meta.icon;
  // Only post/carousel/faq route through the content generator today —
  // video and ad_test need their own generators that don't exist here yet.
  // Say so up front rather than let the owner click "Create this" on a
  // video-labelled card and quietly get a text draft instead.
  const unsupportedAction = card.action.type === 'video' ? 'video' : card.action.type === 'ad_test' ? 'ad_test' : null;

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await MarketIntelligenceService.createFromListeningCard(card.id);
      if (res.status && res.responseData) {
        ToastService.showToast('Draft created — opening it in Create now.', ToastTypeEnum.Success);
        onCreated(card);
        router.push('/workspace/?tab=schedule');
      } else {
        ToastService.showToast(res.responseMessage || 'Could not create a draft from this', ToastTypeEnum.Error);
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // Already created from this card on an earlier click — not an error,
        // just route to where it already landed.
        onCreated(card);
        router.push('/workspace/?tab=schedule');
      } else {
        ToastService.showToast(errMsg(err, 'Could not create a draft from this'), ToastTypeEnum.Error);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
              meta.className
            )}
          >
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          <Badge variant="outline" className="text-[11px] font-medium">
            {card.topic_name || card.topic}
          </Badge>
          <span
            className="ml-auto text-[11px] text-muted-foreground"
            title="Opportunity score (relevance, momentum, buying intent, evidence, brand fit)"
          >
            Score {Math.round(card.scores.total)}
          </span>
        </div>

        <div className="text-[15px] font-semibold leading-snug text-foreground">{card.action.title}</div>
        <p className="text-[13px] leading-relaxed text-foreground/90">{card.observation}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{card.why}</p>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12.5px]">
          <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <span>
              <b className="text-foreground">Format:</b> {card.action.format}
            </span>
            <span>
              <b className="text-foreground">Post on:</b> {(card.action.platforms ?? []).join(', ')}
            </span>
          </div>
          <div>
            <b>Hook:</b> {card.action.hook}
          </div>
          {open && (
            <div className="mt-2 space-y-2">
              {card.action.outline?.length > 0 && (
                <ol className="list-decimal space-y-0.5 pl-5">
                  {card.action.outline.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ol>
              )}
              <div>
                <b>Call to action:</b> {card.action.cta}
              </div>
              {card.action.caption && (
                <div className="whitespace-pre-wrap">
                  <b>Caption idea:</b> {card.action.caption}
                </div>
              )}
              {(card.evidence.samples ?? []).length > 0 && (
                <div>
                  <div className="mb-1 font-semibold">What people are saying</div>
                  <ul className="space-y-1.5">
                    {(card.evidence.samples ?? []).slice(0, 4).map((s, i) => (
                      <li key={i} className="rounded-md bg-background p-2 text-muted-foreground">
                        “{s.text}”{' '}
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary"
                          >
                            view <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground">
                Source: {card.evidence.source}. {card.evidence.scope_note} Relevance {Math.round(card.scores.R)} ·
                momentum {Math.round(card.scores.M)} · buying intent {Math.round(card.scores.C)} · evidence{' '}
                {Math.round(card.scores.E)} · brand fit {Math.round(card.scores.B)}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-primary"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
            {open ? 'Less' : 'Full brief and evidence'}
          </button>
        </div>

        {unsupportedAction && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-[11.5px] text-muted-foreground">
            {unsupportedAction === 'video'
              ? "One-click video creation from Listening isn't available yet — use the brief above in Create Video."
              : "One-click ad tests from Listening aren't available yet — use the brief above in Campaigns."}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={create} disabled={creating || !!unsupportedAction}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {creating ? 'Creating…' : unsupportedAction ? 'Create this (unavailable)' : 'Create this'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAct(card, 'saved')} disabled={creating}>
            <Bookmark className="h-3.5 w-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAct(card, 'snoozed')} disabled={creating}>
            <Clock className="h-3.5 w-3.5" /> Later
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => onAct(card, 'dismissed')}
            disabled={creating}
          >
            <X className="h-3.5 w-3.5" /> Not relevant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ListeningOpportunities() {
  const [status, setStatus] = useState<ListeningStatus | null>(null);
  const [cards, setCards] = useState<ListeningCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'enable' | 'run' | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        MarketIntelligenceService.getListeningStatus(),
        MarketIntelligenceService.listListeningCards(),
      ]);
      if (s.status) setStatus(s.responseData ?? null);
      if (c.status) setCards(c.responseData ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const enable = async () => {
    setBusy('enable');
    try {
      const res = await MarketIntelligenceService.enableListening();
      if (!res.status) {
        ToastService.showToast(res.responseMessage || 'Could not turn on listening', ToastTypeEnum.Error);
        return;
      }
      await MarketIntelligenceService.runListeningNow().catch(() => undefined);
      ToastService.showToast(
        'Listening is on. Uri is reading your market — first findings arrive shortly.',
        ToastTypeEnum.Success
      );
      await load();
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not turn on listening'), ToastTypeEnum.Error);
    } finally {
      setBusy(null);
    }
  };

  const runNow = async () => {
    setBusy('run');
    try {
      await MarketIntelligenceService.runListeningNow();
      ToastService.showToast(
        'Checking your market now — new opportunities appear here in a few minutes.',
        ToastTypeEnum.Success
      );
      setTimeout(load, 90_000);
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not start a check'), ToastTypeEnum.Warning);
    } finally {
      setBusy(null);
    }
  };

  const act = async (card: ListeningCard, action: ListeningCardAction) => {
    setCards((cs) =>
      action === 'saved'
        ? cs.map((c) => (c.id === card.id ? { ...c, status: 'saved' } : c))
        : cs.filter((c) => c.id !== card.id)
    );
    try {
      await MarketIntelligenceService.actOnListeningCard(card.id, action);
      if (action === 'dismissed')
        ToastService.showToast('Got it — Uri will show you less like this.', ToastTypeEnum.Success);
      if (action === 'saved') ToastService.showToast('Saved.', ToastTypeEnum.Success);
    } catch (err) {
      ToastService.showToast(errMsg(err, 'Could not update'), ToastTypeEnum.Error);
      load();
    }
  };

  // The create-draft call already recorded the action and advanced the
  // card's status server-side — this just mirrors that locally so the card
  // leaves the list without a second round-trip through the generic
  // /action endpoint (which would double-log the same action).
  const markCreated = (card: ListeningCard) => {
    setCards((cs) => cs.filter((c) => c.id !== card.id));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your market opportunities…
      </div>
    );
  }

  const listening = status?.profile?.status === 'active';

  if (!listening) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-6">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <Radar className="h-4 w-4 text-primary" /> Let Uri listen to your market
          </div>
          <p className="max-w-2xl text-[13px] text-muted-foreground">
            Uri reads public conversations in your market every few hours, spots what is rising and what customers keep
            asking, and turns it into ready content ideas for your business. It uses your Brand Playbook — nothing to
            set up.
          </p>
          <Button size="sm" onClick={enable} disabled={busy === 'enable'}>
            {busy === 'enable' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
            Start listening
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Listening
        </span>
        {(status?.markets ?? []).map((m) => (
          <span key={m.key}>
            {m.label ?? m.key} · checked {ago(m.last_collected_at)} · {m.topics} topics
          </span>
        ))}
        <Button variant="ghost" size="xs" className="ml-auto" onClick={runNow} disabled={busy === 'run'}>
          {busy === 'run' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Check now
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-[13px] text-muted-foreground">
            No strong opportunities yet. Uri checks your market every {status?.cadence_hours ?? 12} hours and only shows
            something when there is enough real evidence — trends need a few days of history before they can be called
            trends.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {cards.map((c) => (
            <OpportunityCard key={c.id} card={c} onAct={act} onCreated={markCreated} />
          ))}
        </div>
      )}
    </div>
  );
}
