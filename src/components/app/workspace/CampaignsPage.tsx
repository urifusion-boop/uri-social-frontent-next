'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignService, CampaignRow, DraftSummary, LaunchFromMessageResult } from '@/src/api/CampaignService';

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

/**
 * Campaign section: chat with Jane to create a campaign in plain language, and manage
 * existing campaigns with their reach/conversation metrics. No platform jargon — the
 * user just describes what they want; Jane plans it, makes the creative, and launches
 * it (paused) on their behalf.
 */
export default function CampaignsPage({ onJane }: CampaignsPageProps) {
  const [tab, setTab] = useState<'chat' | 'manage'>('chat');
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

  useEffect(() => {
    if (tab === 'manage') loadCampaigns();
  }, [tab, loadCampaigns]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const attachedMedia = media;
    // The backend parses each call fresh, with no memory of earlier turns — so a
    // follow-up like "use this draft" (no budget) would otherwise loop forever
    // asking for the same thing. Send the whole brief-so-far each time so Jane
    // has the full picture; it resets once a campaign actually launches.
    const combinedMessage = briefSoFar ? `${briefSoFar}. ${text}` : text;
    setMessages((m) => [...m, { id: uid(), role: 'user', text }]);
    setBusy(true);
    try {
      const result = await CampaignService.launchFromMessage({
        message: combinedMessage,
        ...(attachedMedia?.source === 'upload'
          ? { creative_source: 'upload', reference_image_url: attachedMedia.url, is_video: attachedMedia.isVideo }
          : attachedMedia?.source === 'draft'
          ? { creative_source: 'draft', draft_id: attachedMedia.draftId }
          : {}),
      });
      setMessages((m) => [...m, { id: uid(), role: 'jane', kind: 'result', result }]);
      if (result.stage === 'launched') {
        setMedia(null);
        setBriefSoFar('');
        loadCampaigns();
      } else {
        setBriefSoFar(combinedMessage);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setMessages((m) => [...m, { id: uid(), role: 'jane', kind: 'text', text: `Sorry, ${msg}` }]);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--wf, Urbanist, sans-serif)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        {onJane && (
          <button
            onClick={onJane}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}
          >
            ← Jane
          </button>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a0a12', margin: 0 }}>Campaigns</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#f4f2f0', padding: 3, borderRadius: 10 }}>
          {(['chat', 'manage'] as const).map((t) => (
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
              {t === 'chat' ? 'Create with Jane' : 'My Campaigns'}
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
                  <ResultCard result={m.result} />
                )}
              </div>
            ))}
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
                onClick={send}
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
      ) : (
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

function ResultCard({ result }: { result: LaunchFromMessageResult }) {
  if (result.stage === 'need_more') {
    return <JaneBubble>{result.question || 'Could you tell me a bit more, especially your budget?'}</JaneBubble>;
  }
  if (result.stage === 'advise') {
    return <JaneBubble>{result.advice?.reason || "That budget's a little low to run well, want to bump it up?"}</JaneBubble>;
  }
  const { plan, creative, launch } = result;
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
          <div style={{ background: '#f6fbf6', border: '1px solid #cde9cd', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 12.5, color: '#2e7d32', fontWeight: 700 }}>✓ Campaign created, paused, no spend yet</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{launch?.note}</p>
          </div>
        </div>
      </div>
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
    } catch {
      setError('Could not update the campaign, please try again.');
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
    } catch {
      setError('Could not delete the campaign, please try again.');
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
