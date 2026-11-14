/**
 * "Overview" — Campaign Manager's dashboard. Was a direct reuse of the chat
 * page's HomePanel (DASH-PRD-01 §4); redesigned as its own component because
 * HomePanel is still shared with that page (being retired, not yet gone) and
 * because this surface now has more to show than HomePanel ever did — the
 * wizard's own autosaved drafts (wizardDraft.ts) are a real part of "what's
 * happening across your campaigns" that HomePanel has no concept of.
 *
 * Keeps DASH-PRD-01's real substance — lead with people messaged, never print
 * a zero we can't stand behind (null means "can't count", not "nobody"),
 * empty states show an action not a zero — in a layout that actually uses the
 * page's width: a stat row up top, then live campaigns and in-progress drafts
 * side by side instead of a single column of near-identical cards.
 */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileEdit, Megaphone, MessageCircle, Sparkles, Wallet as WalletIcon } from 'lucide-react';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { CampaignService, type DashboardHome } from '@/src/api/CampaignService';
import { draftHasPlan, draftIsVideo, draftThumbnail, platformLabel } from './CampaignBuilderPage';
import {
  deleteWizardDraft,
  fetchRemoteWizardDrafts,
  loadWizardDrafts,
  pruneLaunchedDrafts,
  mergeWizardDrafts,
  WizardDraft,
} from './wizardDraft';

const PINK = '#C2185B';
const AMBER = '#a15c00';

const naira = (n: number | null | undefined) => (typeof n === 'number' ? `₦${Math.round(n).toLocaleString()}` : '—');

function sinceLabel(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function daysLeft(endsAt: string | null): string {
  if (!endsAt) return '';
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'ending today';
  return days === 1 ? '1 day left' : `${days} days left`;
}

function StatTile({
  icon: Icon,
  tint,
  fg,
  label,
  value,
  onClick,
}: {
  icon: typeof Megaphone;
  tint: string;
  fg: string;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        border: '1px solid #ece8e6',
        borderRadius: 16,
        padding: '14px 16px',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        flex: '1 1 180px',
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: tint,
          color: fg,
          flexShrink: 0,
        }}
      >
        <Icon size={17} strokeWidth={2} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{ fontSize: 10.5, fontWeight: 700, color: '#9a9090', textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {label}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1a0a12', marginTop: 1 }}>{value}</div>
      </div>
    </Tag>
  );
}

