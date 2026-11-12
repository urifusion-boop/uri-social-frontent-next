'use client';

/**
 * Market opportunities from Listening Intelligence: what's rising, emerging or
 * repeatedly asked in this business's market, why it matters to them, and a
 * ready action. Every number shown comes from measured data (the backend
 * builds the observation sentence). A post/carousel/FAQ card's "Create this"
 * generates the draft server-side in one click (POST /listening/cards/{id}/
 * create) and lands on Create where it's already waiting. A video card has
 * no equivalent single call (storyboard -> frames -> render is a genuine
 * multi-step, user-reviewed flow) — "Start this video" hands the brief to
 * Describe It pre-filled instead. An ad_test card opens a fresh, pre-filled
 * Jane Ads draft thread (same one call, same server) — never auto-launched;
 * the owner still drives it through Jane Ads like any other campaign.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bookmark,
  CalendarClock,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  Radar,
  RefreshCw,
  Sparkles,
  Target,
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
  ListeningRun,
  ListeningSignalType,
  ListeningStatus,
  MarketIntelligenceService,
  MarketPulse,
} from '@/src/api/MarketIntelligenceService';
import { setAdTestSeed, setVideoSeed } from '@/src/utils/contentSeed';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  whatsapp_status: 'WhatsApp',
};

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
  competitor_move: {
    label: 'Competitor move',
    icon: Target,
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  objection_shift: {
    label: 'Doubts are rising',
    icon: AlertTriangle,
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  upcoming_development: {
    label: 'Coming up',
    icon: CalendarClock,
    className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
};

const errMsg = (err: unknown, fallback: string): string => {
  const detail =
    (err as { data?: { detail?: string } })?.data?.detail ??
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return typeof detail === 'string' && detail ? detail : fallback;
};

// PRD §9.1's relevance breakdown / §10's "why am I seeing this... score
// components" — only the genuinely-variable pieces are worth a business
// owner's attention. ontology_match/geography_fit/exclusions_clear are
// structural 100s on every card today (see personalize.py's
// _relevance_components), so showing them would just be noise; this only
// speaks up when semantic similarity or language fit actually differ from
// a perfect match, or when past feedback nudged the score down.
const relevanceNote = (card: ListeningCard): string | null => {
  const rc = card.evidence.relevance_components;
  const parts: string[] = [];
  if (rc?.semantic_similarity != null) {
    parts.push(`topic similarity ${Math.round(rc.semantic_similarity)}%`);
  }
  if (rc?.language_fit != null && rc.language_fit < 100) {
    parts.push(`language fit ${Math.round(rc.language_fit)}%`);
  }
  if ((card.evidence.learned_adjustment ?? 0) < 0) {
    parts.push('adjusted down slightly based on your past feedback on similar signals');
  }
  return parts.length > 0 ? parts.join(' · ') : null;
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
  connectedPlatforms,
}: {
  card: ListeningCard;
  onAct: (c: ListeningCard, a: ListeningCardAction) => void;
  onCreated: (c: ListeningCard) => void;
  connectedPlatforms: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const meta = TYPE_META[card.type] ?? TYPE_META.emerging;
  const Icon = meta.icon;
  // post/carousel/faq route through the server-side content generator
  // (one real click, drafts land in Create). video has no equivalent
  // single call — it's a genuine multi-step, user-reviewed flow (storyboard
  // -> frames -> render) — so its honest "one click" is handing the brief
  // to Describe It pre-filled, not pretending a finished video exists.
  // ad_test opens a real, pre-filled Jane Ads draft thread server-side —
  // never auto-launched, same approval gate every other campaign goes
  // through — so it's a normal click like post/carousel/faq, just routed
  // to Campaigns instead of Create once the thread comes back.
  const isVideo = card.action.type === 'video';
  const isAdTest = card.action.type === 'ad_test';
  // Video hands off to a separate, user-driven screen (no server call here
  // to send an override to) and ad_test has no platform concept of its own
  // (Jane Ads drives that conversationally) — editable platform/format only
  // makes sense for the post/carousel/faq cards that actually call /create.
  const showEditableTargeting = !isVideo && !isAdTest;

  // Live-reported bug: every card suggested Instagram only, with no way to
  // change it — even on an account with Facebook/TikTok/LinkedIn all
  // connected, because the AI defaults to Instagram whenever the Playbook
  // states no platform preference. The AI's pick is a starting point here,
  // pre-selected but always editable — never the only option.
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(card.action.platforms ?? []);
  const [selectedType, setSelectedType] = useState<'post' | 'carousel'>(
    card.action.type === 'carousel' ? 'carousel' : 'post'
  );
  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };
  // Connected accounts include ad accounts (facebook_ads, google_ads) —
  // real connections, but not something content can be "posted" to, so
  // they're left out of this picker rather than offered as a postable
  // platform that would fail once the owner actually clicked Create.
  const postablePlatforms = connectedPlatforms.filter((p) => p in PLATFORM_LABELS);

  const createVideo = () => {
    const parts = [card.action.hook, ...(card.action.outline ?? []), card.action.cta].filter(Boolean);
    setVideoSeed({
      brief: parts.join('. ') || card.why || card.observation,
      source: 'listening',
      cardId: card.id,
    });
    onAct(card, 'acted');
    router.push('/workspace/?tab=schedule');
  };

  const create = async () => {
    if (creating) return;
    if (isVideo) {
      createVideo();
      return;
    }
    if (selectedPlatforms.length === 0) {
      ToastService.showToast('Pick at least one platform to post to.', ToastTypeEnum.Error);
      return;
    }
    setCreating(true);
    try {
      const res = await MarketIntelligenceService.createFromListeningCard(card.id, {
        platforms: selectedPlatforms,
        content_type: selectedType,
      });
      if (res.status && res.responseData) {
        if (isAdTest && 'thread' in res.responseData) {
          setAdTestSeed({
            threadId: res.responseData.thread.thread_id,
            seedMessage: res.responseData.seed_message,
            source: 'listening',
            cardId: card.id,
          });
          ToastService.showToast('Ad draft started — opening it in Campaigns now.', ToastTypeEnum.Success);
          onCreated(card);
          router.push('/workspace/?tab=campaigns');
        } else {
          ToastService.showToast('Draft created — opening it in Create now.', ToastTypeEnum.Success);
          onCreated(card);
          router.push('/workspace/?tab=schedule');
        }
      } else {
        ToastService.showToast(res.responseMessage || 'Could not create a draft from this', ToastTypeEnum.Error);
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // Already created from this card on an earlier click — not an error,
        // just route to where it already landed (the ad-test thread already
        // exists too, just not reachable from here without its id — the
        // owner finds it in the Campaigns rail).
        onCreated(card);
        router.push(isAdTest ? '/workspace/?tab=campaigns' : '/workspace/?tab=schedule');
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
          {showEditableTargeting ? (
            <div className="mb-2 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">Post on:</span>
                {postablePlatforms.length === 0 ? (
                  <span className="text-muted-foreground">
                    {(card.action.platforms ?? []).join(', ')} (connect an account to change this)
                  </span>
                ) : (
                  postablePlatforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11.5px] font-medium transition-colors',
                        selectedPlatforms.includes(p)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {PLATFORM_LABELS[p] ?? p}
                    </button>
                  ))
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">Format:</span>
                {(['post', 'carousel'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11.5px] font-medium capitalize transition-colors',
                      selectedType === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t}
                  </button>
                ))}
                <span className="text-[11px] text-muted-foreground">({card.action.format})</span>
              </div>
            </div>
          ) : (
            <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              <span>
                <b className="text-foreground">Format:</b> {card.action.format}
              </span>
              <span>
                <b className="text-foreground">Post on:</b> {(card.action.platforms ?? []).join(', ')}
              </span>
            </div>
          )}
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
              {card.alternative && (
                <div className="rounded-md border border-dashed border-border bg-background p-2">
                  <div className="mb-0.5 font-semibold text-foreground">Or instead: {card.alternative.title}</div>
                  <div className="text-muted-foreground">
                    {card.alternative.format} on {(card.alternative.platforms ?? []).join(', ')} —{' '}
                    {card.alternative.hook}
                  </div>
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
                Source: {card.evidence.source}. {card.evidence.scope_note}
              </div>
              <div
                className="text-[11px] text-muted-foreground"
                title="Each is scored 0-100. Relevance: matches what you sell. Momentum: how fast this is picking up right now. Buying intent: how close to ready-to-buy the language sounds. Evidence: how much real activity backs this up. Brand fit: how well it fits your brand voice/positioning."
              >
                Relevance {Math.round(card.scores.R)}/100 · momentum {Math.round(card.scores.M)}/100 · buying intent{' '}
                {Math.round(card.scores.C)}/100 · evidence {Math.round(card.scores.E)}/100 · brand fit{' '}
                {Math.round(card.scores.B)}/100
              </div>
              {relevanceNote(card) && (
                <div className="text-[11px] text-muted-foreground">
                  <b className="text-foreground">Why this matched you:</b> {relevanceNote(card)}
                </div>
              )}
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

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {creating ? 'Creating…' : isVideo ? 'Start this video' : isAdTest ? 'Draft this ad test' : 'Create this'}
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

// A real, live strip of what's actually happening during a collection run —
// every entry here traces to collector.py's own per_query writes (each
// query flips from "pending" to "done" the moment it genuinely finishes),
// never a client-side simulated percentage. Kept deliberately slim: a
// progress count plus the few most recently finished searches, not a wall
// of every query.
function ActiveRunStrip({ runItem, marketLabel }: { runItem: ListeningRun; marketLabel?: string }) {
  const queries = runItem.per_query || [];
  const done = queries.filter((q) => q.status === 'done');
  const total = queries.length;
  const recentlyDone = done.slice(-4);

  return (
    <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11.5px]">
      <div className="flex flex-wrap items-center gap-2">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
        <span className="font-medium text-foreground">Collecting from {marketLabel ?? runItem.market}</span>
        <span className="text-muted-foreground">
          — {done.length} of {total || '…'} searches done
        </span>
      </div>
      {recentlyDone.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-5">
          {recentlyDone.map((q, i) => (
            <span
              key={`${q.id ?? i}`}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px]',
                q.error
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              )}
            >
              {q.error ? '!' : '✓'} {q.kind} {q.items != null ? `(${q.items})` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Plain language for a business owner, not the internal lifecycle names
// (observed/candidate/monitored) curators use in the admin console. paused/
// retired are deliberately left out here — they're housekeeping states
// ("stopped getting enough real activity"), not something an owner needs
// to parse; the admin curation console still shows the full picture.
const TOPIC_STATUS_LABEL: Record<string, string> = {
  monitored: 'Actively tracked',
  candidate: 'Coming up repeatedly',
  observed: 'New mentions',
};
const TOPIC_STATUS_ORDER = ['monitored', 'candidate', 'observed'];

// Answers "178 topics, but I can't see any of it" directly, in words a
// business owner — not an engineer — actually understands: the real status
// breakdown of the topic graph (already computed by GET /listening/status,
// just never shown before) plus real measured activity from GET
// /listening/pulse — topics with actual conversation in the last week, how
// many distinct accounts, and what they actually want. Nothing here is
// invented; a topic below the bar for a full opportunity card is still
// real, measured activity, now shown as such instead of vanishing into an
// opaque count the system's own internal vocabulary made harder to read,
// not easier.
function WatchingPanel({
  status,
  pulse,
  loading,
}: {
  status: ListeningStatus | null;
  pulse: MarketPulse[] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-[12px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading what Uri is watching…
      </div>
    );
  }

  const pulseByMarket = new Map((pulse ?? []).map((p) => [p.market, p]));

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-3">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">How this works: </span>
        Uri reads real public conversations in your market. A word or phrase becomes a topic the moment someone says it
        — most start and stay small. The more different accounts keep bringing up the same thing, the more closely Uri
        tracks it. Only once something is well-established does it turn into an opportunity below; everything here is
        what&apos;s building toward that, in plain sight.
      </p>
      {(status?.markets ?? []).map((m) => {
        const ts = m.topic_statuses || {};
        const p = pulseByMarket.get(m.key);
        return (
          <div key={m.key} className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-foreground">{m.label ?? m.key}</span>
              {TOPIC_STATUS_ORDER.filter((s) => (ts[s] || 0) > 0).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {ts[s]} {TOPIC_STATUS_LABEL[s]}
                </span>
              ))}
            </div>
            {!p || p.topics.length === 0 ? (
              <p className="pl-0.5 text-[11.5px] text-muted-foreground">
                Nothing in this market has had enough recent real activity to show yet — the topics above are still
                being watched.
              </p>
            ) : (
              <div className="space-y-1">
                {p.topics.slice(0, 10).map((t) => (
                  <div key={t.topic} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px]">
                    <span className="font-medium text-foreground">{t.topic}</span>
                    <span className="text-muted-foreground">
                      {t.accounts} account{t.accounts === 1 ? '' : 's'} mentioned this in the last week
                    </span>
                    {t.needs.length > 0 && (
                      <span className="text-muted-foreground">— mainly asking about {t.needs.join(', ')}</span>
                    )}
                  </div>
                ))}
                <p className="pt-1 text-[10.5px] text-muted-foreground">
                  This is background, not an alert — nothing here gets sent to you until it clears the same bar a full
                  opportunity needs.
                </p>
              </div>
            )}
          </div>
        );
      })}
      {(status?.markets ?? []).length === 0 && <p className="text-[12px] text-muted-foreground">No markets yet.</p>}
    </div>
  );
}

export default function ListeningOpportunities() {
  const [status, setStatus] = useState<ListeningStatus | null>(null);
  const [cards, setCards] = useState<ListeningCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'enable' | 'run' | null>(null);
  const [activeRuns, setActiveRuns] = useState<ListeningRun[]>([]);
  const [watchingOpen, setWatchingOpen] = useState(false);
  const [pulse, setPulse] = useState<MarketPulse[] | null>(null);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    SocialMediaAgentService.getConnections()
      .then((res) => {
        if (res.status) setConnectedPlatforms(res.responseData?.connected_platforms ?? []);
      })
      .catch(() => {
        /* editable platform picker just falls back to the card's own suggestion */
      });
  }, []);

  const toggleWatching = async () => {
    const opening = !watchingOpen;
    setWatchingOpen(opening);
    if (opening && pulse === null) {
      setPulseLoading(true);
      try {
        const res = await MarketIntelligenceService.getMarketPulse(7);
        setPulse(res.status ? (res.responseData ?? []) : []);
      } catch {
        setPulse([]);
      } finally {
        setPulseLoading(false);
      }
    }
  };

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

  // Real collection progress, not a simulated percentage — polls the actual
  // run doc (GET /listening/run/active), which collector.py updates query
  // by query as each one genuinely finishes. Fast (4s) while something is
  // actually running; slow (30s) otherwise, in case the scheduled cycle —
  // not this tab's own "Check now" — starts one while the page is open, per
  // "you can leave this page and return later."
  const wasActiveRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      let runs: ListeningRun[] = [];
      try {
        const res = await MarketIntelligenceService.getActiveListeningRuns();
        runs = res.status ? (res.responseData ?? []) : [];
      } catch {
        /* transient — next tick retries */
      }
      if (cancelled) return;
      setActiveRuns(runs);
      if (runs.length > 0) {
        wasActiveRef.current = true;
        pollTimerRef.current = setTimeout(tick, 4000);
      } else {
        if (wasActiveRef.current) {
          wasActiveRef.current = false;
          load(); // a run that was active just finished — pull in whatever it found
        }
        pollTimerRef.current = setTimeout(tick, 30000);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [load]);

  // Jump straight to a fast poll tick instead of waiting up to 30s for the
  // slow background one to notice the run this exact click just started.
  const pollSoon = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(async () => {
      const res = await MarketIntelligenceService.getActiveListeningRuns().catch(() => null);
      const runs = res?.status ? (res.responseData ?? []) : [];
      setActiveRuns(runs);
      if (runs.length > 0) wasActiveRef.current = true;
    }, 1500);
  };

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
      ToastService.showToast('Checking your market now — see progress below.', ToastTypeEnum.Success);
      pollSoon(); // the strip below picks up real progress; load() fires on its own once the run completes
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
        {(status?.markets ?? []).map((m) => {
          const ts = m.topic_statuses || {};
          const interesting = (ts.candidate || 0) + (ts.monitored || 0);
          return (
            <span key={m.key}>
              {m.label ?? m.key} · checked {ago(m.last_collected_at)} · {m.topics} topics
              {interesting > 0 ? ` (${interesting} worth watching)` : ''}
            </span>
          );
        })}
        <button
          type="button"
          onClick={toggleWatching}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', watchingOpen && 'rotate-180')} />
          {watchingOpen ? 'Hide' : 'What is Uri watching?'}
        </button>
        <Button variant="ghost" size="xs" className="ml-auto" onClick={runNow} disabled={busy === 'run'}>
          {busy === 'run' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Check now
        </Button>
      </div>

      {watchingOpen && <WatchingPanel status={status} pulse={pulse} loading={pulseLoading} />}

      {activeRuns.map((r) => (
        <ActiveRunStrip key={r.id} runItem={r} marketLabel={status?.markets.find((m) => m.key === r.market)?.label} />
      ))}

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
            <OpportunityCard
              key={c.id}
              card={c}
              onAct={act}
              onCreated={markCreated}
              connectedPlatforms={connectedPlatforms}
            />
          ))}
        </div>
      )}
    </div>
  );
}
