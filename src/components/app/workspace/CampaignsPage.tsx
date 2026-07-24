'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignService, CampaignRow, DraftSummary, LaunchFromMessageResult, WalletInfo, BillingSummary, SavedChatMessage } from '@/src/api/CampaignService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const PINK = '#C2185B';

interface CampaignsPageProps {
  onJane?: () => void;
}

type ChatMsg =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'jane'; kind: 'text'; text: string }
  | { id: string; role: 'jane'; kind: 'result'; result: LaunchFromMessageResult };

interface SelectedMedia {
  source: 'upload' | 'draft';
  url: string;
  isVideo: boolean;
  draftId?: string;
  label: string;
}

const naira = (n?: number | null) => (n == null ? 'N/A' : '₦' + Number(n).toLocaleString());
const uid = () => Math.random().toString(36).slice(2);

// Tappable quick replies (Tier 5b) — pure UI sugar to cut down on typing for the
// two spots where Jane's own conversation flow always lands: picking a starting
// goal, and answering the budget/customer-count question nl.py always asks when
// budget_ngn is missing (the only thing that ever triggers stage === 'need_more').
const GOAL_STARTER_CHIPS = [
  'Get me more WhatsApp messages',
  'Get me more bookings',
  'Get me more sales',
  'Get me more followers',
];

const BUDGET_REPLY_CHIPS = ['₦5,000 budget', '₦10,000 budget', '₦20,000 budget', '20 customers'];

