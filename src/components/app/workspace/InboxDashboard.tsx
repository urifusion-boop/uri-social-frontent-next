'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';

/*
 * Unified Social Inbox — desktop + mobile shell.
 *
 * Queue filtering, view switching, grouping, the drag-and-drop board (desktop
 * only — HTML5 drag events don't fire on touch), replying, assigning, and
 * marking resolved are all real component state. What is NOT yet wired to a
 * backend: none of it persists past a page reload, and nothing is actually
 * sent to Instagram/Facebook/WhatsApp/TikTok — that needs the Unified Inbox
 * API from the PRD's Stage 1/2 rollout. RAW_CONVERSATIONS is placeholder
 * sample data standing in for that API until it exists.
 */

// ─── Icon set (same hand-rolled convention as WorkspaceDashboard/EscalationsPage) ──
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p: Record<string, ReactNode> = {
    home: <path d="M3 12l9-8 9 8M5 11v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8" />,
    inbox: (
      <>
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
    megaphone: <path d="M3 11l14-6v14L3 13v-2zM3 11H2a1 1 0 00-1 1v0a1 1 0 001 1h1M7 18l1 3" />,
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    paperclip: (
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1.5" fill={c} stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill={c} stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill={c} stroke="none" />
      </>
    ),
    bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
    sparkle: (
      <path
        d="M12 2l2.09 6.26L20 10.27l-4.47 3.88L16.18 21 12 17.77 7.82 21l.63-6.85L4 10.27l5.91-1.01z"
        strokeLinejoin="round"
      />
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    chevronLeft: <polyline points="15 18 9 12 15 6" />,
    checkCheck: (
      <>
        <polyline points="17 6 6 17 1 12" />
        <polyline points="23 6 12 17 10 15" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    alertTriangle: (
      <>
        <polygon points="12 3 22 20 2 20" />
        <line x1="12" y1="9" x2="12" y2="14" />
        <circle cx="12" cy="17" r="1" fill={c} stroke="none" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {p[n]}
    </svg>
  );
};

// ─── Types ──────────────────────────────────────────────────────────────────
type ChannelKey = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok';
type QueueKey = 'unassigned' | 'sales' | 'support' | 'complaints' | 'ad' | 'resolved';
type StatusKey = 'unassigned' | 'pending' | 'urgent' | 'resolved';
type ConversationType = 'dm' | 'comment';

interface ThreadMessage {
  from: 'customer' | 'agent';
  text: string;
  time: string;
  by?: string;
}

interface ThreadComment {
  from: string;
  by?: string;
  text: string;
  time: string;
}

interface AiSuggestion {
  text: string;
  confidence: number;
  sources: string[];
}

interface PostContext {
  label: string;
  caption: string;
  campaign: string | null;
  likes: number;
  commentsCount: number;
}

interface Conversation {
  id: string;
  type: ConversationType;
  channel: ChannelKey;
  name: string;
  initials: string;
  avatarColor: string;
  excerpt: string;
  time: string;
  queue: QueueKey;
  status: StatusKey;
  assignee: string | null;
  isComplaint?: boolean;
  sourceLabel?: string;
  messages?: ThreadMessage[];
  post?: PostContext;
  comments?: ThreadComment[];
  aiSuggestion?: AiSuggestion;
}

// ─── Static metadata ────────────────────────────────────────────────────────
const CHANNEL_META: Record<ChannelKey, { letter: string; color: string; label: string }> = {
  instagram: { letter: 'I', color: '#C2185B', label: 'Instagram' },
  facebook: { letter: 'F', color: '#1877F2', label: 'Facebook' },
  whatsapp: { letter: 'W', color: '#25D366', label: 'WhatsApp' },
  tiktok: { letter: 'T', color: '#111111', label: 'TikTok' },
};

const STATUS_META: Record<StatusKey, { label: string; fg: string; bg: string }> = {
  unassigned: { label: 'Unassigned', fg: '#1565C0', bg: 'rgba(33,150,243,.1)' },
  pending: { label: 'Pending', fg: '#B26A00', bg: 'rgba(237,108,2,.1)' },
  urgent: { label: 'Urgent', fg: '#C62828', bg: 'rgba(198,40,40,.1)' },
  resolved: { label: 'Resolved', fg: '#2E7D32', bg: 'rgba(46,125,50,.1)' },
};

const QUEUE_DEFS: { id: 'all' | QueueKey; label: string; count: number }[] = [
  { id: 'all', label: 'All conversations', count: 142 },
  { id: 'unassigned', label: 'Unassigned', count: 18 },
  { id: 'sales', label: 'Sales', count: 34 },
  { id: 'support', label: 'Support', count: 27 },
  { id: 'complaints', label: 'Complaints', count: 9 },
  { id: 'ad', label: 'Ad responses', count: 12 },
  { id: 'resolved', label: 'Resolved', count: 20 },
];

const BOARD_COLUMNS: { id: QueueKey; label: string }[] = [
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'sales', label: 'Sales' },
  { id: 'support', label: 'Support' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'ad', label: 'Ad responses' },
  { id: 'resolved', label: 'Resolved' },
];

const ASSIGNEE_OPTIONS = ['You', 'Ngozi U.', 'Tobi D.'];

// Sidebar nav mirrors WorkspaceDashboard's NAV ids/routes (goTo there resolves
// to /workspace/?tab=<id>) so these links land on the same tabs the main
// sidebar would open.
const SIDEBAR_NAV: { id: string; icon: string; label: string }[] = [
  { id: 'workspace', icon: 'home', label: 'Workspace' },
  { id: 'schedule', icon: 'calendar', label: 'Create Content' },
  { id: 'connections', icon: 'share', label: 'Connected Accounts' },
  { id: 'performance', icon: 'chart', label: 'Performance' },
  { id: 'campaigns', icon: 'megaphone', label: 'Campaigns' },
  { id: 'playbook', icon: 'book', label: 'Brand Playbook' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
  { id: 'billing', icon: 'trending', label: 'Billing' },
];

const MOBILE_TABS: { id: string; icon: string; label: string; tab?: string }[] = [
  { id: 'workspace', icon: 'home', label: 'Jane', tab: 'workspace' },
  { id: 'messages', icon: 'inbox', label: 'Inbox' },
  { id: 'schedule', icon: 'calendar', label: 'Create', tab: 'schedule' },
  { id: 'playbook', icon: 'book', label: 'Playbook', tab: 'playbook' },
  { id: 'more', icon: 'settings', label: 'More', tab: 'settings' },
];

// ─── Placeholder sample data — stands in for the real Unified Inbox API ────
const RAW_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    type: 'dm',
    channel: 'instagram',
    name: 'Chidinma A.',
    initials: 'CA',
    avatarColor: '#AD1457',
    excerpt: 'Hi! Do you have the tan tote in stock?',
    time: '8m',
    queue: 'sales',
    status: 'unassigned',
    assignee: null,
    sourceLabel: 'Reel · "New Arrivals — Tan Collection"',
    messages: [
      { from: 'customer', text: 'Hi! Do you have the tan tote in stock?', time: '9:14 AM' },
      { from: 'customer', text: 'Saw it on your last reel 😍', time: '9:14 AM' },
    ],
    aiSuggestion: {
      text: 'Hi Chidinma! Yes, the Tan Woven Tote is in stock — ₦45,000, ships within 2 business days. Want me to reserve one for you?',
      confidence: 92,
      sources: ['Product Catalog', 'Shipping Policy'],
    },
  },
  {
    id: 'c2',
    type: 'dm',
    channel: 'whatsapp',
    name: 'Tobi O.',
    initials: 'TO',
    avatarColor: '#00897B',
    excerpt: "My order #4482 hasn't arrived yet",
    time: '2h',
    queue: 'complaints',
    status: 'urgent',
    assignee: 'Ngozi U.',
    isComplaint: true,
    messages: [
      { from: 'customer', text: "My order #4482 hasn't arrived yet — it's been 9 days.", time: '11:02 AM' },
      { from: 'customer', text: 'Can someone please check on this?', time: '11:03 AM' },
    ],
  },
  {
    id: 'c3',
    type: 'comment',
    channel: 'facebook',
    name: 'Ifeoma B.',
    initials: 'IB',
    avatarColor: '#1565C0',
    excerpt: 'Is this real leather??',
    time: '24m',
    queue: 'ad',
    status: 'unassigned',
    assignee: null,
    post: {
      label: 'AD',
      caption: 'Summer Drop is here 🌞 Shop the collection — link in bio',
      campaign: 'Summer Sale Retargeting',
      likes: 214,
      commentsCount: 38,
    },
    comments: [{ from: 'Ifeoma B.', text: 'Is this real leather??', time: '24m' }],
    aiSuggestion: {
      text: 'Yes! 100% full-grain leather, hand-finished in our Lagos workshop. 🌿',
      confidence: 87,
      sources: ['Product Catalog'],
    },
  },
  {
    id: 'c4',
    type: 'comment',
    channel: 'tiktok',
    name: 'kemi.wears',
    initials: 'KW',
    avatarColor: '#333333',
    excerpt: 'omg need this in black 😍',
    time: '1h',
    queue: 'sales',
    status: 'unassigned',
    assignee: null,
    post: {
      label: 'VID',
      caption: 'Handstitched totes — behind the scenes',
      campaign: null,
      likes: 1204,
      commentsCount: 96,
    },
    comments: [{ from: 'kemi.wears', text: 'omg need this in black 😍', time: '1h' }],
  },
  {
    id: 'c5',
    type: 'comment',
    channel: 'instagram',
    name: 'Segun A.',
    initials: 'SA',
    avatarColor: '#AD1457',
    excerpt: 'Price?',
    time: '3h',
    queue: 'resolved',
    status: 'resolved',
    assignee: 'Ngozi U.',
    post: {
      label: 'IMG',
      caption: 'The Everyday Crossbody, now in 4 colours',
      campaign: null,
      likes: 340,
      commentsCount: 22,
    },
    comments: [
      { from: 'Segun A.', text: 'Price?', time: '3h' },
      { from: 'agent', by: 'Ngozi U.', text: '₦32,000 — DM sent with the full colour range! 💛', time: '2h' },
    ],
  },
  {
    id: 'c6',
    type: 'dm',
    channel: 'whatsapp',
    name: 'Funmi K.',
    initials: 'FK',
    avatarColor: '#00897B',
    excerpt: 'Can I pick up in Lekki instead of delivery?',
    time: '40m',
    queue: 'support',
    status: 'pending',
    assignee: null,
    messages: [{ from: 'customer', text: 'Can I pick up in Lekki instead of delivery?', time: '10:31 AM' }],
    aiSuggestion: {
      text: 'Yes — pickup is available at our Lekki Phase 1 studio, Mon–Sat, 10am–6pm. Would you like me to hold your order for pickup?',
      confidence: 89,
      sources: ['Store Locations', 'Fulfilment Policy'],
    },
  },
  {
    id: 'c7',
    type: 'dm',
    channel: 'facebook',
    name: 'Uche B.',
    initials: 'UB',
    avatarColor: '#1565C0',
    excerpt: 'Refund please, wrong size sent',
    time: '12m',
    queue: 'complaints',
    status: 'urgent',
    assignee: null,
    isComplaint: true,
    messages: [
      { from: 'customer', text: 'I ordered a medium and got a small. I need a refund please.', time: '11:48 AM' },
    ],
  },
  {
    id: 'c8',
    type: 'dm',
    channel: 'instagram',
    name: 'Praise N.',
    initials: 'PN',
    avatarColor: '#AD1457',
    excerpt: 'Thank you so much, love it!! 💕',
    time: '1d',
    queue: 'resolved',
    status: 'resolved',
    assignee: 'You',
    messages: [
      { from: 'agent', by: 'You', text: 'Your order is on its way — tracking attached! 📦', time: 'Yesterday' },
      { from: 'customer', text: 'Thank you so much, love it!! 💕', time: 'Yesterday' },
    ],
  },
  {
    id: 'c9',
    type: 'dm',
    channel: 'whatsapp',
    name: 'Chidinma A.',
    initials: 'CA',
    avatarColor: '#AD1457',
    excerpt: 'Loved the last order, ordering again!',
    time: '6d',
    queue: 'resolved',
    status: 'resolved',
    assignee: 'You',
    messages: [
      { from: 'customer', text: 'Loved the last order, ordering again!', time: '6d ago' },
      { from: 'agent', by: 'You', text: 'So happy to hear that! Sending you the new colours now 💗', time: '6d ago' },
    ],
  },
];

// ─── Grouping ───────────────────────────────────────────────────────────────
type GroupMode = 'time' | 'platform' | 'customer';

interface ConversationGroup {
  key: string;
  label: string;
  dotColor: string;
  caption: string;
  items: Conversation[];
}

function buildGroups(items: Conversation[], mode: GroupMode): ConversationGroup[] {
  if (mode === 'platform') {
    const order: ChannelKey[] = ['instagram', 'facebook', 'whatsapp', 'tiktok'];
    return order
      .map((ch) => ({
        key: ch,
        label: CHANNEL_META[ch].label,
        dotColor: CHANNEL_META[ch].color,
        caption: '',
        items: items.filter((it) => it.channel === ch),
      }))
      .filter((g) => g.items.length > 0);
  }
  if (mode === 'customer') {
    const order: string[] = [];
    const byName: Record<string, Conversation[]> = {};
    items.forEach((it) => {
      if (!byName[it.name]) {
        byName[it.name] = [];
        order.push(it.name);
      }
      byName[it.name].push(it);
    });
    return order.map((name) => {
      const its = byName[name];
      const uniqueChannels: string[] = [];
      its.forEach((it) => {
        const label = CHANNEL_META[it.channel].label;
        if (!uniqueChannels.includes(label)) uniqueChannels.push(label);
      });
      return {
        key: name,
        label: name,
        dotColor: its[0].avatarColor,
        caption: its.length > 1 ? `Linked across ${uniqueChannels.join(', ')}` : '',
        items: its,
      };
    });
  }
  return [{ key: 'all', label: '', dotColor: '', caption: '', items }];
}

// ─── Small shared style helpers ─────────────────────────────────────────────
const FONT = "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 7,
    border: active ? '1px solid #E91E63' : '1px solid transparent',
    background: active ? '#fff' : 'transparent',
    color: active ? '#AD1457' : '#666',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    whiteSpace: 'nowrap',
  };
}