function ProgressBar({ spent, budget }: { spent: number | null; budget: number | null }) {
  if (typeof spent !== 'number' || typeof budget !== 'number' || budget <= 0) return null;
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  return (
    <div style={{ height: 6, background: '#ece8e6', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: PINK }} />
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece8e6',
  borderRadius: 16,
  padding: '16px 18px',
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#9a9090',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  marginBottom: 10,
};
const primaryBtn: React.CSSProperties = {
  background: PINK,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};
const smallBtn: React.CSSProperties = {
  background: '#fff',
  color: PINK,
  border: `1.5px solid ${PINK}`,
  borderRadius: 9,
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

function PageShell({ children, isMobile }: { children: React.ReactNode; isMobile: boolean }) {
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: isMobile ? '14px 12px 28px' : '18px 20px 28px' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a0a12' }}>Overview</h2>
        <p style={{ margin: '2px 0 16px', fontSize: 12.5, color: '#7a7270' }}>
          What&rsquo;s happening across your campaigns, at a glance.
        </p>
        {children}
      </div>
    </div>
  );
}

export default function CampaignOverviewPage({
  onNavigate,
  onResumeDraft,
  onOpenCampaign,
}: {
  onNavigate: (id: string) => void;
  /** Open this campaign on the Campaigns page (scrolled to and highlighted there),
   *  where all its actions live. Falls back to just opening Campaigns. */
  onOpenCampaign?: (campaignId: string) => void;
  /** Lands straight back in the wizard on this exact draft — live-reported:
   *  without this, Resume here only opened the Campaign Builder's list, making
   *  the user click Resume a second time once they got there. */
  onResumeDraft: (draft: WizardDraft) => void;
}) {
  const [data, setData] = useState<DashboardHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<WizardDraft[]>([]);
  // Discard straight from "Unfinished" — asks once first, since a discarded draft is gone.
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);
  const discardDraft = (id: string) => {
    deleteWizardDraft(id);
    setDrafts((current) => current.filter((d) => d.id !== id));
    setConfirmDiscard(null);
  };
  const isMobile = useIsMobile();
  // Pause / Resume straight from "Running now". A paused campaign drops out of this
  // list on the next load, so its new state is kept here until then (with Resume).
  const [rowStatus, setRowStatus] = useState<Record<string, 'active' | 'paused'>>({});
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [confirmResume, setConfirmResume] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const setLive = async (campaignId: string, active: boolean) => {
    setRowBusy(campaignId);
    setRowError((e) => ({ ...e, [campaignId]: '' }));
    try {
      await CampaignService.setCampaignStatus(campaignId, active);
      setRowStatus((m) => ({ ...m, [campaignId]: active ? 'active' : 'paused' }));
      setConfirmResume(null);
    } catch {
      setRowError((e) => ({
        ...e,
        [campaignId]: active ? "Couldn't resume it. Try again shortly." : "Couldn't pause it. Try again shortly.",
      }));
    } finally {
      setRowBusy(null);
    }
  };

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await CampaignService.getDashboardHome());
    } catch {
      setError("Couldn't load your dashboard. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Drop drafts whose plans already launched (a launch that finished after the page
  // stopped waiting never cleared its draft). Each draft is checked once per visit.
  const draftsChecked = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = drafts.filter((d) => !draftsChecked.current.has(d.id));
    if (!fresh.length) return;
    fresh.forEach((d) => draftsChecked.current.add(d.id));
    void pruneLaunchedDrafts(fresh).then((gone) => {
      if (gone.length) setDrafts((current) => current.filter((d) => !gone.includes(d.id)));
    });
  }, [drafts]);

  useEffect(() => {
    void load();
    const local = loadWizardDrafts();
    setDrafts(local);
    void fetchRemoteWizardDrafts().then((remote) => {
      if (remote.length) setDrafts((current) => mergeWizardDrafts(current, remote));
    });
  }, [load]);

  const goToCampaigns = () => onNavigate('campaign-wizard');
  const goToWallet = () => onNavigate('campaign-wallet');

  if (loading) {
    return (
      <PageShell isMobile={isMobile}>
        <div style={{ color: '#9a9090', fontSize: 13 }}>Loading…</div>
      </PageShell>
    );
  }
  if (error) {
    return (
      <PageShell isMobile={isMobile}>
        <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 10 }}>{error}</div>
        <button type="button" onClick={() => void load()} style={primaryBtn}>
          Try again
        </button>
      </PageShell>
    );
  }
  if (!data) return null;

  const { since_you_last_looked: delta, live_campaigns: live, money, suggestions, is_first_run } = data;

  // A first-time client with a draft already in progress has a more specific
  // next step than the generic "let's get started" CTA — resuming it.
  if (is_first_run && drafts.length === 0) {
    return (
      <PageShell isMobile={isMobile}>
        <div style={{ ...card, maxWidth: 560 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#1a0a12' }}>
            Let&rsquo;s get your first campaign running
          </h3>
          <p style={{ fontSize: 12.5, color: '#7a7270', margin: '4px 0 14px', lineHeight: 1.55 }}>
            Tell Jane what you want to promote. She writes the copy, designs the visual and sets it up — you approve
            before anything goes live.
          </p>
          <button type="button" onClick={goToCampaigns} style={primaryBtn}>
            Start a campaign
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell isMobile={isMobile}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stat row — the four things this page is actually for, at a glance. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <StatTile
            icon={Megaphone}
            tint="#FDE7EF"
            fg={PINK}
            label="Live campaigns"
            value={String(live.length)}
            onClick={goToCampaigns}
          />
          <StatTile
            icon={FileEdit}
            tint="#EEE7FB"
            fg="#6D3FC2"
            label="Unfinished drafts"
            value={String(drafts.length)}
            onClick={drafts.length > 0 ? goToCampaigns : undefined}
          />
          <StatTile
            icon={WalletIcon}
            tint={money.low ? '#FFF7E6' : '#E6F0FD'}
            fg={money.low ? AMBER : '#2563C2'}
            label="Ad wallet"
            value={naira(money.wallet_ngn)}
            onClick={goToWallet}
          />
          <StatTile
            icon={MessageCircle}
            tint="#ECFDF5"
            fg="#15803d"
            label={delta.people_messaged !== null ? `Since ${sinceLabel(delta.since) || 'last visit'}` : 'Messages'}
            value={delta.people_messaged !== null ? String(delta.people_messaged) : "Can't count yet"}
          />
        </div>

        {suggestions.length > 0 && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...sectionLabel, marginBottom: 12 }}>
              <Sparkles size={13} strokeWidth={2} /> Jane suggests
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suggestions.map((s) => (
                <div
                  key={`${s.kind}-${s.campaign_id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a0a12' }}>{s.text}</div>
                    {s.detail && (
                      <div style={{ fontSize: 11.5, color: '#7a7270', marginTop: 2, lineHeight: 1.5 }}>{s.detail}</div>
                    )}
                  </div>
                  <button type="button" onClick={() => onNavigate(s.action)} style={smallBtn}>
                    {s.action_label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              !isMobile && live.length > 0 && drafts.length > 0 ? 'minmax(0,1.5fr) minmax(0,1fr)' : '1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={card}>
            <div style={sectionLabel}>Running now</div>
            {live.length === 0 ? (
              <div>
                <p style={{ fontSize: 12.5, color: '#7a7270', margin: '0 0 12px' }}>Nothing running at the moment.</p>
                <button type="button" onClick={goToCampaigns} style={primaryBtn}>
                  + New Campaign
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {live.map((c) => {
                  const paused = rowStatus[c.campaign_id] === 'paused';
                  const busy = rowBusy === c.campaign_id;
                  const stop = (e: React.MouseEvent) => e.stopPropagation();
                  return (
                    <div
                      key={c.campaign_id}
                      role="button"
                      tabIndex={0}
                      title="Open this campaign"
                      onClick={() => (onOpenCampaign ? onOpenCampaign(c.campaign_id) : goToCampaigns())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onOpenCampaign ? onOpenCampaign(c.campaign_id) : goToCampaigns();
                      }}
                      style={{ display: 'flex', gap: 10, cursor: 'pointer', borderRadius: 10, padding: 4, margin: -4 }}
                    >
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{ width: 44, height: 44, borderRadius: 10, background: '#f6f3f2', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a0a12', flex: 1, minWidth: 0 }}>
                            {c.name}
                            {paused && (
                              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: AMBER }}>Paused</span>
                            )}
                          </div>
                          {confirmResume === c.campaign_id ? (
                            <span onClick={stop} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11.5, color: '#7a7270' }}>Start spending again?</span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={(e) => {
                                  stop(e);
                                  void setLive(c.campaign_id, true);
                                }}
                                style={{ ...smallBtn, padding: '4px 10px', opacity: busy ? 0.6 : 1 }}
                              >
                                {busy ? 'Resuming…' : 'Yes, resume'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  stop(e);
                                  setConfirmResume(null);
                                }}
                                style={{ ...smallBtn, padding: '4px 10px', color: '#7a7270', borderColor: '#e5e1df' }}
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={(e) => {
                                stop(e);
                                if (paused) setConfirmResume(c.campaign_id);
                                else void setLive(c.campaign_id, false);
                              }}
                              style={{ ...smallBtn, padding: '4px 12px', opacity: busy ? 0.6 : 1 }}
                            >
                              {busy ? (paused ? 'Resuming…' : 'Pausing…') : paused ? 'Resume' : 'Pause'}
                            </button>
                          )}
                        </div>
                        {rowError[c.campaign_id] && (
                          <div style={{ fontSize: 11.5, color: '#c62828', marginTop: 2 }}>
                            {rowError[c.campaign_id]}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#7a7270', marginTop: 2 }}>
                          {naira(c.spent_ngn)} of {naira(c.budget_ngn)} spent
                          {c.ends_at ? ` · ${daysLeft(c.ends_at)}` : ''}
                        </div>
                        {c.people_messaged !== null && (
                          <div style={{ fontSize: 12, color: '#15803d', marginTop: 2, fontWeight: 600 }}>
                            {c.people_messaged} {c.people_messaged === 1 ? 'person messaged' : 'people messaged'}
                          </div>
                        )}
                        <ProgressBar spent={c.spent_ngn} budget={c.budget_ngn} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {drafts.length > 0 && (
            <div style={card}>
              <div style={sectionLabel}>Unfinished</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {drafts.map((d) => {
                  const thumb = draftThumbnail(d);
                  return (
                    <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: '#FCE7F3',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 17,
                          }}
                          aria-hidden
                        >
                          {draftIsVideo(d) ? '🎬' : '📣'}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a0a12' }}>
                          {d.objective.label || d.objective.value} on {platformLabel(d)}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#7a7270' }}>
                          {draftHasPlan(d) ? 'Ad already built' : 'Still filling in'}
                        </div>
                      </div>
                      {confirmDiscard === d.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11.5, color: '#7a7270' }}>Discard?</span>
                          <button
                            type="button"
                            onClick={() => discardDraft(d.id)}
                            style={{ ...smallBtn, background: PINK, color: '#fff' }}
                          >
                            Yes
                          </button>
                          <button type="button" onClick={() => setConfirmDiscard(null)} style={smallBtn}>
                            Keep
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDiscard(d.id)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#7a7270',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '8px 4px',
                            }}
                          >
                            Discard
                          </button>
                          <button type="button" onClick={() => onResumeDraft(d)} style={smallBtn}>
                            Resume
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