// Surface the backend's real FastAPI HTTPException `detail` (e.g. "Budget is too
// low…", a rate-limit notice) instead of a generic fallback, so the user gets an
// actionable message. The value reaching here can be shaped two ways and we must
// handle both: a raw axios error (`e.response.data.detail`) OR — because
// UriHttpClient's interceptor rejects with `error.response` directly — the already
// unwrapped response (`e.data.detail`). The earlier code only checked the first
// shape, so every jane-ads error (which comes through the interceptor) silently
// fell back to the generic text.
function extractErrorMessage(e: unknown, fallback: string): string {
  const obj = e as { response?: { data?: { detail?: unknown } }; data?: { detail?: unknown } } | null;
  const detail = obj?.response?.data?.detail ?? obj?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/**
 * Campaign section: chat with Jane to create a campaign in plain language, and manage
 * existing campaigns with their reach/conversation metrics. No platform jargon — the
 * user just describes what they want; Jane plans it, makes the creative, and launches
 * it (paused) on their behalf.
 */
// `onJane` in CampaignsPageProps is kept for prop-shape compatibility with the shared
// pattern every workspace page uses (WorkspaceDashboard passes it to all of them) —
// this page no longer shows a back link, so nothing here reads it.
export default function CampaignsPage({}: CampaignsPageProps) {
  const [tab, setTab] = useState<'chat' | 'manage' | 'wallet' | 'billing'>('chat');
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      role: 'jane',
      kind: 'text',
      text:
        "Hi! Tell me what you'd like to promote, and I'll plan and launch a campaign for you. " +
        "I'll write the copy, design the visual, and set it up for you, paused until you say go.",
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [briefSoFar, setBriefSoFar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const loadCampaigns = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await CampaignService.listCampaigns();
      setCampaigns(res.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      setWallet(await CampaignService.getWallet());
    } catch {
      setWallet(null);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'manage') loadCampaigns();
    if (tab === 'wallet') loadWallet();
  }, [tab, loadCampaigns, loadWallet]);

  // Only admins get the Billing tab — the backend decides, so there's no email list
  // duplicated here. Runs once on mount.
  useEffect(() => {
    CampaignService.billingAccess().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  // Restore the saved chat transcript on mount, so a reload or revisit doesn't reset
  // the conversation back to just the greeting. The greeting itself is never saved —
  // it's re-derived fresh each load — so it always shows first, followed by whatever
  // was actually said. A save failing (e.g. offline) is silent: the chat still works
  // for this session, it just won't have persisted.
  useEffect(() => {
    CampaignService.getChatHistory()
      .then((saved) => {
        if (!saved.length) return;
        setMessages((m) => [
          ...m,
          ...saved.map((s: SavedChatMessage): ChatMsg =>
            s.kind === 'result'
              ? { id: s.message_id, role: 'jane', kind: 'result', result: s.result as LaunchFromMessageResult }
              : s.role === 'user'
              ? { id: s.message_id, role: 'user', text: s.text }
              : { id: s.message_id, role: 'jane', kind: 'text', text: s.text }
          ),
        ]);
        // Rebuild briefSoFar exactly the way send() accumulates it: every user turn
        // since the last plan/launch, joined the same way, so a reply after a reload
        // still carries the full brief instead of just that one reply.
        const lastResolvedIdx = saved.map((s) => s.kind === 'result' && (s.result?.stage === 'planned' || s.result?.stage === 'launched')).lastIndexOf(true);
        const sinceResolved = saved.slice(lastResolvedIdx + 1).filter((s) => s.role === 'user');
        if (sinceResolved.length) {
          setBriefSoFar(sinceResolved.map((s) => s.text).join('. '));
        }
      })
      .catch(() => { /* no saved history yet, or couldn't load — start fresh */ });
  }, []);

  // Fire-and-forget save — the chat must keep working locally even if this fails.
  const saveMsg = (msg: ChatMsg) => {
    CampaignService.saveChatMessage(
      msg.role === 'user'
        ? { message_id: msg.id, role: 'user', kind: 'text', text: msg.text }
        : msg.kind === 'result'
        ? { message_id: msg.id, role: 'jane', kind: 'result', result: msg.result }
        : { message_id: msg.id, role: 'jane', kind: 'text', text: msg.text }
    ).catch(() => { /* best-effort */ });
  };

  // Returning from a Squad checkout: the callback lands here with ?reference=<ref>.
  // Verify it (credits the wallet idempotently), tell the user, and jump to the
  // wallet tab so they see the new balance. Runs once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (!reference) return;
    // Strip the ref from the URL so a refresh doesn't re-verify.
    window.history.replaceState({}, document.title, window.location.pathname + '?tab=campaigns');
    (async () => {
      try {
        const res = await CampaignService.verifyTopup(reference);
        if (res.status === 'completed') {
          ToastService.showToast('Wallet topped up successfully.', ToastTypeEnum.Success);
        } else {
          ToastService.showToast("We couldn't confirm that payment. If you were charged, it'll reflect shortly.", ToastTypeEnum.Error);
        }
      } catch {
        ToastService.showToast("We couldn't confirm that payment. If you were charged, it'll reflect shortly.", ToastTypeEnum.Error);
      } finally {
        setTab('wallet');
        loadWallet();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    if (override == null) setInput('');
    const attachedMedia = media;
    // The backend parses each call fresh, with no memory of earlier turns — so a
    // follow-up like "use this draft" (no budget) would otherwise loop forever
    // asking for the same thing. Send the whole brief-so-far each time so Jane
    // has the full picture; it resets once a campaign actually launches.
    const combinedMessage = briefSoFar ? `${briefSoFar}. ${text}` : text;
    const userMsg: ChatMsg = { id: uid(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    saveMsg(userMsg);
    setBusy(true);
    try {
      const result = await CampaignService.planFromMessage({
        message: combinedMessage,
        ...(attachedMedia?.source === 'upload'
          ? { creative_source: 'upload', reference_image_url: attachedMedia.url, is_video: attachedMedia.isVideo }
          : attachedMedia?.source === 'draft'
          ? { creative_source: 'draft', draft_id: attachedMedia.draftId }
          : {}),
      });
      const resultMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'result', result };
      setMessages((m) => [...m, resultMsg]);
      saveMsg(resultMsg);
      if (result.stage === 'planned') {
        // Nothing's been created on Meta yet — that only happens once the user
        // confirms via the plan card's "Looks good" button (ResultCard below).
        setMedia(null);
        setBriefSoFar('');
      } else {
        setBriefSoFar(combinedMessage);
      }
    } catch (e) {
      // Show the backend's message as-is — it's already a full, user-friendly
      // sentence (e.g. the "we're experiencing some difficulties, try again later"
      // shown when the AI is unreachable). No "Sorry," prefix, which read awkwardly
      // in front of a complete sentence.
      const msg = extractErrorMessage(e, "We're experiencing some difficulties — please try again in a little while.");
      const errMsg: ChatMsg = { id: uid(), role: 'jane', kind: 'text', text: msg };
      setMessages((m) => [...m, errMsg]);
      saveMsg(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    setDraftsOpen(false);
    try {
      const { url, is_video } = await CampaignService.uploadMedia(file);
      setMedia({ source: 'upload', url, isVideo: is_video, label: file.name });
    } catch {
      setUploadError('Upload failed, please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openDrafts = async () => {
    setDraftsOpen((v) => !v);
    if (draftsOpen || drafts.length) return;
    setLoadingDrafts(true);
    try {
      const res = await CampaignService.listDrafts();
      setDrafts((res.drafts || []).filter((d) => d.image_url));
    } catch {
      setDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const pickDraft = (d: DraftSummary) => {
    setMedia({ source: 'draft', url: d.image_url, isVideo: false, draftId: d.draft_id, label: d.content || 'Draft' });
    setDraftsOpen(false);
  };

  // Lets a plan-review card (still "planned") turn into a launch confirmation
  // ("launched") in place, once the user confirms and it actually goes live.
  const updateResultMessage = (id: string, result: LaunchFromMessageResult) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id && msg.role === 'jane' && msg.kind === 'result' ? { ...msg, result } : msg)));
    // Same message_id — the backend upserts, so this replaces the saved "planned"
    // row with "launched" in place rather than creating a second saved message.
    saveMsg({ id, role: 'jane', kind: 'result', result });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--wf, Urbanist, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a0a12', margin: 0 }}>Campaigns</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#f4f2f0', padding: 3, borderRadius: 10 }}>
          {([
            ['chat', 'Create with Jane'],
            ['manage', 'My Campaigns'],
            ['wallet', 'Wallet'],
            ...(isAdmin ? [['billing', 'Revenue'] as const] : []),
          ] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px',
                border: 'none',
                borderRadius: 8,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? PINK : '#888',
                fontWeight: tab === t ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' ? (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 16 }}>
                {m.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: 520,
                        padding: '11px 16px',
                        borderRadius: '14px 3px 14px 14px',
                        background: '#1a0a12',
                        color: '#f3d0df',
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : m.kind === 'text' ? (
                  <JaneBubble>{m.text}</JaneBubble>
                ) : (
                  <ResultCard
                    result={m.result}
                    onResultChange={(r) => updateResultMessage(m.id, r)}
                    onLaunched={loadCampaigns}
                    onQuickReply={(text) => send(text)}
                    onTopUp={() => setTab('wallet')}
                  />
                )}
              </div>
            ))}
            {/* Quick-start goal chips — only before the conversation gets going, so a
                new user doesn't have to think of a phrasing from scratch. */}
            {messages.length === 1 && !busy && (
              <QuickReplyChips
                chips={GOAL_STARTER_CHIPS}
                onPick={(text) => setInput((prev) => (prev ? prev : text))}
              />
            )}
            {busy && <JaneBubble><TypingDots /></JaneBubble>}
          </div>
          <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #eee', background: '#fff', position: 'relative' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
              style={{ display: 'none' }}
              onChange={handleFileChosen}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#f6f5f3', border: '1px solid #e0dcd9',
                  borderRadius: 20, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, color: '#555',
                  cursor: busy || uploading ? 'default' : 'pointer',
                }}
              >
                📎 {uploading ? 'Uploading…' : 'Upload photo/video'}
              </button>
              <button
                onClick={openDrafts}
                disabled={busy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#f6f5f3', border: '1px solid #e0dcd9',
                  borderRadius: 20, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, color: '#555',
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                🖼 Choose from drafts
              </button>
              {media && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fce4ec', border: '1px solid #f5c2d8', borderRadius: 20, padding: '4px 6px 4px 4px' }}>
                  {media.isVideo || !media.url ? (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                      {media.isVideo ? '▶' : '🖼'}
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <span style={{ fontSize: 12, color: PINK, fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {media.source === 'draft' ? 'From drafts' : media.label}
                  </span>
                  <button
                    onClick={() => setMedia(null)}
                    style={{ background: 'none', border: 'none', color: PINK, cursor: 'pointer', fontSize: 13, padding: '0 4px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            {uploadError && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c62828' }}>{uploadError}</p>}
            {draftsOpen && (
              <div
                style={{
                  position: 'absolute', bottom: '100%', left: 24, marginBottom: 8, width: 320, maxHeight: 320,
                  overflowY: 'auto', background: '#fff', border: '1px solid #e0dcd9', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 10, padding: 8,
                }}
              >
                {loadingDrafts ? (
                  <p style={{ margin: 8, fontSize: 13, color: '#aaa' }}>Loading…</p>
                ) : drafts.length === 0 ? (
                  <p style={{ margin: 8, fontSize: 13, color: '#aaa' }}>No drafts with an image yet.</p>
                ) : (
                  drafts.map((d) => (
                    <button
                      key={d.draft_id}
                      onClick={() => pickDraft(d)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left',
                        background: 'none', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f6f5f3')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {d.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f4f2f0', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 12.5, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {d.content || d.platform}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Tell Jane what you want to promote…"
                rows={1}
                disabled={busy}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1.5px solid #e0dcd9',
                  borderRadius: 12,
                  padding: '11px 14px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  color: '#111',
                  maxHeight: 120,
                }}
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                style={{
                  padding: '11px 20px',
                  border: 'none',
                  borderRadius: 12,
                  background: busy || !input.trim() ? '#ddd' : `linear-gradient(135deg,${PINK},#8E1545)`,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: busy || !input.trim() ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {busy ? 'Working…' : 'Send'}
              </button>
            </div>
          </div>
        </>
      ) : tab === 'manage' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
              Campaigns Jane has set up for you. Each is paused until you activate it.
            </p>
            <button
              onClick={loadCampaigns}
              style={{ marginLeft: 'auto', background: 'none', border: '1px solid #e0dcd9', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555' }}
            >
              ↻ Refresh
            </button>
          </div>
          {loadingList ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
              <p style={{ fontSize: 14, margin: 0 }}>No campaigns yet.</p>
              <button
                onClick={() => setTab('chat')}
                style={{ marginTop: 12, background: PINK, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Create one with Jane
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.campaign_id} c={c} onChanged={loadCampaigns} />
              ))}
            </div>
          )}
        </div>
      ) : tab === 'wallet' ? (
        <WalletTab wallet={wallet} loading={loadingWallet} onFunded={loadWallet} />
      ) : (
        <BillingTab />
      )}
    </div>
  );
}

function JaneBubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: `linear-gradient(135deg,${PINK},#8E1545)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        J
      </div>
      <div
        style={{
          maxWidth: 560,
          padding: '11px 16px',
          borderRadius: '3px 14px 14px 14px',
          background: '#f6f5f3',
          color: '#333',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function QuickReplyChips({ chips, onPick }: { chips: string[]; onPick: (text: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 40 }}>
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onPick(chip)}
          style={{
            background: '#fff',
            border: `1.5px solid ${PINK}`,
            color: PINK,
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 13 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#aaa',
            animation: 'jane-typing-bounce 1.1s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes jane-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

function ResultCard({
  result,
  onResultChange,
  onLaunched,
  onQuickReply,
  onTopUp,
}: {
  result: LaunchFromMessageResult;
  onResultChange: (result: LaunchFromMessageResult) => void;
  onLaunched: () => void;
  onQuickReply: (text: string) => void;
  onTopUp: () => void;
}) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');

  if (result.stage === 'need_more') {
    // need_more now covers two distinct questions (nl.py asks for business identity
    // FIRST, before ever asking about budget) — the budget/customer-count chips only
    // make sense for the budget question, so gate on what's actually missing instead
    // of assuming. Nothing to suggest for "what would you like to promote?" — that
    // needs free text, not a quick reply.
    const asksForBudget = result.understood?.missing?.includes('budget_ngn');
    return (
      <div>
        <JaneBubble>{result.question || 'Could you tell me a bit more, especially your budget?'}</JaneBubble>
        {asksForBudget && <QuickReplyChips chips={BUDGET_REPLY_CHIPS} onPick={onQuickReply} />}
      </div>
    );
  }
  if (result.stage === 'advise') {
    return <JaneBubble>{result.advice?.reason || "That budget's a little low to run well, want to bump it up?"}</JaneBubble>;
  }

  const confirmLaunch = async () => {
    if (launching || !result.plan_id) return;
    setLaunchError('');
    setLaunching(true);
    try {
      const launched = await CampaignService.launchPlan(result.plan_id);
      onResultChange(launched);
      onLaunched();
    } catch (e) {
      setLaunchError(extractErrorMessage(e, 'Could not launch this campaign, please try again.'));
    } finally {
      setLaunching(false);
    }
  };

  const { plan, creative, launch, wallet } = result;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${PINK},#8E1545)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13,
        }}
      >
        J
      </div>
      <div style={{ maxWidth: 560, flex: 1, border: '1px solid #eee', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
        {creative?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creative.image_url} alt="campaign visual" style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
        )}
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: '#1a0a12' }}>{creative?.headline}</p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555', lineHeight: 1.5 }}>{creative?.primary_text}</p>
          {plan?.explanation && (
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#888', fontStyle: 'italic', lineHeight: 1.5 }}>
              &ldquo;{plan.explanation}&rdquo;
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {plan?.platforms?.map((p, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#fce4ec', color: PINK }}>
                {naira(p.budget_ngn)} · {p.days} days
              </span>
            ))}
            {plan?.geo?.pins?.length ? (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f0eded', color: '#666' }}>
                📍 {plan.geo.pins.map((x) => x.name).join(', ')}
              </span>
            ) : null}
          </div>
          {result.stage === 'planned' ? (
            <div style={{ background: '#fdf8f3', border: '1px solid #f0e3d0', borderRadius: 10, padding: '10px 12px' }}>
              {wallet && (wallet.service_fee_ngn ?? 0) > 0 && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#777' }}>
                  {naira(wallet.budget_ngn)} ad spend + {naira(wallet.service_fee_ngn)} service fee ={' '}
                  <strong>{naira(wallet.total_due_ngn ?? wallet.budget_ngn)}</strong> from your wallet
                </p>
              )}
              {wallet && !wallet.sufficient && (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#a15c00' }}>
                    You&rsquo;ll need {naira(wallet.total_due_ngn ?? wallet.budget_ngn)} in your wallet to run this — you have {naira(wallet.balance_ngn)} now.
                  </p>
                  <button
                    onClick={onTopUp}
                    style={{
                      width: '100%', marginBottom: 8, border: `1.5px solid ${PINK}`, borderRadius: 10,
                      padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      background: '#fff', color: PINK,
                    }}
                  >
                    Top up wallet
                  </button>
                </>
              )}
              <button
                onClick={confirmLaunch}
                disabled={launching}
                style={{
                  width: '100%', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13,
                  cursor: launching ? 'default' : 'pointer',
                  background: launching ? '#eee' : `linear-gradient(135deg,${PINK},#8E1545)`,
                  color: launching ? '#999' : '#fff',
                }}
              >
                {launching ? 'Launching…' : '✓ Looks good — launch it'}
              </button>
              {launchError && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#c62828' }}>{launchError}</p>}
            </div>
          ) : (
            <div style={{ background: '#f6fbf6', border: '1px solid #cde9cd', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: 12.5, color: '#2e7d32', fontWeight: 700 }}>✓ Campaign created, paused, no spend yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{launch?.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function walletTxnLabel(t: { type: string; campaign_id: string }): string {
  switch (t.type) {
    case 'topup':
      return 'Wallet top-up';
    case 'ad_spend':
      return 'Ad spend';
    case 'conversation_charge':
      return 'WhatsApp conversation';
    case 'refund':
      return 'Refund';
    default:
      return 'Adjustment';
  }
}

function fmtTxnDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function WalletTab({ wallet, loading, onFunded }: { wallet: WalletInfo | null; loading: boolean; onFunded: () => void }) {
  const min = wallet?.min_topup_ngn ?? 5000;
  const [amount, setAmount] = useState<number>(min);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');

  const presets = [5000, 10000, 20000, 50000];

  const topUp = async () => {
    if (funding) return;
    if (!amount || amount < min) {
      setError(`Minimum top-up is ${naira(min)}.`);
      return;
    }
    setError('');
    setFunding(true);
    try {
      const { checkout_url } = await CampaignService.fundWallet(amount);
      if (checkout_url) {
        // Hand off to Squad's hosted checkout; on payment it returns to
        // ?tab=campaigns&reference=… which the page verifies on mount.
        window.location.href = checkout_url;
      } else {
        setError('Could not start the payment. Please try again.');
        setFunding(false);
      }
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not start the payment. Please try again.'));
      setFunding(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
          Your prepaid wallet. Campaigns spend from this balance — top up before you launch.
        </p>
        <button
          onClick={onFunded}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid #e0dcd9', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#555' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Balance */}
      <div style={{ background: `linear-gradient(135deg,${PINK},#8E1545)`, borderRadius: 16, padding: '22px 24px', color: '#fff', marginBottom: 20 }}>
        <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, letterSpacing: 0.3 }}>CURRENT BALANCE</div>
        <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          {loading && !wallet ? '…' : naira(wallet?.balance_ngn ?? 0)}
        </div>
      </div>

      {/* Top up */}
      <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 18, marginBottom: 20, background: '#fff' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#1a0a12' }}>Add money</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(p); setError(''); }}
              style={{
                background: amount === p ? PINK : '#fff',
                color: amount === p ? '#fff' : PINK,
                border: `1.5px solid ${PINK}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {naira(p)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, border: '1.5px solid #e0dcd9', borderRadius: 12, padding: '0 12px' }}>
            <span style={{ color: '#888', fontSize: 15, fontWeight: 700 }}>₦</span>
            <input
              type="number"
              min={min}
              value={amount || ''}
              onChange={(e) => { setAmount(Number(e.target.value)); setError(''); }}
              style={{ border: 'none', outline: 'none', padding: '11px 8px', fontSize: 15, width: '100%', color: '#111', fontFamily: 'inherit' }}
            />
          </div>
          <button
            onClick={topUp}
            disabled={funding}
            style={{
              padding: '11px 22px', border: 'none', borderRadius: 12, whiteSpace: 'nowrap',
              background: funding ? '#ddd' : `linear-gradient(135deg,${PINK},#8E1545)`,
              color: '#fff', fontWeight: 800, fontSize: 14, cursor: funding ? 'default' : 'pointer',
            }}
          >
            {funding ? 'Starting…' : 'Top up'}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, color: error ? '#c62828' : '#aaa' }}>
          {error || `Minimum ${naira(min)}. Secured by Squad — you'll be taken to a payment page.`}
        </p>
      </div>

      {/* Ledger */}
      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#1a0a12' }}>Recent activity</p>
      {loading && !wallet ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
      ) : !wallet?.transactions?.length ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>No activity yet. Top up to get started.</p>
      ) : (
        <div style={{ display: 'grid', gap: 1, background: '#eee', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
          {wallet.transactions.map((t) => {
            const credit = t.amount_ngn >= 0;
            return (
              <div key={t.transaction_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{walletTxnLabel(t)}</div>
                  <div style={{ fontSize: 11.5, color: '#aaa' }}>{fmtTxnDate(t.created_at)}</div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: credit ? '#1e7e34' : '#c62828', whiteSpace: 'nowrap' }}>
                  {credit ? '+' : '−'}{naira(Math.abs(t.amount_ngn))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BillingTab() {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await CampaignService.billingSummary(from || undefined, to || undefined));
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not load the billing report.'));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    // load once on mount; re-runs are driven by the Apply button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async () => {
    setDownloading(true);
    try {
      await CampaignService.downloadBillingCsv(from || undefined, to || undefined);
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not download the CSV.'));
    } finally {
      setDownloading(false);
    }
  };

  const t = data?.totals;
  const dateInput: React.CSSProperties = { border: '1.5px solid #e0dcd9', borderRadius: 10, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', color: '#111' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
      <p style={{ margin: '0 0 14px', color: '#888', fontSize: 13 }}>
        What each customer has spent on ads, what we billed them, and our margin. Numbers fill in as campaigns deliver.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 18 }}>
        <label style={{ fontSize: 11.5, color: '#888' }}>
          From<br /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInput} />
        </label>
        <label style={{ fontSize: 11.5, color: '#888' }}>
          To<br /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInput} />
        </label>
        <button
          onClick={load}
          disabled={loading}
          style={{ border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: `linear-gradient(135deg,${PINK},#8E1545)`, color: '#fff' }}
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
        <button
          onClick={download}
          disabled={downloading || !data}
          style={{ border: `1.5px solid ${PINK}`, borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: '#fff', color: PINK, marginLeft: 'auto' }}
        >
          {downloading ? 'Preparing…' : '⤓ Download CSV'}
        </button>
      </div>

      {/* Totals */}
      {t && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <TotalCard label="Customers" value={String(t.users)} />
          <TotalCard label="Real ad spend" value={naira(t.real_spend_ngn)} />
          <TotalCard label="Billed" value={naira(t.billed_ngn)} />
          <TotalCard label="Margin" value={naira(t.margin_ngn)} accent />
        </div>
      )}

      {error && <p style={{ fontSize: 12.5, color: '#c62828' }}>{error}</p>}

      {/* Table */}
      {loading && !data ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>Loading…</p>
      ) : !data?.per_user?.length ? (
        <p style={{ color: '#aaa', fontSize: 13 }}>No ad spend recorded yet for this period.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640, fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#888', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 10px' }}>Customer</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Campaigns</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Real ad spend</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Billed</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.per_user.map((r) => (
                <tr key={r.business_id} style={{ borderBottom: '1px solid #f4f2f0' }}>
                  <td style={{ padding: '9px 10px', color: '#333' }}>{r.label || r.business_id}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#666' }}>{r.campaigns}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>{naira(r.real_spend_ngn)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#333' }}>{naira(r.billed_ngn)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#1e7e34' }}>{naira(r.margin_ngn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TotalCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: '12px 16px', minWidth: 130, background: accent ? '#f6fbf6' : '#fff' }}>
      <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent ? '#1e7e34' : '#1a0a12', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const _STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: '#e6f7ec', color: '#1e7e34' },
  paused: { bg: '#fff3e0', color: '#e65100' },
  'in review': { bg: '#e8f0fe', color: '#1a56db' },
  processing: { bg: '#e8f0fe', color: '#1a56db' },
  scheduled: { bg: '#e8f0fe', color: '#1a56db' },
  'needs changes': { bg: '#fdecea', color: '#c62828' },
  'needs attention': { bg: '#fdecea', color: '#c62828' },
  'needs billing info': { bg: '#fdecea', color: '#c62828' },
  archived: { bg: '#f0eded', color: '#666' },
  deleted: { bg: '#f0eded', color: '#666' },
};

function statusStyle(status: string) {
  return _STATUS_STYLES[status.toLowerCase()] || { bg: '#fff3e0', color: '#e65100' };
}

function formatEnds(endsAt: string | null | undefined) {
  if (!endsAt) return 'Ongoing';
  const d = new Date(endsAt);
  return Number.isNaN(d.getTime()) ? 'Ongoing' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const _TOGGLABLE_STATUSES = new Set(['active', 'paused']);

function CampaignCard({ c, onChanged }: { c: CampaignRow; onChanged: () => void }) {
  const [working, setWorking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const displayStatus = c.metrics?.delivery || c.status;
  const { bg, color } = statusStyle(displayStatus);
  const isActive = displayStatus.toLowerCase() === 'active';
  const canToggle = _TOGGLABLE_STATUSES.has(displayStatus.toLowerCase()) && !!c.campaign_id;
  const canDelete = displayStatus.toLowerCase() !== 'deleted' && !!c.campaign_id;
  const busy = working || deleting;

  const toggle = async () => {
    if (busy) return;
    if (!isActive) {
      const ok = window.confirm(
        `Start running "${c.name}"? It will begin spending its ₦${(c.budget_ngn ?? 0).toLocaleString()} budget.`
      );
      if (!ok) return;
    }
    setError('');
    setWorking(true);
    try {
      await CampaignService.setCampaignStatus(c.campaign_id, !isActive);
      onChanged();
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not update the campaign, please try again.'));
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    const ok = window.confirm(`Delete "${c.name}"? This can't be undone.`);
    if (!ok) return;
    setError('');
    setDeleting(true);
    try {
      await CampaignService.deleteCampaign(c.campaign_id);
      onChanged();
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not delete the campaign, please try again.'));
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 14, border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
      {c.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image_url} alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 84, height: 84, borderRadius: 8, background: '#f4f2f0', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a0a12' }}>{c.name}</p>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: bg, color, textTransform: 'uppercase' }}>
            {displayStatus}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.headline}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, fontSize: 12 }}>
          <Metric label="Budget" value={naira(c.budget_ngn)} />
          <Metric label="Amount spent" value={naira(c.metrics?.spend_ngn)} />
          <Metric label="Views" value={c.metrics?.impressions != null ? c.metrics.impressions.toLocaleString() : 'N/A'} />
          <Metric label="People reached" value={c.metrics?.reach != null ? c.metrics.reach.toLocaleString() : 'N/A'} />
          <Metric label="Conversations" value={c.metrics?.conversations != null ? String(c.metrics.conversations) : 'N/A'} />
          <Metric
            label="Cost per conversation"
            value={c.metrics?.cost_per_conversation_ngn != null ? naira(c.metrics.cost_per_conversation_ngn) : 'N/A'}
          />
          <Metric label="Ends" value={formatEnds(c.metrics?.ends_at)} />
          {c.city && <Metric label="Area" value={c.city} />}
        </div>
        {error && <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#c62828' }}>{error}</p>}
      </div>
      {(canToggle || canDelete) && (
        <div style={{ display: 'flex', gap: 8, alignSelf: 'center', flexShrink: 0 }}>
          {canToggle && (
            <button
              onClick={toggle}
              disabled={busy}
              title={isActive ? 'Pause' : 'Activate'}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                cursor: busy ? 'default' : 'pointer',
                background: working ? '#eee' : isActive ? '#fdecea' : `linear-gradient(135deg,${PINK},#8E1545)`,
                color: working ? '#999' : isActive ? '#c62828' : '#fff',
              }}
            >
              {isActive ? '⏸' : '▶'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={remove}
              disabled={busy}
              title="Delete"
              style={{
                width: 34, height: 34, borderRadius: '50%', border: '1px solid #f0d8dc', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                cursor: busy ? 'default' : 'pointer',
                background: deleting ? '#eee' : '#fff',
                color: deleting ? '#999' : '#c62828',
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#aaa', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: '#333', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