export default function InboxDashboard() {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<'list' | 'thread'>('list');

  const [selectedQueue, setSelectedQueue] = useState<'all' | QueueKey>('all');
  const [selectedId, setSelectedId] = useState<string>('c1');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [groupBy, setGroupBy] = useState<GroupMode>('time');

  const [cardQueues, setCardQueues] = useState<Record<string, QueueKey>>(() => {
    const map: Record<string, QueueKey> = {};
    RAW_CONVERSATIONS.forEach((c) => {
      map[c.id] = c.queue;
    });
    return map;
  });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusKey>>({});
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string | null>>({});
  const [messageOverrides, setMessageOverrides] = useState<Record<string, ThreadMessage[]>>({});
  const [commentOverrides, setCommentOverrides] = useState<Record<string, ThreadComment[]>>({});
  const [composerDrafts, setComposerDrafts] = useState<Record<string, string>>({});
  const [usedAiSuggestion, setUsedAiSuggestion] = useState<Record<string, boolean>>({});

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<QueueKey | null>(null);
  const [assignMenuOpen, setAssignMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    const ck = () => setIsMobile(window.innerWidth < 768);
    ck();
    window.addEventListener('resize', ck);
    return () => window.removeEventListener('resize', ck);
  }, []);

  // Every conversation with its live overrides folded in — everything below
  // reads from this, never from RAW_CONVERSATIONS directly, so the list, the
  // board and the thread pane can never disagree about a conversation's
  // current state.
  const conversations = useMemo<Conversation[]>(
    () =>
      RAW_CONVERSATIONS.map((c) => ({
        ...c,
        status: statusOverrides[c.id] ?? c.status,
        assignee: c.id in assigneeOverrides ? assigneeOverrides[c.id] : c.assignee,
        messages: c.messages ? [...c.messages, ...(messageOverrides[c.id] || [])] : c.messages,
        comments: c.comments ? [...c.comments, ...(commentOverrides[c.id] || [])] : c.comments,
      })),
    [statusOverrides, assigneeOverrides, messageOverrides, commentOverrides]
  );

  const currentQueueOf = (c: Conversation): QueueKey => cardQueues[c.id] ?? c.queue;

  const filteredConversations = useMemo(
    () => conversations.filter((c) => selectedQueue === 'all' || currentQueueOf(c) === selectedQueue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversations, selectedQueue, cardQueues]
  );

  const groups = useMemo(() => buildGroups(filteredConversations, groupBy), [filteredConversations, groupBy]);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? conversations[0];
  const chSel = CHANNEL_META[selectedConv.channel];
  const stSel = STATUS_META[selectedConv.status];
  const draft = composerDrafts[selectedId] ?? '';

  function moveCard(id: string | null, queueId: QueueKey) {
    if (!id) return;
    setCardQueues((prev) => ({ ...prev, [id]: queueId }));
    setDraggingId(null);
    setDragOverCol(null);
  }

  function openConversation(id: string) {
    setSelectedId(id);
    setView('list');
    if (isMobile) setMobileScreen('thread');
  }

  function goToWorkspaceTab(tabId: string) {
    router.push(`/workspace?tab=${tabId}`);
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text) return;
    if (selectedConv.type === 'dm') {
      setMessageOverrides((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { from: 'agent', by: 'You', text, time: 'Just now' }],
      }));
    } else {
      setCommentOverrides((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { from: 'agent', by: 'You', text, time: 'Just now' }],
      }));
    }
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: '' }));
    if (selectedConv.aiSuggestion) setUsedAiSuggestion((prev) => ({ ...prev, [selectedId]: true }));
  }

  function useAiSuggestionNow() {
    if (!selectedConv.aiSuggestion) return;
    const text = selectedConv.aiSuggestion.text;
    if (selectedConv.type === 'dm') {
      setMessageOverrides((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { from: 'agent', by: 'You', text, time: 'Just now' }],
      }));
    } else {
      setCommentOverrides((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { from: 'agent', by: 'You', text, time: 'Just now' }],
      }));
    }
    setUsedAiSuggestion((prev) => ({ ...prev, [selectedId]: true }));
  }

  function editAiSuggestionIntoComposer() {
    if (!selectedConv.aiSuggestion) return;
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: selectedConv.aiSuggestion!.text }));
  }

  function setAssignee(name: string | null) {
    setAssigneeOverrides((prev) => ({ ...prev, [selectedId]: name }));
    setAssignMenuOpen(false);
  }

  function toggleResolved() {
    if (selectedConv.status === 'resolved') {
      setStatusOverrides((prev) => ({ ...prev, [selectedId]: 'unassigned' }));
      setCardQueues((prev) => ({ ...prev, [selectedId]: 'unassigned' }));
    } else {
      setStatusOverrides((prev) => ({ ...prev, [selectedId]: 'resolved' }));
      setCardQueues((prev) => ({ ...prev, [selectedId]: 'resolved' }));
    }
    setMoreMenuOpen(false);
  }

  // ── Shared thread body (used by both the desktop thread pane and the mobile thread screen) ──
  const threadBody = (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minHeight: 0,
      }}
    >
      {selectedConv.type === 'dm' &&
        (selectedConv.messages || []).map((m, idx) =>
          m.from === 'customer' ? (
            <div key={idx} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '80%',
                  background: 'rgba(0,0,0,.04)',
                  color: '#1a1a1a',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 4px',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {m.text}
                <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{m.time}</div>
              </div>
            </div>
          ) : (
            <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  maxWidth: '80%',
                  background: 'rgba(194,24,91,.08)',
                  color: '#1a1a1a',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {m.text}
                <div style={{ fontSize: 10, color: '#AD1457', marginTop: 4, textAlign: 'right' }}>
                  {m.by} · {m.time}
                </div>
              </div>
            </div>
          )
        )}

      {selectedConv.type === 'comment' && selectedConv.post && (
        <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, padding: 12, background: '#fafafa' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                background: '#e8e8ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                color: '#999',
                flex: '0 0 auto',
              }}
            >
              {selectedConv.post.label}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: '#333', lineHeight: 1.4 }}>{selectedConv.post.caption}</div>
              {selectedConv.post.campaign && (
                <div style={{ fontSize: 11, color: '#AD1457', fontWeight: 700, marginTop: 6 }}>
                  Campaign: {selectedConv.post.campaign}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                {selectedConv.post.likes} likes · {selectedConv.post.commentsCount} comments
              </div>
            </div>
          </div>
          <div
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderTop: '1px solid rgba(0,0,0,.06)',
            }}
          >
            {(selectedConv.comments || []).map((c, idx) =>
              c.from === 'agent' ? (
                <div key={idx} style={{ marginLeft: 20, paddingLeft: 12, borderLeft: '2px solid rgba(194,24,91,.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#AD1457' }}>
                    {c.by} <span style={{ fontWeight: 500, color: '#999', fontSize: 11 }}>· {c.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{c.text}</div>
                </div>
              ) : (
                <div key={idx}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                    {c.from} <span style={{ fontWeight: 500, color: '#999', fontSize: 11 }}>· {c.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginTop: 2 }}>{c.text}</div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {selectedConv.isComplaint && (
        <div
          style={{
            border: '1px solid rgba(198,40,40,.25)',
            background: 'rgba(198,40,40,.05)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <I n="alertTriangle" s={18} c="#C62828" />
          <div style={{ fontSize: 12.5, color: '#8B1E1E', fontWeight: 600, lineHeight: 1.4 }}>
            Possible complaint detected — verify order details before promising a resolution. Never auto-resolve from
            sentiment alone.
          </div>
        </div>
      )}

      {selectedConv.aiSuggestion && !usedAiSuggestion[selectedId] && (
        <div
          style={{
            border: '1.5px dashed #E91E63',
            background: 'rgba(194,24,91,.04)',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                color: '#AD1457',
              }}
            >
              <I n="sparkle" s={13} c="#AD1457" />
              AI Suggested Reply
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#2E7D32',
                background: 'rgba(46,125,50,.1)',
                padding: '2px 8px',
                borderRadius: 10,
              }}
            >
              {selectedConv.aiSuggestion.confidence}% confidence
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 8 }}>
            {selectedConv.aiSuggestion.text}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>
            Grounded in: {selectedConv.aiSuggestion.sources.join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={editAiSuggestionIntoComposer}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.12)',
                background: '#fff',
                fontSize: 12,
                fontWeight: 700,
                color: '#444',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={useAiSuggestionNow}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#AD1457',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <I n="send" s={13} c="#fff" />
              Use &amp; Send
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const threadComposer = (
    <div style={{ flex: '0 0 auto', padding: '14px 20px 18px', borderTop: '1px solid rgba(0,0,0,.08)' }}>
      {selectedConv.type === 'comment' && (
        <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>
          Public reply — visible to everyone on this post
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          background: '#f4f4f5',
          borderRadius: 12,
          padding: '10px 12px',
        }}
      >
        <button
          type="button"
          aria-label="Attach file"
          title="Coming soon"
          style={{
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            flex: '0 0 auto',
          }}
        >
          <I n="paperclip" s={16} />
        </button>
        <textarea
          aria-label="Reply message"
          placeholder="Write a reply..."
          rows={1}
          value={draft}
          onChange={(e) => setComposerDrafts((prev) => ({ ...prev, [selectedId]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendDraft();
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            resize: 'none',
            fontSize: 13,
            fontFamily: FONT,
            color: '#1a1a1a',
            padding: '6px 0',
          }}
        />
        <button
          type="button"
          onClick={sendDraft}
          disabled={!draft.trim()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 8,
            background: draft.trim() ? '#AD1457' : '#d9a9bc',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: draft.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT,
            flex: '0 0 auto',
          }}
        >
          <I n="send" s={14} c="#fff" />
          Send
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: '#999' }}>
        <I n="checkCheck" s={12} c="#2E7D32" />
        Delivery status shown instantly · read receipts where the channel supports them
      </div>
    </div>
  );

  function threadHeader(showBack: boolean) {
    return (
      <div
        style={{
          height: 64,
          flex: '0 0 64px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(0,0,0,.08)',
          boxSizing: 'border-box',
        }}
      >
        {showBack && (
          <button
            type="button"
            aria-label="Back to conversations"
            onClick={() => setMobileScreen('list')}
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              color: '#444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            <I n="chevronLeft" s={20} />
          </button>
        )}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: selectedConv.avatarColor,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          {selectedConv.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{selectedConv.name}</div>
          <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: chSel.color }} />
            {chSel.label}
          </div>
        </div>
        {!isMobile && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 12,
              background: stSel.bg,
              color: stSel.fg,
              whiteSpace: 'nowrap',
            }}
          >
            {stSel.label}
          </span>
        )}

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setAssignMenuOpen((o) => !o);
              setMoreMenuOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid rgba(0,0,0,.1)',
              background: '#fff',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#444',
              cursor: 'pointer',
              fontFamily: FONT,
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? selectedConv.assignee || 'Unassigned' : `Assigned: ${selectedConv.assignee || 'Unassigned'}`}
            <I n="chevronDown" s={12} />
          </button>
          {assignMenuOpen && (
            <>
              <div onClick={() => setAssignMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 999,
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                  border: '1px solid rgba(0,0,0,.06)',
                  minWidth: 160,
                  padding: 6,
                }}
              >
                {ASSIGNEE_OPTIONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setAssignee(name)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      border: 'none',
                      background: selectedConv.assignee === name ? 'rgba(194,24,91,.08)' : 'transparent',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    {name}
                    {selectedConv.assignee === name && <I n="check" s={13} c="#AD1457" />}
                  </button>
                ))}
                <div style={{ height: 1, background: 'rgba(0,0,0,.06)', margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => setAssignee(null)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#999',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Unassign
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="More options"
            onClick={() => {
              setMoreMenuOpen((o) => !o);
              setAssignMenuOpen(false);
            }}
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              borderRadius: 8,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <I n="more" s={16} />
          </button>
          {moreMenuOpen && (
            <>
              <div onClick={() => setMoreMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 999,
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                  border: '1px solid rgba(0,0,0,.06)',
                  minWidth: 180,
                  padding: 6,
                }}
              >
                <button
                  type="button"
                  onClick={toggleResolved}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#333',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <I n="check" s={14} c={selectedConv.status === 'resolved' ? '#999' : '#2E7D32'} />
                  {selectedConv.status === 'resolved' ? 'Reopen conversation' : 'Mark resolved'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const sourceStrip = selectedConv.sourceLabel && (
    <div
      style={{
        padding: '8px 20px',
        background: 'rgba(194,24,91,.05)',
        borderBottom: '1px solid rgba(194,24,91,.1)',
        fontSize: 12,
        color: '#AD1457',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <I n="paperclip" s={13} />
      Sourced from {selectedConv.sourceLabel}
    </div>
  );

  // ── Shared: queue pills (used in desktop sidebar + mobile chip row) ──
  const queuePills = QUEUE_DEFS.map((q) => ({ ...q, active: selectedQueue === q.id }));

  // ═══════════════════════════════════════════════════════════════════════
  // MOBILE
  // ═══════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          background: '#fafafa',
          color: '#1a1a1a',
          overflow: 'hidden',
        }}
      >
        {mobileScreen === 'list' ? (
          <>
            <div
              style={{
                flex: '0 0 56px',
                height: 56,
                background: '#fff',
                borderBottom: '1px solid rgba(0,0,0,.08)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 8,
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                aria-label="Back to Workspace"
                onClick={() => router.push('/workspace')}
                style={{
                  width: 40,
                  height: 40,
                  border: 'none',
                  background: 'transparent',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <I n="chevronLeft" s={22} />
              </button>
              <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Inbox</div>
              <button
                type="button"
                aria-label="Notifications"
                style={{
                  width: 40,
                  height: 40,
                  border: 'none',
                  background: 'transparent',
                  color: '#444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                }}
              >
                <I n="bell" s={19} />
              </button>
            </div>

            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                gap: 8,
                padding: '10px 12px',
                overflowX: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {queuePills.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQueue(q.id)}
                  style={{
                    flex: '0 0 auto',
                    ...pillStyle(q.active),
                    border: q.active ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                    background: q.active ? 'rgba(194,24,91,.1)' : '#fff',
                  }}
                >
                  {q.label} {q.count}
                </button>
              ))}
            </div>

            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                gap: 8,
                padding: '0 12px 10px',
                overflowX: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {(
                [
                  ['time', 'Time'],
                  ['platform', 'Platform'],
                  ['customer', 'Customer'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGroupBy(id)}
                  style={{
                    flex: '0 0 auto',
                    ...pillStyle(groupBy === id),
                    background: groupBy === id ? '#fff' : 'transparent',
                    border: groupBy === id ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 12px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 0,
              }}
            >
              {groups.map((grp) => (
                <div key={grp.key}>
                  {grp.label && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 4px 4px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: grp.dotColor }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#666',
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                          }}
                        >
                          {grp.label}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#aaa' }}>({grp.items.length})</span>
                      </div>
                      {grp.caption && (
                        <div style={{ fontSize: 10.5, color: '#AD1457', padding: '0 4px 6px' }}>{grp.caption}</div>
                      )}
                    </>
                  )}
                  {grp.items.map((item) => {
                    const ch = CHANNEL_META[item.channel];
                    const st = STATUS_META[item.status];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openConversation(item.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          gap: 12,
                          padding: 14,
                          minHeight: 76,
                          boxSizing: 'border-box',
                          border: 'none',
                          background: '#fff',
                          borderRadius: 14,
                          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
                          cursor: 'pointer',
                          fontFamily: FONT,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ position: 'relative', flex: '0 0 auto' }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: item.avatarColor,
                              color: '#fff',
                              fontSize: 14,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {item.initials}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: ch.color,
                              border: '2px solid #fff',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {ch.letter}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#1a1a1a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#999', flex: '0 0 auto' }}>{item.time}</span>
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: '#777',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: 3,
                            }}
                          >
                            {item.excerpt}
                          </div>
                          <div style={{ marginTop: 7 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 10,
                                background: st.bg,
                                color: st.fg,
                              }}
                            >
                              {st.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div
              style={{
                flex: '0 0 64px',
                height: 64,
                background: '#fff',
                borderTop: '1px solid rgba(0,0,0,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                boxSizing: 'border-box',
              }}
            >
              {MOBILE_TABS.map((t) => {
                const active = t.id === 'messages';
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-label={t.label}
                    onClick={() => {
                      if (t.tab) router.push(`/workspace?tab=${t.tab}`);
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      border: 'none',
                      background: 'transparent',
                      color: active ? '#AD1457' : '#999',
                      fontSize: 10,
                      fontWeight: active ? 800 : 600,
                      fontFamily: FONT,
                      cursor: 'pointer',
                    }}
                  >
                    <I n={t.icon} s={20} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {threadHeader(true)}
            {sourceStrip}
            {threadBody}
            {threadComposer}
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DESKTOP
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        fontFamily: FONT,
        background: '#fafafa',
        color: '#1a1a1a',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar (visually identical to WorkspaceDashboard's, "Customer Messages" active) */}
      <div
        style={{
          width: 224,
          flexShrink: 0,
          background: '#1a0a12',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 0',
          height: '100vh',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '0 18px',
            marginBottom: 26,
            textDecoration: 'none',
          }}
        >
          <img
            src="/images/urilogo-nobg.png"
            alt="URI Social"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
          <span
            style={{
              color: '#fff',
              fontWeight: 300,
              fontSize: 15,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              letterSpacing: '0.5px',
            }}
          >
            social
          </span>
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 18px',
              background: 'rgba(194,24,91,.1)',
              border: 'none',
              borderLeft: '2.5px solid #E91E63',
              fontFamily: FONT,
              fontSize: 12.5,
              color: '#fce4ec',
              fontWeight: 600,
              cursor: 'default',
              textAlign: 'left',
            }}
          >
            <I n="inbox" s={15} c="#E91E63" />
            <span style={{ flex: 1 }}>Customer Messages</span>
          </button>

          {SIDEBAR_NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goToWorkspaceTab(n.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 18px',
                background: 'transparent',
                border: 'none',
                borderLeft: '2.5px solid transparent',
                fontFamily: FONT,
                fontSize: 12.5,
                color: 'rgba(255,255,255,.35)',
                fontWeight: 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .12s',
              }}
            >
              <I n={n.icon} s={15} c="rgba(255,255,255,.22)" />
              <span style={{ flex: 1 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inbox shell */}
      <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* top bar */}
        <div
          style={{
            height: 60,
            flex: '0 0 60px',
            background: '#fff',
            borderBottom: '1px solid rgba(0,0,0,.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <span>Workspace</span>
            <span>›</span>
            <span style={{ color: '#1a1a1a', fontWeight: 700 }}>Customer Messages</span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#f4f4f5',
              borderRadius: 8,
              padding: '8px 12px',
              gap: 8,
              maxWidth: 420,
            }}
          >
            <I n="search" s={16} c="#999" />
            <input
              aria-label="Search conversations, customers, or keywords"
              placeholder="Search conversations, customers, or keywords"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                flex: 1,
                fontFamily: FONT,
                color: '#333',
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#2E7D32',
              background: 'rgba(46,125,50,.08)',
              padding: '6px 10px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E7D32' }} />
            All channels connected
          </div>

          <button
            type="button"
            aria-label="Notifications"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              borderRadius: 8,
              color: '#555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <I n="bell" s={18} />
          </button>
        </div>

        {/* toolbar: view switch + group by */}
        <div
          style={{
            height: 48,
            flex: '0 0 48px',
            background: '#fff',
            borderBottom: '1px solid rgba(0,0,0,.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f4f4f5',
              borderRadius: 9,
              padding: 3,
              gap: 2,
            }}
          >
            {(['list', 'board'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} style={pillStyle(view === v)}>
                {v === 'list' ? 'List' : 'Board'}
              </button>
            ))}
          </div>

          {view === 'list' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                }}
              >
                Group by
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f4f4f5',
                  borderRadius: 9,
                  padding: 3,
                  gap: 2,
                }}
              >
                {(
                  [
                    ['time', 'Time'],
                    ['platform', 'Platform'],
                    ['customer', 'Customer'],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setGroupBy(id)} style={pillStyle(groupBy === id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#999' }}>Drag a card between columns to re-triage it</div>
          )}
        </div>

        {view === 'list' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
            {/* queue nav */}
            <div
              style={{
                width: 220,
                flex: '0 0 220px',
                background: '#fff',
                borderRight: '1px solid rgba(0,0,0,.08)',
                padding: '20px 12px',
                boxSizing: 'border-box',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: '#999',
                  padding: '0 8px 10px',
                }}
              >
                Queues
              </div>
              {queuePills.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQueue(q.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 10px',
                    marginBottom: 2,
                    border: 'none',
                    borderLeft: q.active ? '3px solid #E91E63' : '3px solid transparent',
                    background: q.active ? 'rgba(194,24,91,.1)' : 'transparent',
                    color: q.active ? '#AD1457' : '#444',
                    fontWeight: q.active ? 700 : 500,
                    fontSize: 13,
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <span>{q.label}</span>
                  <span style={{ fontSize: 11, color: '#999', fontWeight: 700 }}>{q.count}</span>
                </button>
              ))}

              <div style={{ height: 1, background: 'rgba(0,0,0,.08)', margin: '16px 8px' }} />

              <button
                type="button"
                title="Coming soon"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#aaa',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: 'default',
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <I n="share" s={16} c="#bbb" />
                Connections
              </button>
              <button
                type="button"
                title="Coming soon"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#aaa',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: 'default',
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <I n="chart" s={16} c="#bbb" />
                Insights
              </button>
            </div>

            {/* conversation list */}
            <div
              style={{
                width: 380,
                flex: '0 0 380px',
                background: '#fafafa',
                borderRight: '1px solid rgba(0,0,0,.08)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: '14px 16px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
                  {filteredConversations.length} conversations
                </div>
                <button
                  type="button"
                  aria-label="Filter conversations"
                  title="Coming soon"
                  style={{
                    width: 28,
                    height: 28,
                    border: '1px solid rgba(0,0,0,.1)',
                    background: '#fff',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    cursor: 'default',
                  }}
                >
                  <I n="filter" s={14} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                {groups.map((grp) => (
                  <div key={grp.key}>
                    {grp.label && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 8px 4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: grp.dotColor }} />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#666',
                              textTransform: 'uppercase',
                              letterSpacing: '.04em',
                            }}
                          >
                            {grp.label}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#aaa' }}>({grp.items.length})</span>
                        </div>
                        {grp.caption && (
                          <div style={{ fontSize: 10.5, color: '#AD1457', padding: '0 8px 6px' }}>{grp.caption}</div>
                        )}
                      </>
                    )}
                    {grp.items.map((item) => {
                      const ch = CHANNEL_META[item.channel];
                      const st = STATUS_META[item.status];
                      const selected = selectedId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openConversation(item.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            display: 'flex',
                            gap: 10,
                            padding: 12,
                            marginBottom: 6,
                            border: 'none',
                            borderLeft: selected ? '3px solid #E91E63' : '3px solid transparent',
                            background: selected ? 'rgba(194,24,91,.06)' : '#fff',
                            borderRadius: '0 10px 10px 0',
                            cursor: 'pointer',
                            fontFamily: FONT,
                          }}
                        >
                          <div style={{ position: 'relative', flex: '0 0 auto' }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: item.avatarColor,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {item.initials}
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: ch.color,
                                border: '2px solid #fafafa',
                                color: '#fff',
                                fontSize: 8,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {ch.letter}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#1a1a1a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.name}
                              </span>
                              <span style={{ fontSize: 11, color: '#999', flex: '0 0 auto' }}>{item.time}</span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#777',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: 2,
                              }}
                            >
                              {item.excerpt}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: 10,
                                  background: st.bg,
                                  color: st.fg,
                                }}
                              >
                                {st.label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* thread pane */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
                background: '#fff',
              }}
            >
              {threadHeader(false)}
              {sourceStrip}
              {threadBody}
              {threadComposer}
            </div>
          </div>
        ) : (
          // ── BOARD VIEW (desktop only) ──
          <div
            style={{
              flex: 1,
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '16px 20px',
              display: 'flex',
              gap: 14,
              minHeight: 0,
              boxSizing: 'border-box',
            }}
          >
            {BOARD_COLUMNS.map((col) => {
              const isOver = dragOverCol === col.id;
              const items = conversations.filter((c) => currentQueueOf(c) === col.id);
              return (
                <div
                  key={col.id}
                  data-queue-column={col.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDragOverCol(col.id)}
                  onDragLeave={() => setDragOverCol((prev) => (prev === col.id ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    moveCard(draggingId, col.id);
                  }}
                  style={{
                    flex: '0 0 250px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isOver ? 'rgba(194,24,91,.06)' : '#fafafa',
                    border: isOver ? '2px dashed #E91E63' : '1px solid rgba(0,0,0,.08)',
                    borderRadius: 12,
                    minHeight: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: '0 0 auto',
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#333' }}>{col.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#999',
                        background: 'rgba(0,0,0,.05)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '0 10px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      minHeight: 40,
                    }}
                  >
                    {items.map((c) => {
                      const ch = CHANNEL_META[c.channel];
                      return (
                        <button
                          key={c.id}
                          type="button"
                          draggable
                          data-card-id={c.id}
                          onDragStart={() => setDraggingId(c.id)}
                          onDragEnd={() => setDraggingId(null)}
                          onClick={() => openConversation(c.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'grab',
                            border: '1px solid rgba(0,0,0,.08)',
                            background: '#fff',
                            borderRadius: 10,
                            padding: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            fontFamily: FONT,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: c.avatarColor,
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: '0 0 auto',
                              }}
                            >
                              {c.initials}
                            </div>
                            <span
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: '#1a1a1a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {c.name}
                            </span>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: ch.color,
                                color: '#fff',
                                fontSize: 7,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: '0 0 auto',
                                marginLeft: 'auto',
                              }}
                            >
                              {ch.letter}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#777', lineHeight: 1.4 }}>{c.excerpt}</div>
                          <div style={{ fontSize: 10, color: '#aaa' }}>{c.time} ago</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
