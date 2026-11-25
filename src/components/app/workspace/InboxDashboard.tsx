'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  InboxService,
  InboxAgentView,
  InboxConversationDTO,
  InboxMessageDTO,
  type DeskChange,
  type DeskNote,
} from '@/src/api/InboxService';
import { INITIAL_CHANNEL_CONNECTIONS, channelsFromApi, type ChannelConnection } from './InboxConnectionsPage';
import { InboxPersonalityPage } from './personality/InboxPersonalityPage';
import { useNotifications } from '@/src/providers/NotificationProvider';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { GrowthService } from '@/src/api/GrowthService';
import { WhatsAppTemplatePicker } from './WhatsAppTemplates';
import type { Notification } from '@/src/api/NotificationService';
import EmptyState from '@/src/components/app/atoms/EmptyState';
import MessagingHeader, { MSG_BG, QUICK_REPLIES_ENABLED, type MessagingSection } from './messaging/MessagingHeader';
import SettingsPage, { type SettingsSection } from './messaging/SettingsPage';
import AutomationsPage from './messaging/AutomationsPage';
import QuickRepliesPage, { replyWithButtons } from './messaging/QuickRepliesPage';
import AudiencePage from './messaging/AudiencePage';
import InsightsPage from './messaging/InsightsPage';
import { NavRow } from './messaging/ui';
import { PlatformBadge, PLATFORM_LABEL } from './messaging/platform';
import { tagLook } from './messaging/SettingsPage';
import {
  Check,
  ChevronDown,
  Filter,
  List,
  ListFilter,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelRight,
  Star,
  User,
  X,
} from 'lucide-react';
import type { TeamMember } from '@/src/api/InboxService';

/*
 * Unified Social Inbox — a tab inside WorkspaceDashboard (PAGES.messages),
 * not a standalone route: it renders inside the dashboard's existing
 * sidebar/mobile-tab-bar shell, the same way every other tab (Campaigns,
 * Billing, Playbook, ...) does, so it never triggers a separate page load
 * or an auth re-check. isMobile is passed down from WorkspaceDashboard's
 * own breakpoint rather than detected locally, for the same reason.
 *
 * Queue filtering, view switching, grouping, the drag-and-drop board (desktop
 * only — HTML5 drag events don't fire on touch) and marking resolved are
 * component state.
 *
 * Conversations, messages and replying are REAL: they come from the Unified
 * Inbox API and a reply goes to Instagram or Facebook. Delivery reflects what
 * the provider actually said and is never advanced on a timer. Queues, tags,
 * notes and leads are still local-only and do not persist past a reload.
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
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41 12 22 2 12V2h10z" />
        <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
    note: (
      <>
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
        <polyline points="14 3 14 9 20 9" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    zap: <polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" />,
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

type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read';

interface ThreadMessage {
  from: 'customer' | 'agent';
  text: string;
  time: string;
  by?: string;
  id?: string;
  delivery?: DeliveryStatus;
}

interface InternalNote {
  id: string;
  text: string;
  by: string;
  time: string;
}

interface Lead {
  interest: string;
  budget: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

interface ThreadComment {
  from: string;
  by?: string;
  text: string;
  time: string;
}

interface AiSuggestion {
  id?: string;
  text: string;
  confidence: number;
  sources: string[];
  unverified?: string[];
}

// What the inbox agent concluded about a conversation. Labels are estimates with a
// confidence, never facts, and an agent can correct them.
interface AgentInfo {
  intent: string;
  confidence: number | null;
  rationale: string;
  corrected: boolean;
  urgency: string;
  language: string;
  exclusions: string[];
  needsHuman: boolean;
  handoffReason: string;
  situationLabel: string;
  voiceName: string;
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
  isComplaint?: boolean;
  sourceLabel?: string;
  leadStage?: string;
  leadValue?: number | null;
  messages?: ThreadMessage[];
  post?: PostContext;
  comments?: ThreadComment[];
  aiSuggestion?: AiSuggestion;
  tags?: string[];
  notes?: InternalNote[];
  lead?: Lead | null;
  starred?: boolean;
  assigneeId?: string;
  notesCount?: number;
  agent?: AgentInfo;
  lastDirection?: string;
  lastActivityAt?: string | null;
}

// ─── Static metadata ────────────────────────────────────────────────────────
const CHANNEL_META: Record<ChannelKey, { letter: string; color: string; label: string }> = {
  instagram: { letter: 'I', color: '#C2185B', label: 'Instagram' },
  facebook: { letter: 'F', color: '#1877F2', label: 'Facebook' },
  whatsapp: { letter: 'W', color: '#25D366', label: 'WhatsApp' },
  tiktok: { letter: 'T', color: '#111111', label: 'TikTok' },
};

const STATUS_META: Record<StatusKey, { label: string; fg: string; bg: string }> = {
  unassigned: { label: 'Open', fg: '#1565C0', bg: 'rgba(33,150,243,.1)' },
  pending: { label: 'Pending', fg: '#B26A00', bg: 'rgba(237,108,2,.1)' },
  urgent: { label: 'Urgent', fg: '#C62828', bg: 'rgba(198,40,40,.1)' },
  resolved: { label: 'Resolved', fg: '#2E7D32', bg: 'rgba(46,125,50,.1)' },
};

type QueueFilter = 'all' | QueueKey | 'unanswered';

// Counts are computed from the conversations actually loaded — never a literal.
// A queue claiming 34 next to an empty list is worse than no number at all.
const QUEUE_DEFS: { id: QueueFilter; label: string }[] = [
  { id: 'all', label: 'All conversations' },
  { id: 'unassigned', label: 'Open' },
  { id: 'sales', label: 'Sales' },
  { id: 'support', label: 'Support' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'ad', label: 'Ad responses' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'resolved', label: 'Resolved' },
];

const BOARD_COLUMNS: { id: QueueKey; label: string }[] = [
  { id: 'unassigned', label: 'Open' },
  { id: 'sales', label: 'Sales' },
  { id: 'support', label: 'Support' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'ad', label: 'Ad responses' },
  { id: 'resolved', label: 'Resolved' },
];

export interface SavedReply {
  label: string;
  text: string;
  /** set when it comes from the brand's saved quick replies */
  id?: string;
  shortcut?: string;
}

const DEFAULT_TAG_PRESETS = ['VIP', 'Repeat customer', 'Refund', 'Spam review', 'Urgent'];

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

function pillStyle(active: boolean): CSSProperties {
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

// ─── API → view model ───────────────────────────────────────────────────────
// The backend is deliberately narrower than this screen: it knows conversations,
// messages and delivery, and nothing about queues, leads or AI
// suggestions. Those stay local UI state, so what a reviewer sees on screen is
// either real or plainly the agent's own working notes — never invented history
// dressed up as a customer's.

const CHANNEL_FALLBACK: ChannelKey = 'instagram';

function asChannel(platform: string): ChannelKey {
  return (['instagram', 'facebook', 'whatsapp', 'tiktok'] as const).includes(platform as ChannelKey)
    ? (platform as ChannelKey)
    : CHANNEL_FALLBACK;
}

function asStatus(status: string): StatusKey {
  return status === 'resolved' ? 'resolved' : status === 'pending' ? 'pending' : 'unassigned';
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = ['#C2185B', '#6A1B9A', '#00695C', '#EF6C00', '#283593'];

function avatarColorFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// The API sends UTC times without a zone suffix, which the browser would otherwise
// read as local time — an hour off in Lagos.
function parseUtc(iso: string): number {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`).getTime();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const then = parseUtc(iso);
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Meta's states, mapped to what the thread shows. `unknown` and `failed` are NOT
// collapsed into a tick: a send that may or may not have arrived is exactly what
// the agent needs to see.
function asDelivery(delivery: string): DeliveryStatus | undefined {
  switch (delivery) {
    case 'accepted':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    case 'pending':
      return 'pending';
    default:
      return undefined;
  }
}

const SALES_INTENTS = ['purchase', 'booking', 'product_question'];

export const INTENT_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  booking: 'Booking',
  product_question: 'Product question',
  support: 'Support',
  complaint: 'Complaint',
  praise: 'Praise',
  engagement: 'Engagement',
  spam: 'Spam',
  other: 'Other',
};

function queueFor(status: string, intent: string, fromAd: boolean): QueueKey {
  if (status === 'resolved') return 'resolved';
  if (intent === 'complaint') return 'complaints';
  if (fromAd) return 'ad';
  if (SALES_INTENTS.includes(intent)) return 'sales';
  if (intent === 'support') return 'support';
  return 'unassigned';
}

// The agent's fields, applied the same way to a fetched row and to the response of a
// correction or a fresh draft, so both paths render identically.
function agentFields(
  view: InboxAgentView,
  status: string,
  fromAd: boolean
): Pick<Conversation, 'agent' | 'aiSuggestion' | 'isComplaint' | 'queue'> & { urgent: boolean } {
  const s = view.ai_suggestion;
  return {
    agent: view.intent
      ? {
          intent: view.intent,
          confidence: view.intent_confidence ?? null,
          rationale: view.intent_rationale || '',
          corrected: Boolean(view.intent_corrected),
          urgency: view.urgency || 'normal',
          language: view.language || '',
          exclusions: view.exclusions ?? [],
          needsHuman: Boolean(view.needs_human),
          handoffReason: view.handoff_reason || '',
          situationLabel: view.situation_label || '',
          voiceName: view.voice_name || '',
        }
      : undefined,
    aiSuggestion:
      s && s.text
        ? {
            id: s.id,
            text: s.text,
            confidence: s.confidence,
            sources: s.sources.map((src) => src.label),
            unverified: s.unverified,
          }
        : undefined,
    isComplaint: view.intent === 'complaint',
    queue: queueFor(status, view.intent || '', fromAd),
    urgent: view.priority === 'high' && status !== 'resolved',
  };
}

function toConversation(dto: InboxConversationDTO): Conversation {
  const name = dto.contact_name || 'Unknown contact';
  const { urgent, ...agentPart } = agentFields(dto, dto.status, Boolean(dto.source_ad_id));
  return {
    id: dto.id,
    type: dto.kind,
    channel: asChannel(dto.platform),
    name,
    initials: initialsOf(name),
    avatarColor: avatarColorFor(dto.id),
    excerpt: dto.excerpt || '',
    time: relativeTime(dto.last_activity_at),
    status: urgent ? 'urgent' : asStatus(dto.status),
    sourceLabel: dto.source_ad_id ? 'an ad' : dto.source_post_id ? 'a post' : undefined,
    leadStage: dto.lead_stage || '',
    leadValue: dto.lead_value ?? null,
    tags: dto.tags ?? [],
    messages: dto.kind === 'dm' ? [] : undefined,
    comments: dto.kind === 'comment' ? [] : undefined,
    notes: [],
    // A lead is saved on the conversation (lead_stage, lead_interest, lead_value).
    lead:
      dto.lead_stage && dto.lead_stage !== 'lost'
        ? {
            interest: dto.lead_interest || '',
            budget: dto.lead_value != null ? String(dto.lead_value) : '',
            notes: '',
            createdBy: '',
            createdAt: '',
          }
        : null,
    starred: Boolean(dto.starred),
    assigneeId: dto.assignee_id || '',
    notesCount: dto.notes_count ?? 0,
    lastDirection: dto.last_direction || '',
    lastActivityAt: dto.last_activity_at,
    ...agentPart,
  };
}

function deskNote(n: DeskNote): InternalNote {
  return { id: n.id, text: n.text, by: n.author_name || 'Team', time: relativeTime(n.at) };
}

function toThreadMessage(m: InboxMessageDTO): ThreadMessage {
  return {
    id: m.id,
    from: m.direction === 'outbound' ? 'agent' : 'customer',
    by: m.direction === 'outbound' ? (m.by_agent ? 'URI agent (auto-reply)' : 'You') : undefined,
    text: m.text,
    time: relativeTime(m.received_at ?? m.provider_timestamp),
    delivery: m.direction === 'outbound' ? asDelivery(m.delivery) : undefined,
  };
}

function toThreadComment(m: InboxMessageDTO): ThreadComment {
  return {
    from: m.direction === 'outbound' ? 'agent' : 'customer',
    by: m.direction === 'outbound' ? (m.by_agent ? 'URI agent (auto-reply)' : 'You') : undefined,
    text: m.text,
    time: relativeTime(m.received_at ?? m.provider_timestamp),
  };
}

// Drives the header pill — never claims "all connected" while a real channel is
// disconnected or its token is expiring, and never counts an unapproved platform
// (TikTok) against the total.
function connectionsSummaryOf(channelConnections: ChannelConnection[]) {
  const approvedConnections = channelConnections.filter((c) => c.approved);
  const connectionIssues = approvedConnections.filter(
    (c) => !c.connected || c.tokenHealth === 'expiring' || Boolean(c.warning)
  );
  const reconnect = approvedConnections.filter((c) => c.warning).map((c) => c.label);
  return connectionIssues.length === 0
    ? { label: 'All channels connected', fg: '#2E7D32', bg: '#EAF8EF', dot: '#16A34A' }
    : {
        label: reconnect.length
          ? `Reconnect needed — ${reconnect.join(', ')}`
          : `${approvedConnections.length - connectionIssues.length}/${approvedConnections.length} connected — action needed`,
        fg: '#B26A00',
        bg: '#FFF4E5',
        dot: '#B26A00',
      };
}

// Small shared looks for the desk (list header, menus, the chat header buttons).
const deskButton: CSSProperties = {
  height: 32,
  padding: '0 12px',
  border: '1px solid #ECE6EA',
  borderRadius: 9,
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  fontSize: 12.5,
  fontWeight: 600,
  color: '#2A2230',
  cursor: 'pointer',
  fontFamily: "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  whiteSpace: 'nowrap',
};
const deskSelect: CSSProperties = { ...deskButton, appearance: 'auto', paddingRight: 6, flex: 1, minWidth: 0 };
const deskMenuLabel: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: '#999',
  margin: '10px 2px 4px',
};

// The pill on each conversation row: which queue it is in.
const QUEUE_PILL: Record<QueueKey, { label: string; fg: string; bg: string }> = {
  unassigned: { label: 'Open', fg: '#2563EB', bg: '#EAF2FF' },
  sales: { label: 'Sales', fg: '#7C3AED', bg: '#F1EAFE' },
  support: { label: 'Support', fg: '#15803D', bg: '#E7F7EE' },
  complaints: { label: 'Complaint', fg: '#C62828', bg: '#FDECEA' },
  ad: { label: 'Ad lead', fg: '#D0145C', bg: '#FDEEF4' },
  resolved: { label: 'Done', fg: '#5C5460', bg: '#F3F2EF' },
};

type OwnerFilter = 'all' | 'unassigned' | 'mine' | 'team';

/** Which Messaging section (and Settings section) a ?view= value or an in-page link means. */
export function resolveView(view: string): { section: MessagingSection; settings?: SettingsSection } {
  switch (view) {
    case 'connections':
      return { section: 'settings', settings: 'channels' };
    case 'usage':
      return { section: 'settings', settings: 'usage' };
    case 'settings':
      return { section: 'settings' };
    case 'inbox-settings':
      return { section: 'automations' };
    case 'quick':
      return { section: QUICK_REPLIES_ENABLED ? 'quick' : 'inbox' };
    case 'automations':
    case 'audience':
    case 'voice':
    case 'insights':
      return { section: view };
    default:
      return { section: 'inbox' };
  }
}

export default function InboxDashboard({
  isMobile,
  onSectionChange,
}: {
  isMobile: boolean;
  /** Keeps the sidebar's Messaging submenu highlight in step with the tabs. */
  onSectionChange?: (section: MessagingSection) => void;
}) {
  const [mobileScreen, setMobileScreen] = useState<'list' | 'thread'>('list');

  const [selectedQueue, setSelectedQueue] = useState<QueueFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelKey>('all');
  const [newestFirst, setNewestFirst] = useState(true);
  const [smartOpen, setSmartOpen] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [tagAdding, setTagAdding] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  // How wide the desk is decides what fits beside the chat: the filters column becomes a
  // "View" menu and the details panel a slide-over on narrower screens, so the chat itself
  // always keeps room to read and write.
  const deskRef = useRef<HTMLDivElement | null>(null);
  const [deskWidth, setDeskWidth] = useState(1200);
  const [detailsOverlayOpen, setDetailsOverlayOpen] = useState(false);
  // Full-size chat: the filters and the conversation list fold away and the chat fills the
  // Inbox card. Remembered on this browser. The list can still be opened as a slide-over.
  const [chatExpanded, setChatExpanded] = useState(false);
  const [listOverlayOpen, setListOverlayOpen] = useState(false);
  useEffect(() => {
    setChatExpanded(window.localStorage.getItem('uri.inbox.chatExpanded') === '1');
  }, []);
  function toggleChatExpanded() {
    setChatExpanded((v) => {
      window.localStorage.setItem('uri.inbox.chatExpanded', v ? '0' : '1');
      return !v;
    });
    setListOverlayOpen(false);
  }
  useEffect(() => {
    if (!chatExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (listOverlayOpen) setListOverlayOpen(false);
      else toggleChatExpanded();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatExpanded, listOverlayOpen]);
  useEffect(() => {
    const el = deskRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setDeskWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  });
  useEffect(() => {
    InboxService.listTeam()
      .then(setTeam)
      .catch(() => undefined);
  }, []);
  const [selectedId, setSelectedId] = useState<string>('');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [groupBy, setGroupBy] = useState<GroupMode>('time');

  const [cardQueues, setCardQueues] = useState<Record<string, QueueKey>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusKey>>({});
  const [messageOverrides, setMessageOverrides] = useState<Record<string, ThreadMessage[]>>({});
  const [commentOverrides, setCommentOverrides] = useState<Record<string, ThreadComment[]>>({});
  const [composerDrafts, setComposerDrafts] = useState<Record<string, string>>({});
  const [usedAiSuggestion, setUsedAiSuggestion] = useState<Record<string, boolean>>({});
  const [agentOverrides, setAgentOverrides] = useState<Record<string, InboxAgentView>>({});
  // Which suggestion the composer's text started from, so the send is recorded as
  // the draft sent as-is or edited rather than an unrelated reply.
  const [draftSuggestionIds, setDraftSuggestionIds] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState(false);
  const [agentError, setAgentError] = useState('');
  const lastActivityRef = useRef<Map<string, string | null | undefined>>(new Map());

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<QueueKey | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [moveMenuCardId, setMoveMenuCardId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ConversationType>('all');
  const [typeFilterMenuOpen, setTypeFilterMenuOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [threadTab, setThreadTab] = useState<'thread' | 'notes'>('thread');
  const [tagOverrides, setTagOverrides] = useState<Record<string, string[]>>({});
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [customTagDraft, setCustomTagDraft] = useState('');
  const [noteOverrides, setNoteOverrides] = useState<Record<string, InternalNote[]>>({});
  const [noteDraft, setNoteDraft] = useState('');
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [leadOverrides, setLeadOverrides] = useState<Record<string, Lead>>({});
  const [starOverrides, setStarOverrides] = useState<Record<string, boolean>>({});
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({});
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadFormInterest, setLeadFormInterest] = useState('');
  const [leadFormBudget, setLeadFormBudget] = useState('');
  const [leadFormNotes, setLeadFormNotes] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // ?view=connections is where a Meta connect started from the inbox lands back.
  // The sidebar's own Automated Messaging dropdown (Connections/Insights/Brand
  // Voice/AI Usage/Inbox Settings) links here the same way, so every sub-view
  // — not just connections — needs to be reachable from this same param.
  const searchParams = useSearchParams();
  // The sections of the new Messaging design, plus the older names the app and saved
  // links still use: "connections" and "usage" open Settings at that section, and the
  // old "Inbox Settings" ("settings" before the gear page existed) opens Automations.
  const [subView, setSection] = useState<MessagingSection>(() => resolveView(searchParams?.get('view') ?? '').section);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(
    () => resolveView(searchParams?.get('view') ?? '').settings ?? 'channels'
  );
  const setSubView = useCallback(
    (view: string) => {
      const r = resolveView(view);
      setSection(r.section);
      if (r.settings) setSettingsSection(r.settings);
      onSectionChange?.(r.section);
    },
    [onSectionChange]
  );
  // The lazy useState above only runs on first mount — it doesn't help when
  // the sidebar dropdown is clicked while this page is already open (the
  // common case: Automated Messaging is already the active tab, so the
  // param changes but this component never remounts). Re-derive the section
  // whenever the param itself actually changes.
  useEffect(() => {
    const v = searchParams?.get('view');
    if (v) {
      const r = resolveView(v);
      setSection(r.section);
      if (r.settings) setSettingsSection(r.settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get('view')]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, fetchNotifications, markAsRead } = useNotifications();
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);
  const [channelConnections, setChannelConnections] = useState<ChannelConnection[]>(INITIAL_CHANNEL_CONNECTIONS);
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [tagPresets, setTagPresets] = useState<string[]>(DEFAULT_TAG_PRESETS);
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  // Quick replies and tag presets are saved to the brand (Messaging › Quick Replies and
  // Settings › Tags); re-read whenever the inbox comes back into view so edits show up.
  useEffect(() => {
    if (subView !== 'inbox') return;
    InboxService.getDeskPrefs()
      .then((p) => {
        setTagPresets(p.tag_presets);
        setSavedReplies(
          p.quick_replies.map((r) => ({
            label: r.title,
            text: replyWithButtons(r.text, r.buttons),
            id: r.id,
            shortcut: r.shortcut,
          }))
        );
      })
      .catch(() => undefined);
  }, [subView]);

  // Escape closes whatever overlay is currently open — drawers, sheets,
  // menus and modals alike — since none of them trap focus, a keyboard or
  // screen-reader user otherwise has no way out but the mouse.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setLeadModalOpen(false);
      setMoveMenuCardId(null);
      setFilterDrawerOpen(false);
      setMoreMenuOpen(false);
      setTagMenuOpen(false);
      setSavedRepliesOpen(false);
      setTypeFilterMenuOpen(false);
      setNotificationsOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const [baseConversations, setBaseConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadedThreads, setLoadedThreads] = useState<Record<string, boolean>>({});

  // Real connections, so the page cannot show a channel nobody connected.
  const loadChannels = useCallback(async () => {
    try {
      setChannelConnections(channelsFromApi(await InboxService.listChannels()));
    } catch {
      // Leave the shells as they are — all showing "Not connected", which is
      // the safe thing to say when we could not find out.
    }
  }, []);
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const refreshConversations = useCallback(async () => {
    try {
      const rows = await InboxService.listConversations({ limit: 100 });
      const next = rows.map(toConversation);
      // A thread with new activity since the last poll is fetched again, so an
      // auto-reply or a new customer message shows up without a reload.
      const before = lastActivityRef.current;
      const changed = next.filter((c) => before.has(c.id) && before.get(c.id) !== c.lastActivityAt).map((c) => c.id);
      lastActivityRef.current = new Map(next.map((c) => [c.id, c.lastActivityAt]));
      if (changed.length) {
        const drop = <T,>(prev: Record<string, T>) => {
          const copy = { ...prev };
          changed.forEach((id) => delete copy[id]);
          return copy;
        };
        setLoadedThreads(drop);
        setAgentOverrides(drop);
        setUsedAiSuggestion(drop);
      }
      setBaseConversations(next);
      setLoadError('');
    } catch (e: unknown) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail;
      setLoadError(detail || 'Could not load conversations.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshConversations();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  // The team's internal notes on a conversation, fetched once when it is first opened.
  const [notesLoaded, setNotesLoaded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!selectedId || notesLoaded[selectedId]) return;
    const id = selectedId;
    setNotesLoaded((prev) => ({ ...prev, [id]: true }));
    InboxService.getDesk(id)
      .then((d) => setNoteOverrides((prev) => ({ ...prev, [id]: d.notes.slice().reverse().map(deskNote) })))
      .catch(() => setNotesLoaded((prev) => ({ ...prev, [id]: false })));
  }, [selectedId, notesLoaded]);

  // Messages are fetched per thread, once, when it is first opened: the list
  // endpoint returns only an excerpt, and fetching every thread's history up
  // front would be hundreds of requests for threads nobody opens.
  useEffect(() => {
    if (!selectedId || loadedThreads[selectedId]) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await InboxService.listMessages(selectedId);
        if (cancelled) return;
        const conv = baseConversations.find((c) => c.id === selectedId);
        if (conv?.type === 'comment') {
          setCommentOverrides((prev) => ({ ...prev, [selectedId]: rows.map(toThreadComment) }));
        } else {
          setMessageOverrides((prev) => ({ ...prev, [selectedId]: rows.map(toThreadMessage) }));
        }
        setLoadedThreads((prev) => ({ ...prev, [selectedId]: true }));
      } catch {
        // Leave the thread unloaded so reopening it tries again, rather than
        // showing an empty thread as though the customer had said nothing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, loadedThreads, baseConversations]);

  // Select the first conversation once there is one to select.
  useEffect(() => {
    if (!selectedId && baseConversations.length) setSelectedId(baseConversations[0].id);
  }, [baseConversations, selectedId]);

  // Every conversation with its live overrides folded in — everything below
  // reads from this, never from the fetched rows directly, so the list, the
  // board and the thread pane can never disagree about a conversation's
  // current state.
  const conversations = useMemo<Conversation[]>(
    () =>
      baseConversations.map((base) => {
        const view = agentOverrides[base.id];
        const c = view
          ? (() => {
              const { urgent, ...fields } = agentFields(view, base.status, base.sourceLabel === 'an ad');
              return { ...base, ...fields, status: urgent ? ('urgent' as StatusKey) : base.status };
            })()
          : base;
        return {
          ...c,
          status: statusOverrides[c.id] ?? c.status,
          messages: c.messages ? [...c.messages, ...(messageOverrides[c.id] || [])] : c.messages,
          comments: c.comments ? [...c.comments, ...(commentOverrides[c.id] || [])] : c.comments,
          tags: tagOverrides[c.id] ?? c.tags ?? [],
          notes: noteOverrides[c.id] ?? c.notes ?? [],
          lead: c.id in leadOverrides ? leadOverrides[c.id] : (c.lead ?? null),
          starred: starOverrides[c.id] ?? c.starred,
          assigneeId: assigneeOverrides[c.id] ?? c.assigneeId,
        };
      }),
    [
      baseConversations,
      agentOverrides,
      statusOverrides,
      messageOverrides,
      commentOverrides,
      tagOverrides,
      noteOverrides,
      leadOverrides,
      starOverrides,
      assigneeOverrides,
    ]
  );

  const currentQueueOf = (c: Conversation): QueueKey => cardQueues[c.id] ?? c.queue;

  // A conversation is unanswered when the most recent activity is from the
  // customer and nobody has replied since — computed live, not a static
  // queue tag, so it stays accurate as replies go out.
  function isUnanswered(c: Conversation): boolean {
    if (c.status === 'resolved') return false;
    const last = c.type === 'dm' ? c.messages?.[c.messages.length - 1] : c.comments?.[c.comments.length - 1];
    // Threads not opened yet have no messages loaded; the list row says who spoke last.
    if (!last) return c.lastDirection === 'inbound';
    return c.type === 'dm' ? (last as ThreadMessage).from === 'customer' : (last as ThreadComment).from !== 'agent';
  }

  const myId = team.find((m) => m.is_me)?.user_id ?? '';
  // "Assigned to me" / "Team" count open work only: a done conversation is nobody's queue.
  function matchesOwner(c: Conversation, owner: OwnerFilter): boolean {
    if (owner === 'all') return true;
    if (c.status === 'resolved') return false;
    const a = c.assigneeId ?? '';
    if (owner === 'unassigned') return !a;
    if (owner === 'mine') return Boolean(myId) && a === myId;
    return Boolean(a) && a !== myId;
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = conversations.filter((c) => {
      if (selectedQueue === 'unanswered') {
        if (!isUnanswered(c)) return false;
      } else if (selectedQueue !== 'all' && currentQueueOf(c) !== selectedQueue) {
        return false;
      }
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (tagFilter !== 'all' && !(c.tags ?? []).includes(tagFilter)) return false;
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (!matchesOwner(c, ownerFilter)) return false;
      if (q && !(c.name.toLowerCase().includes(q) || c.excerpt.toLowerCase().includes(q))) return false;
      return true;
    });
    return newestFirst ? list : list.slice().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversations,
    selectedQueue,
    cardQueues,
    typeFilter,
    tagFilter,
    searchQuery,
    channelFilter,
    ownerFilter,
    newestFirst,
    team,
  ]);

  const groups = useMemo(() => buildGroups(filteredConversations, groupBy), [filteredConversations, groupBy]);

  const waiting = notifications.filter((n) => n.type === 'inbox_needs_reply' && !n.read);

  function openWaiting(n: Notification) {
    markAsRead(n.notification_id);
    setNotificationsOpen(false);
    const id = n.metadata?.conversation_id;
    setSubView('inbox');
    if (typeof id === 'string' && conversations.some((c) => c.id === id)) setSelectedId(id);
  }

  const notificationBell = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={`Customers waiting${waiting.length ? ` (${waiting.length})` : ''}`}
        onClick={() => {
          if (!notificationsOpen) fetchNotifications(1);
          setNotificationsOpen((o) => !o);
        }}
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
          position: 'relative',
        }}
      >
        <I n="bell" s={18} />
        {waiting.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              boxSizing: 'border-box',
              borderRadius: 999,
              background: '#E91E63',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {waiting.length > 9 ? '9+' : waiting.length}
          </span>
        )}
      </button>
      {notificationsOpen && (
        <>
          <div onClick={() => setNotificationsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 999,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,.15)',
              border: '1px solid rgba(0,0,0,.06)',
              width: 320,
              maxWidth: '85vw',
              padding: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#333', padding: '6px 8px 10px' }}>
              Customers waiting for you
            </div>
            {waiting.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#888', padding: '4px 8px 10px' }}>
                Nobody&apos;s waiting. When Jane can&apos;t answer a message, it shows up here.
              </div>
            )}
            {waiting.map((n) => (
              <button
                key={n.notification_id}
                type="button"
                onClick={() => openWaiting(n)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: 8,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#C2185B1a',
                    color: '#C2185B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <I n="inbox" s={13} c="#C2185B" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#333' }}>{n.subject}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#666',
                      marginTop: 2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {String(n.metadata?.message ?? '')}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#999', marginTop: 2 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CONNECTIONS / INSIGHTS — full-width sub-screens, same for mobile and desktop
  // ═══════════════════════════════════════════════════════════════════════
  if (subView !== 'inbox') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          background: MSG_BG,
          color: '#1a1a1a',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <MessagingHeader
            active={subView}
            onSelect={(s) => setSubView(s)}
            connections={connectionsSummaryOf(channelConnections)}
            extra={notificationBell}
            compact={isMobile}
          />
          <div style={{ height: 18 }} />
          {subView === 'settings' ? (
            <SettingsPage
              isMobile={isMobile}
              section={settingsSection}
              onSection={setSettingsSection}
              connections={channelConnections}
              onConnected={handleChannelConnected}
              onChannelsChanged={loadChannels}
            />
          ) : subView === 'automations' ? (
            <AutomationsPage isMobile={isMobile} />
          ) : subView === 'quick' ? (
            <QuickRepliesPage isMobile={isMobile} />
          ) : subView === 'audience' ? (
            <AudiencePage
              isMobile={isMobile}
              onOpenConversation={(id) => {
                setSelectedId(id);
                setSubView('inbox');
                if (isMobile) setMobileScreen('thread');
              }}
            />
          ) : subView === 'insights' ? (
            <InsightsPage isMobile={isMobile} />
          ) : (
            <div style={{ padding: isMobile ? '0 14px 14px' : '0 28px 28px' }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F4E9EE', overflow: 'hidden' }}>
                <InboxPersonalityPage isMobile={isMobile} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Nothing to show yet. This has to come before selectedConv: with an empty
  // list the old `?? conversations[0]` was undefined and the next line crashed.
  if (loadingList || !conversations.length) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: MSG_BG,
          overflowY: 'auto',
        }}
      >
        <MessagingHeader
          active="inbox"
          onSelect={(s) => setSubView(s)}
          connections={connectionsSummaryOf(channelConnections)}
          extra={notificationBell}
          compact={isMobile}
        />
        <div style={{ height: 16, flex: '0 0 16px' }} />
        <div style={{ padding: isMobile ? '0 14px 14px' : '0 28px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F4E9EE' }}>
            <div
              style={{
                fontFamily: FONT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '64px 24px',
                textAlign: 'center',
                color: '#5B6472',
              }}
            >
              {loadingList ? (
                <p style={{ margin: 0, fontSize: 15 }}>Loading your inbox…</p>
              ) : loadError ? (
                <>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1F2430' }}>
                    We couldn&apos;t load your inbox
                  </p>
                  <p style={{ margin: 0, fontSize: 14, maxWidth: 420 }}>{loadError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingList(true);
                      refreshConversations();
                    }}
                    style={{
                      marginTop: 6,
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#C2185B',
                      color: '#fff',
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Try again
                  </button>
                </>
              ) : (
                <>
                  {channelConnections.some((c) => c.connected) ? (
                    <EmptyState
                      emoji="💬"
                      notes={['📸 Instagram DMs', '💬 Facebook']}
                      title="No messages"
                      highlight="yet"
                      body="Your accounts are connected. New messages and comments will show up here as they arrive."
                    />
                  ) : (
                    <EmptyState
                      emoji="💬"
                      notes={['📸 Instagram DMs', '💬 Facebook']}
                      title="Your customers will"
                      highlight="land here"
                      body="Messages and comments from your connected Instagram and Facebook accounts arrive here as they come in. Jane can draft the replies."
                      action={{ label: 'Connect an account', onClick: () => setSubView('connections') }}
                      secondary={{ label: "Set up Jane's brand voice first", onClick: () => setSubView('voice') }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    setListOverlayOpen(false);
    setSelectedId(id);
    setView('list');
    setThreadTab('thread');
    setOpenedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    if (isMobile) setMobileScreen('thread');
  }

  // The reply is shown as pending, then settled by what the provider actually
  // said. Delivery is never advanced on a timer: a tick the customer never
  // earned is a lie told to the agent.
  function showPending(text: string, localId: string) {
    if (selectedConv.type === 'dm') {
      setMessageOverrides((prev) => ({
        ...prev,
        [selectedId]: [
          ...(prev[selectedId] || []),
          { from: 'agent', by: 'You', text, time: 'Just now', id: localId, delivery: 'pending' },
        ],
      }));
    } else {
      setCommentOverrides((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { from: 'agent', by: 'You', text, time: 'Just now' }],
      }));
    }
  }

  function settleDelivery(localId: string, delivery: DeliveryStatus | undefined) {
    setMessageOverrides((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] || []).map((m) => (m.id === localId ? { ...m, delivery } : m)),
    }));
  }

  async function appendReply(text: string, suggestionId = '') {
    if (!selectedId || sending) return;
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // One key per composer submission, so a double-click or a retried request
    // sends once rather than messaging the customer twice.
    const idempotencyKey = localId;

    setSending(true);
    setSendError('');
    showPending(text, localId);

    try {
      const result = await InboxService.sendReply(selectedId, text, idempotencyKey, suggestionId);
      if (result.delivery === 'accepted') {
        settleDelivery(localId, 'sent');
      } else {
        // failed or unknown — the agent needs to know, and "unknown" genuinely
        // means it may have arrived, so it is not reported as a failure.
        settleDelivery(localId, undefined);
        setSendError(
          result.delivery === 'unknown'
            ? 'We did not hear back from Meta. The message may or may not have been delivered — check before resending.'
            : result.failure_reason || 'The message could not be sent.'
        );
      }
    } catch (e: unknown) {
      settleDelivery(localId, undefined);
      const detail = (e as { data?: { detail?: string } })?.data?.detail;
      setSendError(detail || 'The message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text || sending) return;
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: '' }));
    if (selectedConv.aiSuggestion) setUsedAiSuggestion((prev) => ({ ...prev, [selectedId]: true }));
    const suggestionId = draftSuggestionIds[selectedId] || '';
    setDraftSuggestionIds((prev) => ({ ...prev, [selectedId]: '' }));
    void appendReply(text, suggestionId);
  }

  function useAiSuggestionNow() {
    if (!selectedConv.aiSuggestion) return;
    appendReply(selectedConv.aiSuggestion.text, selectedConv.aiSuggestion.id || '');
    setUsedAiSuggestion((prev) => ({ ...prev, [selectedId]: true }));
  }

  function editAiSuggestionIntoComposer() {
    if (!selectedConv.aiSuggestion) return;
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: selectedConv.aiSuggestion!.text }));
    setDraftSuggestionIds((prev) => ({ ...prev, [selectedId]: selectedConv.aiSuggestion!.id || '' }));
  }

  async function draftAgain() {
    if (!selectedId || drafting) return;
    setDrafting(true);
    setAgentError('');
    try {
      const view = await InboxService.regenerateSuggestion(selectedId);
      setAgentOverrides((prev) => ({ ...prev, [selectedId]: view }));
      setUsedAiSuggestion((prev) => ({ ...prev, [selectedId]: false }));
    } catch (e: unknown) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail;
      setAgentError(detail || "Couldn't draft a reply right now.");
    } finally {
      setDrafting(false);
    }
  }

  async function handBackToJane() {
    if (!selectedId) return;
    setAgentError('');
    try {
      await InboxService.handBack(selectedId);
      setAgentOverrides((prev) => {
        const copy = { ...prev };
        delete copy[selectedId];
        return copy;
      });
      await refreshConversations();
    } catch {
      setAgentError("Couldn't hand this back to Jane. Try again.");
    }
  }

  async function correctIntent(intent: string) {
    if (!selectedId) return;
    setAgentError('');
    try {
      const view = await InboxService.correctClassification(
        selectedId,
        intent,
        intent === 'complaint' ? 'high' : undefined
      );
      setAgentOverrides((prev) => ({ ...prev, [selectedId]: view }));
      setCardQueues((prev) => {
        const copy = { ...prev };
        delete copy[selectedId];
        return copy;
      });
    } catch {
      setAgentError("Couldn't save that label.");
    }
  }

  function insertSavedReply(reply: SavedReply) {
    const first = (selectedConv?.name || '').trim().split(/\s+/)[0] || 'there';
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: reply.text.replace(/\{first_name\}/g, first) }));
    setSavedRepliesOpen(false);
    if (reply.id) InboxService.quickReplyUsed(reply.id).catch(() => undefined);
  }

  // Typing a quick reply's shortcut ("/hi") followed by a space puts the reply in.
  function onComposerChange(value: string) {
    const m = /^(\/[a-z0-9_-]+) $/i.exec(value);
    const hit =
      QUICK_REPLIES_ENABLED &&
      m &&
      savedReplies.find((r) => r.shortcut && r.shortcut.toLowerCase() === m[1].toLowerCase());
    if (hit) {
      insertSavedReply(hit);
      return;
    }
    setComposerDrafts((prev) => ({ ...prev, [selectedId]: value }));
  }

  // Every desk change shows at once and is saved to the brand; a failed save puts the
  // screen back and says so, so what you see is always what's stored.
  function saveDesk(id: string, change: DeskChange, undo: () => void) {
    InboxService.updateDesk(id, change).catch(() => {
      undo();
      ToastService.showToast("Couldn't save that change. Try again.", ToastTypeEnum.Error);
    });
  }

  function toggleResolved() {
    const id = selectedId;
    const wasResolved = selectedConv.status === 'resolved';
    const before = { status: statusOverrides[id], queue: cardQueues[id] };
    const next: StatusKey = wasResolved ? 'unassigned' : 'resolved';
    setStatusOverrides((prev) => ({ ...prev, [id]: next }));
    setCardQueues((prev) => ({ ...prev, [id]: next }));
    setMoreMenuOpen(false);
    saveDesk(id, { status: wasResolved ? 'open' : 'resolved' }, () => {
      setStatusOverrides((prev) => ({ ...prev, [id]: before.status as StatusKey }));
      setCardQueues((prev) => ({ ...prev, [id]: before.queue as QueueKey }));
    });
  }

  function setTags(next: string[]) {
    const id = selectedId;
    const before = selectedConv.tags ?? [];
    setTagOverrides((prev) => ({ ...prev, [id]: next }));
    saveDesk(id, { tags: next }, () => setTagOverrides((prev) => ({ ...prev, [id]: before })));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const current = selectedConv.tags ?? [];
    if (current.includes(trimmed)) return;
    setTags([...current, trimmed]);
    setCustomTagDraft('');
  }

  function removeTag(tag: string) {
    setTags((selectedConv.tags ?? []).filter((t) => t !== tag));
  }

  function toggleStar() {
    const id = selectedId;
    const next = !selectedConv.starred;
    setStarOverrides((prev) => ({ ...prev, [id]: next }));
    saveDesk(id, { starred: next }, () => setStarOverrides((prev) => ({ ...prev, [id]: !next })));
  }

  function assignTo(userId: string) {
    const id = selectedId;
    const before = selectedConv.assigneeId ?? '';
    setAssigneeOverrides((prev) => ({ ...prev, [id]: userId }));
    saveDesk(id, { assignee_id: userId }, () => setAssigneeOverrides((prev) => ({ ...prev, [id]: before })));
  }

  async function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const id = selectedId;
    setNoteDraft('');
    try {
      const n = await InboxService.addNote(id, text);
      setNoteOverrides((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), deskNote(n)] }));
    } catch {
      setNoteDraft(text);
      ToastService.showToast("Couldn't save the note. Try again.", ToastTypeEnum.Error);
    }
  }

  function deleteNote(noteId: string) {
    const id = selectedId;
    const before = noteOverrides[id] ?? [];
    setNoteOverrides((prev) => ({ ...prev, [id]: before.filter((n) => n.id !== noteId) }));
    InboxService.deleteNote(id, noteId).catch(() => {
      setNoteOverrides((prev) => ({ ...prev, [id]: before }));
      ToastService.showToast("Couldn't delete the note. Try again.", ToastTypeEnum.Error);
    });
  }

  function openLeadModal() {
    const existing = selectedConv.lead;
    setLeadFormInterest(existing?.interest ?? '');
    setLeadFormBudget(existing?.budget ?? '');
    setLeadFormNotes(existing?.notes ?? '');
    setLeadModalOpen(true);
    setMoreMenuOpen(false);
  }

  function submitLead() {
    if (!leadFormInterest.trim()) return;
    const id = selectedId;
    const before = id in leadOverrides ? leadOverrides[id] : undefined;
    const budget = leadFormBudget.trim();
    const value = Number(budget.replace(/[^\d.]/g, ''));
    setLeadOverrides((prev) => ({
      ...prev,
      [id]: {
        interest: leadFormInterest.trim(),
        budget,
        notes: leadFormNotes.trim(),
        createdBy: 'You',
        createdAt: 'Just now',
      },
    }));
    setLeadModalOpen(false);
    saveDesk(
      id,
      {
        lead_stage: (selectedConv.leadStage as DeskChange['lead_stage']) || 'new',
        lead_interest: leadFormInterest.trim(),
        lead_value: budget && Number.isFinite(value) && value > 0 ? value : null,
      },
      () =>
        setLeadOverrides((prev) => {
          const next = { ...prev };
          if (before === undefined) delete next[id];
          else next[id] = before;
          return next;
        })
    );
    // The lead form's notes are kept as an internal note on the conversation.
    if (leadFormNotes.trim()) {
      InboxService.addNote(id, `Lead: ${leadFormNotes.trim()}`)
        .then((n) => setNoteOverrides((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), deskNote(n)] })))
        .catch(() => undefined);
    }
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function bulkMarkResolved() {
    const ids = Array.from(selectedIds);
    setStatusOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = 'resolved'));
      return next;
    });
    setCardQueues((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = 'resolved'));
      return next;
    });
    exitSelectMode();
    Promise.allSettled(ids.map((id) => InboxService.updateDesk(id, { status: 'resolved' }))).then((r) => {
      const failed = r.filter((x) => x.status === 'rejected').length;
      if (failed)
        ToastService.showToast(
          `${failed} conversation${failed === 1 ? '' : 's'} couldn't be marked done.`,
          ToastTypeEnum.Error
        );
    });
  }

  function handleChannelConnected(channelId: string, accountLabel: string) {
    setChannelConnections((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? {
              ...c,
              connected: true,
              statusNote: `Connected as ${accountLabel}`,
              tokenHealth: 'healthy',
              lastEvent: 'Just now',
            }
          : c
      )
    );
  }

  // ── Shared thread body (used by both the desktop thread pane and the mobile thread screen) ──
  const messagesView = (
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
                <div
                  style={{
                    fontSize: 10,
                    color: '#AD1457',
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  {m.by} · {m.time}
                  {m.delivery === 'pending' && <I n="clock" s={11} c="#c98aa8" />}
                  {m.delivery === 'sent' && <I n="check" s={11} c="#c98aa8" />}
                  {m.delivery === 'delivered' && <I n="checkCheck" s={11} c="#AD1457" />}
                  {m.delivery === 'read' && <I n="checkCheck" s={11} c="#1565C0" />}
                </div>
              </div>
            </div>
          )
        )}

      {selectedConv.type === 'comment' && (
        // flexShrink 0: with overflow hidden, the column would otherwise squash this card to the
        // panel height and cut the comments off instead of letting the panel scroll.
        <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          {selectedConv.post && (
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
          )}
          <div
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderTop: selectedConv.post ? '1px solid rgba(0,0,0,.06)' : undefined,
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
                    {c.from === 'customer' ? selectedConv.name : c.from}{' '}
                    <span style={{ fontWeight: 500, color: '#999', fontSize: 11 }}>· {c.time}</span>
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
                color: selectedConv.aiSuggestion.confidence >= 85 ? '#2E7D32' : '#B26A00',
                background: selectedConv.aiSuggestion.confidence >= 85 ? 'rgba(46,125,50,.1)' : 'rgba(237,108,2,.1)',
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
            {selectedConv.aiSuggestion.sources.length
              ? `Grounded in: ${selectedConv.aiSuggestion.sources.join(' · ')}`
              : 'No approved source answers this yet — check it before sending, or add an FAQ in Inbox Settings.'}
          </div>
          {(selectedConv.aiSuggestion.unverified ?? []).length > 0 && (
            <div style={{ fontSize: 11.5, color: '#B26A00', fontWeight: 600, marginBottom: 10 }}>
              Check before sending — not verified: {(selectedConv.aiSuggestion.unverified ?? []).join(', ')}
            </div>
          )}
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
            <button
              type="button"
              onClick={draftAgain}
              disabled={drafting}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                fontWeight: 700,
                color: '#AD1457',
                cursor: drafting ? 'default' : 'pointer',
                fontFamily: FONT,
              }}
            >
              {drafting ? 'Drafting…' : 'Draft again'}
            </button>
          </div>
        </div>
      )}

      {(!selectedConv.aiSuggestion || usedAiSuggestion[selectedId]) && isUnanswered(selectedConv) && (
        <button
          type="button"
          onClick={draftAgain}
          disabled={drafting}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1.5px dashed #E91E63',
            background: 'rgba(194,24,91,.04)',
            fontSize: 12.5,
            fontWeight: 700,
            color: '#AD1457',
            cursor: drafting ? 'default' : 'pointer',
            fontFamily: FONT,
          }}
        >
          <I n="sparkle" s={13} c="#AD1457" />
          {drafting ? 'Drafting a reply…' : 'Draft a reply with URI'}
        </button>
      )}
    </div>
  );

  const notesView = (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          color: '#B26A00',
          background: 'rgba(237,108,2,.08)',
          border: '1px solid rgba(237,108,2,.2)',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        Private notes are only visible to your team — the customer never sees these.
      </div>
      {(selectedConv.notes ?? []).length === 0 ? (
        <div style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '24px 0' }}>No notes yet</div>
      ) : (
        (selectedConv.notes ?? []).map((note) => (
          <div
            key={note.id}
            style={{
              background: '#fff8ea',
              border: '1px solid rgba(237,108,2,.15)',
              borderRadius: 12,
              padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.5 }}>{note.text}</div>
            <div style={{ fontSize: 10.5, color: '#B26A00', marginTop: 6, fontWeight: 600 }}>
              {note.by} · {note.time}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const threadTabs = (
    <div
      style={{
        flex: '0 0 auto',
        display: 'flex',
        gap: 4,
        padding: '10px 20px 0',
        borderBottom: '1px solid rgba(0,0,0,.06)',
      }}
    >
      {(
        [
          ['thread', selectedConv.type === 'comment' ? 'Comment' : 'Conversation'],
          ['notes', `Notes${(selectedConv.notes ?? []).length ? ` (${(selectedConv.notes ?? []).length})` : ''}`],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setThreadTab(id)}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderBottom: threadTab === id ? '2px solid #E91E63' : '2px solid transparent',
            background: 'transparent',
            fontSize: 12.5,
            fontWeight: 700,
            color: threadTab === id ? '#AD1457' : '#999',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const threadBody = threadTab === 'thread' ? messagesView : notesView;

  const noteComposer = (
    <div style={{ flex: '0 0 auto', padding: '14px 20px 18px', borderTop: '1px solid rgba(0,0,0,.08)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          background: '#fff8ea',
          border: '1px solid rgba(237,108,2,.2)',
          borderRadius: 12,
          padding: '10px 12px',
        }}
      >
        <textarea
          aria-label="Add an internal note"
          placeholder="Add a private note for your team..."
          rows={1}
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              addNote();
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
          onClick={addNote}
          disabled={!noteDraft.trim()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 8,
            background: noteDraft.trim() ? '#B26A00' : '#e8c9a0',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: noteDraft.trim() ? 'pointer' : 'default',
            fontFamily: FONT,
            flex: '0 0 auto',
          }}
        >
          Add note
        </button>
      </div>
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
        {QUICK_REPLIES_ENABLED && (
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <button
              type="button"
              aria-label="Saved replies"
              title="Saved replies"
              onClick={() => setSavedRepliesOpen((o) => !o)}
              style={{
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <I n="zap" s={16} />
            </button>
            {savedRepliesOpen && (
              <>
                <div onClick={() => setSavedRepliesOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: 0,
                    zIndex: 999,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                    border: '1px solid rgba(0,0,0,.06)',
                    minWidth: 240,
                    maxWidth: '80vw',
                    padding: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                      color: '#999',
                      padding: '6px 8px',
                    }}
                  >
                    Saved replies
                  </div>
                  {savedReplies.length === 0 && (
                    <div style={{ padding: '6px 8px 8px', fontSize: 12.5, color: '#888', lineHeight: 1.5 }}>
                      None yet. Add them under Quick Replies.
                    </div>
                  )}
                  {savedReplies.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => insertSavedReply(r)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#333' }}>{r.label}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#999',
                          marginTop: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {r.text}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <textarea
          aria-label="Reply message"
          placeholder={
            isMobile || !QUICK_REPLIES_ENABLED ? 'Write a reply…' : 'Write a reply… (type / for a quick reply)'
          }
          rows={1}
          value={draft}
          onChange={(e) => onComposerChange(e.target.value)}
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
          disabled={!draft.trim() || sending}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 8,
            background: draft.trim() && !sending ? '#AD1457' : '#d9a9bc',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: draft.trim() && !sending ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT,
            flex: '0 0 auto',
          }}
        >
          <I n="send" s={14} c="#fff" />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {sendError ? (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#FDECEF',
            border: '1px solid #F3C2CD',
            fontSize: 12,
            color: '#8E1338',
            fontFamily: FONT,
          }}
        >
          <span style={{ flex: 1 }}>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError('')}
            aria-label="Dismiss"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8E1338',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: '#999' }}>
          <I n="checkCheck" s={12} c="#2E7D32" />
          Delivery reflects what the channel reports
        </div>
      )}
      {selectedConv.channel === 'whatsapp' && <WhatsAppTemplatePicker conversationId={selectedConv.id} />}
    </div>
  );

  function threadHeader(showBack: boolean) {
    const backButton = showBack && (
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
    );

    const avatar = (
      <div
        style={{
          width: isMobile ? 30 : 34,
          height: isMobile ? 30 : 34,
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
    );

    const nameAndChannel = (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#1a1a1a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selectedConv.name}
        </div>
        <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: chSel.color, flex: '0 0 auto' }} />
          {chSel.label}
        </div>
      </div>
    );

    const statusChip = (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 12,
          background: stSel.bg,
          color: stSel.fg,
          whiteSpace: 'nowrap',
          flex: '0 0 auto',
        }}
      >
        {stSel.label}
      </span>
    );

    const moreControl = (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label="More options"
          onClick={() => {
            setMoreMenuOpen((o) => !o);
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
            flex: '0 0 auto',
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
              <button
                type="button"
                onClick={openLeadModal}
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
                <I n="target" s={14} c={selectedConv.lead ? '#2E7D32' : '#999'} />
                {selectedConv.lead ? 'Edit lead' : 'Create lead'}
              </button>
            </div>
          </>
        )}
      </div>
    );

    if (isMobile) {
      // Two rows: identity gets its own row so a long name never has to
      // fight the more button for space.
      return (
        <div style={{ flex: '0 0 auto', borderBottom: '1px solid rgba(0,0,0,.08)', boxSizing: 'border-box' }}>
          <div
            style={{
              height: 52,
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxSizing: 'border-box',
            }}
          >
            {backButton}
            {avatar}
            {nameAndChannel}
            {moreControl}
          </div>
          <div
            style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}
          >
            {statusChip}
          </div>
        </div>
      );
    }

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
        {backButton}
        {avatar}
        {nameAndChannel}
        {statusChip}
        {moreControl}
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
      {selectedConv.sourceLabel === 'an ad' && (
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          Lead
          <select
            value={selectedConv.leadStage || ''}
            onChange={async (e) => {
              const stage = e.target.value;
              const id = selectedConv.id;
              if (!stage) return;
              setBaseConversations((prev) => prev.map((c) => (c.id === id ? { ...c, leadStage: stage } : c)));
              await GrowthService.setLeadStage(id, stage).catch(() => undefined);
            }}
            style={{
              fontSize: 12,
              fontFamily: FONT,
              border: '1px solid rgba(194,24,91,.3)',
              borderRadius: 6,
              padding: '2px 6px',
              color: '#AD1457',
              background: '#fff',
            }}
          >
            <option value="">Not set</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          {selectedConv.leadStage === 'converted' && (
            <input
              key={selectedConv.id}
              type="number"
              min={0}
              placeholder="Order ₦"
              aria-label="Order value in naira"
              defaultValue={selectedConv.leadValue ?? ''}
              onBlur={async (e) => {
                const value = Number(e.target.value);
                const id = selectedConv.id;
                if (!e.target.value || Number.isNaN(value)) return;
                setBaseConversations((prev) => prev.map((c) => (c.id === id ? { ...c, leadValue: value } : c)));
                await GrowthService.setLeadStage(id, 'converted', value).catch(() => undefined);
              }}
              style={{
                width: 90,
                fontSize: 12,
                fontFamily: FONT,
                border: '1px solid rgba(194,24,91,.3)',
                borderRadius: 6,
                padding: '2px 6px',
              }}
            />
          )}
        </label>
      )}
    </div>
  );

  const agentInfo = selectedConv.agent;
  const agentStrip = (
    <div
      style={{
        padding: '8px 20px',
        borderBottom: '1px solid rgba(0,0,0,.06)',
        fontSize: 12,
        color: '#555',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <I n="sparkle" s={13} c="#AD1457" />
        {agentInfo ? (
          <>
            <span title={agentInfo.rationale || undefined} style={{ fontWeight: 700, color: '#1a1a1a' }}>
              {INTENT_LABELS[agentInfo.intent] ?? agentInfo.intent}
            </span>
            <span style={{ color: '#999' }}>
              {agentInfo.corrected
                ? 'set by your team'
                : agentInfo.confidence !== null
                  ? `URI's estimate · ${agentInfo.confidence}% sure`
                  : "URI's estimate"}
            </span>
            {agentInfo.urgency === 'high' && <span style={{ fontWeight: 700, color: '#C62828' }}>Urgent</span>}
            {agentInfo.language === 'pcm' && <span style={{ color: '#999' }}>Pidgin</span>}
            {agentInfo.situationLabel && agentInfo.situationLabel !== 'General' && (
              <span
                title={agentInfo.voiceName ? `Replying as ${agentInfo.voiceName}` : undefined}
                style={{
                  color: '#AD1457',
                  background: 'rgba(194,24,91,.08)',
                  borderRadius: 6,
                  padding: '1px 7px',
                  fontWeight: 600,
                }}
              >
                {agentInfo.situationLabel}
              </span>
            )}
            <select
              aria-label="Correct the label"
              value=""
              onChange={(e) => e.target.value && correctIntent(e.target.value)}
              style={{
                marginLeft: 'auto',
                border: '1px solid rgba(0,0,0,.12)',
                borderRadius: 6,
                padding: '3px 6px',
                fontSize: 11.5,
                fontFamily: FONT,
                color: '#444',
                background: '#fff',
              }}
            >
              <option value="">Wrong label? Change it</option>
              {Object.entries(INTENT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </>
        ) : (
          <span style={{ color: '#999' }}>Not labelled yet</span>
        )}
      </div>
      {agentInfo && agentInfo.exclusions.length > 0 && (
        <div style={{ color: '#B26A00', fontWeight: 600 }}>
          Always reviewed by a person: {agentInfo.exclusions.join(', ')}
        </div>
      )}
      {agentInfo?.needsHuman && agentInfo.handoffReason && (
        <div
          style={{
            color: '#7A4B00',
            background: '#FFF7E6',
            border: '1px solid #F5D9A8',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          <strong>Not sent automatically:</strong> {agentInfo.handoffReason}. Check the draft below and send it
          yourself. Auto-replies only send when URI is sure the reply is right.
          {/(team member|assigned)/i.test(agentInfo.handoffReason) && (
            <button
              type="button"
              onClick={handBackToJane}
              style={{
                marginLeft: 8,
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid #C2185B',
                background: '#fff',
                color: '#C2185B',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Hand back to Jane
            </button>
          )}
        </div>
      )}
      {agentError && <div style={{ color: '#C62828' }}>{agentError}</div>}
    </div>
  );

  const tagsRow = (
    <div
      style={{
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        borderBottom: '1px solid rgba(0,0,0,.06)',
      }}
    >
      {(selectedConv.tags ?? []).map((tag) => (
        <span
          key={tag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 6px 4px 10px',
            borderRadius: 12,
            background: 'rgba(194,24,91,.08)',
            color: '#AD1457',
          }}
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => removeTag(tag)}
            style={{
              width: 16,
              height: 16,
              border: 'none',
              background: 'rgba(194,24,91,.15)',
              borderRadius: '50%',
              color: '#AD1457',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <I n="x" s={9} />
          </button>
        </span>
      ))}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setTagMenuOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 12,
            border: '1px dashed rgba(0,0,0,.2)',
            background: 'transparent',
            color: '#888',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          <I n="plus" s={10} />
          Tag
        </button>
        {tagMenuOpen && (
          <>
            <div onClick={() => setTagMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 999,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                border: '1px solid rgba(0,0,0,.06)',
                minWidth: 200,
                padding: 10,
              }}
            >
              {tagPresets
                .filter((t) => !(selectedConv.tags ?? []).includes(t))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      addTag(t);
                      setTagMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 8px',
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
                    {t}
                  </button>
                ))}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 6,
                  padding: '6px 4px 0',
                  borderTop: '1px solid rgba(0,0,0,.06)',
                }}
              >
                <input
                  aria-label="Custom tag"
                  placeholder="Custom tag..."
                  value={customTagDraft}
                  onChange={(e) => setCustomTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTag(customTagDraft);
                      setTagMenuOpen(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: '1px solid rgba(0,0,0,.1)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontSize: 12,
                    fontFamily: FONT,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag(customTagDraft);
                    setTagMenuOpen(false);
                  }}
                  style={{
                    border: 'none',
                    background: '#AD1457',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '0 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {selectedConv.lead && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 12,
            background: 'rgba(46,125,50,.1)',
            color: '#2E7D32',
            marginLeft: 'auto',
          }}
        >
          <I n="target" s={11} c="#2E7D32" />
          Lead
        </span>
      )}
    </div>
  );

  // ── Shared: queue pills (used in desktop sidebar + mobile chip row) ──
  const queuePills = QUEUE_DEFS.map((q) => ({
    ...q,
    active: selectedQueue === q.id,
    count:
      q.id === 'all'
        ? conversations.length
        : q.id === 'unanswered'
          ? conversations.filter(isUnanswered).length
          : conversations.filter((c) => currentQueueOf(c) === q.id).length,
  }));

  const ownerViews: { id: OwnerFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All conversations', count: conversations.length },
    { id: 'unassigned', label: 'Unassigned', count: conversations.filter((c) => matchesOwner(c, 'unassigned')).length },
    { id: 'mine', label: 'Assigned to me', count: conversations.filter((c) => matchesOwner(c, 'mine')).length },
    { id: 'team', label: 'Team', count: conversations.filter((c) => matchesOwner(c, 'team')).length },
  ];
  // The design's smart views, then the queues the inbox already had, so none is lost.
  const SMART_ORDER: QueueFilter[] = ['unassigned', 'unanswered', 'sales', 'support', 'ad', 'complaints', 'resolved'];
  const SMART_LABEL: Partial<Record<QueueFilter, string>> = {
    unassigned: 'Open',
    unanswered: 'Needs reply',
    ad: 'Ad leads',
    complaints: 'Complaints',
    resolved: 'Done',
  };
  const smartViews = SMART_ORDER.map((id) => {
    const pill = queuePills.find((q) => q.id === id)!;
    return { ...pill, label: SMART_LABEL[id] ?? pill.label };
  });

  const allTagsInUse = Array.from(new Set(conversations.flatMap((c) => c.tags ?? []))).sort();
  const hasExtraFilters = typeFilter !== 'all' || tagFilter !== 'all';

  const listEmptyState = (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 4 }}>No conversations match</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {searchQuery ? `Nothing found for "${searchQuery}".` : 'Try a different queue, type, or clearing your filters.'}
      </div>
      {(searchQuery || hasExtraFilters || selectedQueue !== 'all') && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setTypeFilter('all');
            setTagFilter('all');
            setSelectedQueue('all');
          }}
          style={{
            marginTop: 12,
            padding: '7px 16px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,.12)',
            background: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            color: '#AD1457',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );

  const connectionsSummary = connectionsSummaryOf(channelConnections);

  // ── The new desk: chat header and conversation details (desktop) ──
  function setDeskStatus(next: 'open' | 'pending' | 'resolved') {
    const id = selectedId;
    const key: StatusKey = next === 'open' ? 'unassigned' : next;
    const before = { status: statusOverrides[id], queue: cardQueues[id] };
    setStatusOverrides((prev) => ({ ...prev, [id]: key }));
    if (next === 'resolved' || selectedConv.status === 'resolved')
      setCardQueues((prev) => ({ ...prev, [id]: next === 'resolved' ? 'resolved' : 'unassigned' }));
    saveDesk(id, { status: next }, () => {
      setStatusOverrides((prev) => ({ ...prev, [id]: before.status as StatusKey }));
      setCardQueues((prev) => ({ ...prev, [id]: before.queue as QueueKey }));
    });
  }

  const assignee = team.find((m) => m.user_id === selectedConv.assigneeId);
  const assigneeLabel = (m?: TeamMember) => (m ? (m.is_me ? `${m.name} (you)` : m.name) : 'Unassigned');
  const deskStatus: 'open' | 'pending' | 'resolved' =
    selectedConv.status === 'resolved' ? 'resolved' : selectedConv.status === 'pending' ? 'pending' : 'open';
  const STATUS_LOOK = {
    open: { label: 'Open', fg: '#2563EB', bg: '#EAF2FF' },
    pending: { label: 'Pending', fg: '#B26A00', bg: '#FFF4E5' },
    resolved: { label: 'Done', fg: '#15803D', bg: '#E7F7EE' },
  } as const;

  const assignMenu = assignOpen && (
    <>
      <div onClick={() => setAssignOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
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
          minWidth: 200,
          padding: 6,
        }}
      >
        {[undefined, ...team].map((m) => (
          <button
            key={m?.user_id ?? 'none'}
            type="button"
            onClick={() => {
              assignTo(m?.user_id ?? '');
              setAssignOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              border: 'none',
              background: (selectedConv.assigneeId ?? '') === (m?.user_id ?? '') ? '#FDEEF4' : 'transparent',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#2A2230',
              cursor: 'pointer',
              fontFamily: FONT,
              textAlign: 'left',
            }}
          >
            {assigneeLabel(m)}
            {(selectedConv.assigneeId ?? '') === (m?.user_id ?? '') && <Check size={14} color="#D0145C" />}
          </button>
        ))}
        {team.length <= 1 && (
          <div style={{ fontSize: 11.5, color: '#8A8290', padding: '6px 10px 4px', lineHeight: 1.45 }}>
            Invite teammates to this brand to assign conversations to them.
          </div>
        )}
      </div>
    </>
  );

  const showFilters = deskWidth >= 1000 && !chatExpanded;
  const showDetails = deskWidth >= 1150;
  // Up to the 1440 laptop width the panel stays 214px; past it the panel takes a share of
  // the extra room so the chat doesn't stretch into very long lines.
  const detailsWidth = Math.round(Math.min(340, Math.max(214, 214 + (deskWidth - 1230) * 0.3)));
  // Header buttons: a little tighter than the list's, so all six fit beside the name.
  const hdrButton: CSSProperties = { ...deskButton, padding: '0 9px', gap: 5 };
  const deskHeader = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderBottom: '1px solid #F1EBEE',
        flex: '0 0 auto',
      }}
    >
      <PlatformBadge
        platform={selectedConv.channel}
        size={28}
        initials={selectedConv.initials}
        color={selectedConv.avatarColor}
      />
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selectedConv.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#6D6572',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {PLATFORM_LABEL[selectedConv.channel]}
          {selectedConv.type === 'comment' ? ' comment' : ''} · Last active {selectedConv.time}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', flexShrink: 0 }}>
        {chatExpanded && (
          <button
            type="button"
            onClick={() => setListOverlayOpen((o) => !o)}
            style={{
              ...hdrButton,
              borderColor: listOverlayOpen ? '#E0156B' : '#ECE6EA',
              color: listOverlayOpen ? '#E0156B' : '#2A2230',
            }}
          >
            <List size={15} />
            Chats
          </button>
        )}
        <button
          type="button"
          onClick={toggleChatExpanded}
          aria-label={chatExpanded ? 'Exit full size' : 'Expand chat'}
          title={chatExpanded ? 'Exit full size (Esc)' : 'Expand chat'}
          style={{
            ...hdrButton,
            width: 32,
            padding: 0,
            borderColor: chatExpanded ? '#E0156B' : '#ECE6EA',
            color: chatExpanded ? '#E0156B' : '#2A2230',
          }}
        >
          {chatExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button
          type="button"
          aria-label={selectedConv.starred ? 'Unstar' : 'Star'}
          onClick={toggleStar}
          style={{ ...hdrButton, width: 32, padding: 0 }}
        >
          <Star
            size={16}
            fill={selectedConv.starred ? '#F5B301' : 'none'}
            color={selectedConv.starred ? '#F5B301' : '#2A2230'}
          />
        </button>
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setAssignOpen((o) => !o)} style={hdrButton}>
            <User size={15} />
            {assignee ? (assignee.is_me ? 'You' : assignee.name.split(' ')[0]) : 'Assign'}
            <ChevronDown size={14} />
          </button>
          {assignMenu}
        </div>
        {!showDetails && (
          <button
            type="button"
            onClick={() => setDetailsOverlayOpen((o) => !o)}
            style={{
              ...hdrButton,
              borderColor: detailsOverlayOpen ? '#E0156B' : '#ECE6EA',
              background: detailsOverlayOpen ? '#FDF1F6' : '#fff',
              color: detailsOverlayOpen ? '#E0156B' : '#2A2230',
            }}
          >
            <PanelRight size={15} />
            {detailsOverlayOpen ? 'Hide details' : 'Details'}
          </button>
        )}
        <button type="button" onClick={toggleResolved} style={hdrButton}>
          <Check size={15} />
          {selectedConv.status === 'resolved' ? 'Reopen' : showDetails ? 'Mark as done' : 'Done'}
        </button>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="More"
            onClick={() => setMoreMenuOpen((o) => !o)}
            style={{ ...hdrButton, border: 'none', width: 30, padding: 0 }}
          >
            <MoreHorizontal size={18} />
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
                  minWidth: 190,
                  padding: 6,
                }}
              >
                <button
                  type="button"
                  onClick={openLeadModal}
                  style={{ ...hdrButton, border: 'none', width: '100%', justifyContent: 'flex-start' }}
                >
                  <I n="target" s={14} c={selectedConv.lead ? '#2E7D32' : '#999'} />
                  {selectedConv.lead ? 'Edit lead' : 'Create lead'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeskStatus(deskStatus === 'pending' ? 'open' : 'pending');
                    setMoreMenuOpen(false);
                  }}
                  style={{ ...hdrButton, border: 'none', width: '100%', justifyContent: 'flex-start' }}
                >
                  <I n="clock" s={14} c="#999" />
                  {deskStatus === 'pending' ? 'Mark as open' : 'Mark as pending'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Phones: back, who it is, star, mark as done, and the details sheet.
  const iconButton: CSSProperties = { ...deskButton, width: 36, height: 36, padding: 0, flex: '0 0 auto' };
  const mobileDeskHeader = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        background: '#fff',
        borderBottom: '1px solid #F1EBEE',
        flex: '0 0 auto',
      }}
    >
      <button
        type="button"
        aria-label="Back to conversations"
        onClick={() => setMobileScreen('list')}
        style={{ ...iconButton, border: 'none' }}
      >
        <I n="chevronLeft" s={20} />
      </button>
      <PlatformBadge
        platform={selectedConv.channel}
        size={38}
        initials={selectedConv.initials}
        color={selectedConv.avatarColor}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {selectedConv.name}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: '#6D6572',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {PLATFORM_LABEL[selectedConv.channel]} · {selectedConv.time}
        </div>
      </div>
      <button
        type="button"
        aria-label={selectedConv.starred ? 'Unstar' : 'Star'}
        onClick={toggleStar}
        style={iconButton}
      >
        <Star
          size={16}
          fill={selectedConv.starred ? '#F5B301' : 'none'}
          color={selectedConv.starred ? '#F5B301' : '#2A2230'}
        />
      </button>
      <button
        type="button"
        aria-label={selectedConv.status === 'resolved' ? 'Reopen' : 'Mark as done'}
        onClick={toggleResolved}
        style={{ ...iconButton, background: selectedConv.status === 'resolved' ? '#E7F7EE' : '#fff' }}
      >
        <Check size={16} color={selectedConv.status === 'resolved' ? '#15803D' : '#2A2230'} />
      </button>
      <button
        type="button"
        aria-label="Conversation details"
        onClick={() => setDetailsSheetOpen(true)}
        style={{ ...iconButton, width: 'auto', padding: '0 10px' }}
      >
        <User size={15} />
        Details
      </button>
    </div>
  );

  const detailsLabel: CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#2A2230' };
  const presetsLeft = tagPresets.filter((t) => !(selectedConv.tags ?? []).includes(t));
  // The details (status, assignee, tags, lead, notes): a side panel on desktop, a bottom
  // sheet on phones.
  const detailsContent = (
    <>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Conversation details</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: 12.5, color: '#3A3240' }}>
        <PlatformBadge platform={selectedConv.channel} size={24} plain />
        {PLATFORM_LABEL[selectedConv.channel]}
        {selectedConv.type === 'comment' ? ' comment' : ''}
      </div>
      <div style={{ height: 1, background: '#F1EBEE', margin: '14px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={detailsLabel}>Status</span>
        <select
          aria-label="Status"
          value={deskStatus}
          onChange={(e) => setDeskStatus(e.target.value as 'open' | 'pending' | 'resolved')}
          style={{
            border: 'none',
            borderRadius: 14,
            padding: '5px 10px',
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: FONT,
            background: STATUS_LOOK[deskStatus].bg,
            color: STATUS_LOOK[deskStatus].fg,
            cursor: 'pointer',
          }}
        >
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Done</option>
        </select>
      </div>
      <div style={{ ...detailsLabel, marginTop: 16 }}>Assignee</div>
      <select
        aria-label="Assignee"
        value={selectedConv.assigneeId ?? ''}
        onChange={(e) => assignTo(e.target.value)}
        style={{ ...deskSelect, width: '100%', marginTop: 6, flex: 'none' }}
      >
        <option value="">Unassigned</option>
        {team.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {assigneeLabel(m)}
          </option>
        ))}
      </select>
      <div style={{ height: 1, background: '#F1EBEE', margin: '14px 0' }} />
      <div style={detailsLabel}>Tags</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {(selectedConv.tags ?? []).map((t) => {
          const l = tagLook(t);
          return (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 500,
                padding: '3px 9px',
                borderRadius: 7,
                background: l.bg,
                color: l.fg,
              }}
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => removeTag(t)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: l.fg,
                  display: 'flex',
                }}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>
      {tagAdding ? (
        <div style={{ marginTop: 8 }}>
          <input
            autoFocus
            value={customTagDraft}
            onChange={(e) => setCustomTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag(customTagDraft);
              if (e.key === 'Escape') setTagAdding(false);
            }}
            placeholder="New tag…"
            style={{
              width: '100%',
              height: 30,
              border: '1px solid #ECE6EA',
              borderRadius: 8,
              padding: '0 9px',
              fontSize: 12.5,
              fontFamily: FONT,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {presetsLeft.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                style={{
                  border: '1px solid #ECE6EA',
                  background: '#fff',
                  borderRadius: 7,
                  fontSize: 11.5,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setTagAdding(true)} style={{ ...deskButton, height: 28, marginTop: 8 }}>
          + Add tag
        </button>
      )}
      <div style={{ height: 1, background: '#F1EBEE', margin: '14px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={detailsLabel}>Lead</span>
        <button
          type="button"
          onClick={openLeadModal}
          style={{
            border: 'none',
            background: 'none',
            color: '#D0145C',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {selectedConv.lead ? 'Edit' : '+ Create'}
        </button>
      </div>
      {selectedConv.lead && (
        <div style={{ fontSize: 12, color: '#3A3240', marginTop: 6, lineHeight: 1.45 }}>
          {selectedConv.lead.interest}
          {selectedConv.lead.budget ? ` · ₦${Number(selectedConv.lead.budget).toLocaleString()}` : ''}
        </div>
      )}
      <div style={{ height: 1, background: '#F1EBEE', margin: '14px 0' }} />
      <div style={detailsLabel}>Notes</div>
      <textarea
        value={noteDraft}
        onChange={(e) => setNoteDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
          }
        }}
        placeholder="Add a note…"
        rows={3}
        style={{
          width: '100%',
          marginTop: 8,
          border: '1px solid #ECE6EA',
          borderRadius: 8,
          background: '#FAF8F9',
          padding: '8px 10px',
          fontSize: 12,
          fontFamily: FONT,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ fontSize: 10.5, color: '#8A8290', marginTop: 3 }}>Only your team sees notes. Enter to save.</div>
      {(selectedConv.notes ?? [])
        .slice()
        .reverse()
        .map((n) => (
          <div
            key={n.id}
            style={{
              marginTop: 8,
              fontSize: 12,
              background: '#fff',
              border: '1px solid #EFE8EC',
              borderRadius: 8,
              padding: '7px 9px',
              lineHeight: 1.45,
            }}
          >
            {n.text}
            <div
              style={{
                fontSize: 10.5,
                color: '#8A8290',
                marginTop: 2,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {n.by} · {n.time}
              </span>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => deleteNote(n.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#8A8290',
                  display: 'flex',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
    </>
  );
  const detailsPanel = (
    <div
      style={{
        width: detailsWidth,
        flex: `0 0 ${detailsWidth}px`,
        borderLeft: '1px solid #F1EBEE',
        padding: '16px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        fontFamily: FONT,
      }}
    >
      {detailsContent}
    </div>
  );

  const leadModal = leadModalOpen && (
    <>
      <div
        onClick={() => setLeadModalOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1100 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 1101,
          background: '#fff',
          borderRadius: 16,
          width: 420,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}
            >
              <I n="target" s={18} c="#AD1457" />
              {selectedConv.lead ? 'Edit lead' : 'Create lead'}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLeadModalOpen(false)}
              style={{
                width: 30,
                height: 30,
                border: 'none',
                background: 'transparent',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 8,
              }}
            >
              <I n="x" s={16} />
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: '#999', marginBottom: 16 }}>
            For {selectedConv.name} · {CHANNEL_META[selectedConv.channel].label}
          </div>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label
            style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#444' }}
          >
            Product interest
            <input
              value={leadFormInterest}
              onChange={(e) => setLeadFormInterest(e.target.value)}
              placeholder="What they want"
              style={{
                border: '1px solid rgba(0,0,0,.12)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            />
          </label>
          <label
            style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#444' }}
          >
            Budget (optional)
            <input
              value={leadFormBudget}
              onChange={(e) => setLeadFormBudget(e.target.value)}
              placeholder="e.g. their budget"
              style={{
                border: '1px solid rgba(0,0,0,.12)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            />
          </label>
          <label
            style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#444' }}
          >
            Notes (optional)
            <textarea
              value={leadFormNotes}
              onChange={(e) => setLeadFormNotes(e.target.value)}
              placeholder="Anything worth remembering for the follow-up..."
              rows={3}
              style={{
                border: '1px solid rgba(0,0,0,.12)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: 20 }}>
          <button
            type="button"
            onClick={() => setLeadModalOpen(false)}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,.12)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 700,
              color: '#444',
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitLead}
            disabled={!leadFormInterest.trim()}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: leadFormInterest.trim() ? '#AD1457' : '#d9a9bc',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: leadFormInterest.trim() ? 'pointer' : 'default',
              fontFamily: FONT,
            }}
          >
            {selectedConv.lead ? 'Save changes' : 'Create lead'}
          </button>
        </div>
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // MOBILE
  // ═══════════════════════════════════════════════════════════════════════
  const activeQueueLabel = QUEUE_DEFS.find((q) => q.id === selectedQueue)?.label ?? 'All conversations';
  const groupByLabel = groupBy === 'platform' ? 'Platform' : groupBy === 'customer' ? 'Customer' : 'Time';

  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT,
          background: MSG_BG,
          color: '#1a1a1a',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {mobileScreen === 'list' ? (
          <>
            <MessagingHeader
              active="inbox"
              onSelect={(sec) => setSubView(sec)}
              connections={connectionsSummary}
              extra={notificationBell}
              compact
            />
            {/* Quick filters: the design's views, scrolling sideways; everything else is in
                the filter drawer below. */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px 0' }}>
              {[
                ...ownerViews.map((v) => ({
                  key: `o-${v.id}`,
                  label: v.id === 'mine' ? 'Mine' : v.id === 'all' ? 'All' : v.label,
                  count: v.count,
                  active: selectedQueue === 'all' && ownerFilter === v.id,
                  pick: () => {
                    setOwnerFilter(v.id);
                    setSelectedQueue('all');
                  },
                })),
                ...smartViews
                  .filter((q) => q.id !== 'complaints' && q.id !== 'resolved')
                  .map((q) => ({
                    key: `q-${q.id}`,
                    label: q.label,
                    count: q.count,
                    active: q.active,
                    pick: () => {
                      setSelectedQueue(q.id);
                      setOwnerFilter('all');
                    },
                  })),
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.pick}
                  style={{
                    flex: '0 0 auto',
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 999,
                    border: c.active ? 'none' : '1px solid #ECE6EA',
                    background: c.active ? '#E0156B' : '#fff',
                    color: c.active ? '#fff' : '#2A2230',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: FONT,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {c.label} {c.count}
                </button>
              ))}
            </div>

            {/* View toggle + filter summary — no horizontal scroll: queues/grouping live in the
                slide-in drawer below instead of a pill row. */}
            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
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
                  flex: '0 0 auto',
                }}
              >
                {(['list', 'board'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} style={pillStyle(view === v)}>
                    {v === 'list' ? 'List' : 'Board'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  border: '1px solid rgba(0,0,0,.1)',
                  borderRadius: 9,
                  background: '#fff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#444',
                  fontFamily: FONT,
                  cursor: 'pointer',
                }}
              >
                <I n="filter" s={13} c="#AD1457" />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                  }}
                >
                  {searchQuery ? `"${searchQuery}"` : activeQueueLabel}
                  {typeFilter !== 'all' ? ` · ${typeFilter === 'dm' ? 'Messages' : 'Comments'}` : ''}
                  {tagFilter !== 'all' ? ` · #${tagFilter}` : ''}
                  {groupBy !== 'time' ? ` · Grouped by ${groupByLabel}` : ''}
                </span>
                <I n="chevronDown" s={12} c="#999" />
              </button>
              {view === 'list' && (
                <button
                  type="button"
                  onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                  style={{
                    flex: '0 0 auto',
                    border: 'none',
                    background: 'transparent',
                    color: selectMode ? '#AD1457' : '#888',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    padding: '4px 2px',
                  }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              )}
            </div>

            {view === 'list' ? (
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
                {filteredConversations.length === 0 && listEmptyState}
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
                      const selected = selectedIds.has(item.id);
                      const pill = QUEUE_PILL[currentQueueOf(item)];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => (selectMode ? toggleSelectId(item.id) : openConversation(item.id))}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            display: 'flex',
                            gap: 12,
                            padding: '12px',
                            marginBottom: 8,
                            border: '1px solid #F3EAEE',
                            background: '#fff',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontFamily: FONT,
                            position: 'relative',
                          }}
                        >
                          {selectMode && (
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: selected ? 'none' : '1.5px solid rgba(0,0,0,.2)',
                                background: selected ? '#AD1457' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                flex: '0 0 auto',
                              }}
                            >
                              {selected && <I n="check" s={12} c="#fff" />}
                            </span>
                          )}
                          <PlatformBadge
                            platform={item.channel}
                            size={42}
                            initials={item.initials}
                            color={item.avatarColor}
                          />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: '#1B1520',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.starred && (
                                  <Star
                                    size={11}
                                    fill="#F5B301"
                                    color="#F5B301"
                                    style={{ marginRight: 4, verticalAlign: -1 }}
                                  />
                                )}
                                {item.name}
                              </span>
                              <span style={{ fontSize: 11, color: '#8A8290', flex: '0 0 auto' }}>{item.time}</span>
                            </span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: 12,
                                color: openedIds.has(item.id) ? '#8A8290' : '#4B4350',
                                fontWeight: openedIds.has(item.id) ? 400 : 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: 3,
                              }}
                            >
                              {item.excerpt}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 9px',
                                borderRadius: 5,
                                marginTop: 6,
                                background: pill.bg,
                                color: pill.fg,
                              }}
                            >
                              {pill.label}
                            </span>
                          </span>
                          {!openedIds.has(item.id) && (
                            <span
                              style={{
                                position: 'absolute',
                                right: 12,
                                bottom: 16,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#E0155F',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              // Mobile board: columns stacked vertically (never side-by-side — no horizontal
              // scroll), each card gets an explicit "Move to" sheet since HTML5 drag doesn't
              // fire on touch. Same re-triage capability as the desktop drag-and-drop board.
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '4px 12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  minHeight: 0,
                }}
              >
                {BOARD_COLUMNS.map((col) => {
                  const items = conversations.filter((c) => currentQueueOf(c) === col.id);
                  return (
                    <div key={col.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 4px 8px',
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#333' }}>{col.label}</span>
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
                      {items.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#bbb', padding: '0 4px 4px' }}>No conversations</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {items.map((c) => {
                            const ch = CHANNEL_META[c.channel];
                            return (
                              <div
                                key={c.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  border: '1px solid rgba(0,0,0,.08)',
                                  background: '#fff',
                                  borderRadius: 12,
                                  padding: 10,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => openConversation(c.id)}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontFamily: FONT,
                                    padding: 0,
                                  }}
                                >
                                  <div style={{ position: 'relative', flex: '0 0 auto' }}>
                                    <div
                                      style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '50%',
                                        background: c.avatarColor,
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      {c.initials}
                                    </div>
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: -2,
                                        right: -2,
                                        width: 15,
                                        height: 15,
                                        borderRadius: '50%',
                                        background: ch.color,
                                        border: '2px solid #fff',
                                        color: '#fff',
                                        fontSize: 7,
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
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {c.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: '#777',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginTop: 2,
                                      }}
                                    >
                                      {c.excerpt}
                                    </div>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Move ${c.name}'s conversation to another queue`}
                                  onClick={() => setMoveMenuCardId(c.id)}
                                  style={{
                                    flex: '0 0 auto',
                                    width: 34,
                                    height: 34,
                                    borderRadius: 8,
                                    border: '1px solid rgba(0,0,0,.1)',
                                    background: '#fafafa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <I n="more" s={16} c="#666" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {mobileDeskHeader}
            {sourceStrip}
            {agentStrip}
            {messagesView}
            {threadComposer}
            {detailsSheetOpen && (
              <>
                <div
                  onClick={() => setDetailsSheetOpen(false)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000 }}
                />
                <div
                  role="dialog"
                  aria-label="Conversation details"
                  style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxHeight: '82vh',
                    overflowY: 'auto',
                    background: '#fff',
                    borderRadius: '18px 18px 0 0',
                    padding: '10px 18px 28px',
                    zIndex: 1001,
                    fontFamily: FONT,
                  }}
                >
                  <div
                    style={{ width: 40, height: 4, borderRadius: 2, background: '#E3DDE1', margin: '0 auto 12px' }}
                  />
                  {detailsContent}
                </div>
              </>
            )}
          </>
        )}

        {selectMode && mobileScreen === 'list' && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              background: '#fff',
              borderTop: '1px solid rgba(0,0,0,.08)',
              zIndex: 900,
              padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ flex: '0 0 auto', fontSize: 12, color: '#666', fontWeight: 700 }}>
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={bulkMarkResolved}
              style={{
                flex: '0 0 auto',
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.1)',
                background: '#fff',
                fontSize: 12,
                fontWeight: 700,
                color: selectedIds.size === 0 ? '#ccc' : '#2E7D32',
                cursor: selectedIds.size === 0 ? 'default' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Mark resolved
            </button>
          </div>
        )}

        {/* Filter drawer — queues + grouping, replacing what would otherwise be a
            horizontally-scrolling pill row. */}
        {filterDrawerOpen && (
          <>
            <div
              onClick={() => setFilterDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000 }}
            />
            <div
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                width: 280,
                maxWidth: '85vw',
                background: '#fff',
                zIndex: 1001,
                boxShadow: '2px 0 24px rgba(0,0,0,.18)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 16px 8px',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>Filters</span>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFilterDrawerOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    border: 'none',
                    background: 'transparent',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  <I n="x" s={16} />
                </button>
              </div>

              <div style={{ padding: '0 16px 14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f4f4f5',
                    borderRadius: 9,
                    padding: '8px 10px',
                  }}
                >
                  <I n="search" s={14} c="#999" />
                  <input
                    aria-label="Search conversations"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 13,
                      fontFamily: FONT,
                      color: '#333',
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '0 12px 8px' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#999',
                    padding: '0 8px 8px',
                  }}
                >
                  Type
                </div>
                <div style={{ display: 'flex', gap: 6, padding: '0 8px' }}>
                  {(
                    [
                      ['all', 'All'],
                      ['dm', 'Messages'],
                      ['comment', 'Comments'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTypeFilter(id)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: 8,
                        border: typeFilter === id ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                        background: typeFilter === id ? 'rgba(194,24,91,.1)' : '#fff',
                        color: typeFilter === id ? '#AD1457' : '#444',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {allTagsInUse.length > 0 && (
                <div style={{ padding: '0 12px 8px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: '#999',
                      padding: '0 8px 8px',
                    }}
                  >
                    Tag
                  </div>
                  <div style={{ display: 'flex', gap: 6, padding: '0 8px', flexWrap: 'wrap' }}>
                    {['all', ...allTagsInUse].map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTagFilter(id)}
                        style={{
                          flex: '0 0 auto',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: tagFilter === id ? '1px solid #E91E63' : '1px solid rgba(0,0,0,.1)',
                          background: tagFilter === id ? 'rgba(194,24,91,.1)' : '#fff',
                          color: tagFilter === id ? '#AD1457' : '#444',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: FONT,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {id === 'all' ? 'Any tag' : id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ padding: '8px 12px' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#999',
                    padding: '0 8px 8px',
                  }}
                >
                  Queues
                </div>
                {queuePills.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQueue(q.id);
                      setFilterDrawerOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 10px',
                      marginBottom: 2,
                      border: 'none',
                      borderLeft: q.active ? '3px solid #E91E63' : '3px solid transparent',
                      background: q.active ? 'rgba(194,24,91,.1)' : 'transparent',
                      color: q.active ? '#AD1457' : '#333',
                      fontWeight: q.active ? 700 : 500,
                      fontSize: 14,
                      borderRadius: '0 8px 8px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: FONT,
                    }}
                  >
                    <span>{q.label}</span>
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 700 }}>{q.count}</span>
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(0,0,0,.08)', margin: '16px 8px' }} />

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: '#999',
                    padding: '0 8px 8px',
                  }}
                >
                  Group by
                </div>
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
                    onClick={() => {
                      setGroupBy(id);
                      setFilterDrawerOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 10px',
                      marginBottom: 2,
                      border: 'none',
                      borderLeft: groupBy === id ? '3px solid #E91E63' : '3px solid transparent',
                      background: groupBy === id ? 'rgba(194,24,91,.1)' : 'transparent',
                      color: groupBy === id ? '#AD1457' : '#333',
                      fontWeight: groupBy === id ? 700 : 500,
                      fontSize: 14,
                      borderRadius: '0 8px 8px 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: FONT,
                    }}
                  >
                    {label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'rgba(0,0,0,.08)', margin: '16px 8px' }} />

                <button
                  type="button"
                  onClick={() => {
                    setSubView('connections');
                    setFilterDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <I n="share" s={16} c="#888" />
                  Connections
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubView('insights');
                    setFilterDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <I n="chart" s={16} c="#888" />
                  Insights
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubView('voice');
                    setFilterDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <I n="sparkle" s={16} c="#888" />
                  Brand Voice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubView('usage');
                    setFilterDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <I n="chart" s={16} c="#888" />
                  AI Usage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubView('settings');
                    setFilterDrawerOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  <I n="settings" s={16} c="#888" />
                  Inbox Settings
                </button>
              </div>
            </div>
          </>
        )}

        {/* Move-to bottom sheet — mobile board's equivalent of dragging a card to a column */}
        {moveMenuCardId && (
          <>
            <div
              onClick={() => setMoveMenuCardId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000 }}
            />
            <div
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                background: '#fff',
                borderRadius: '16px 16px 0 0',
                zIndex: 1001,
                padding: '8px 14px calc(16px + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -8px 24px rgba(0,0,0,.18)',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(0,0,0,.15)',
                  margin: '8px auto 14px',
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: '#999',
                  padding: '0 6px 6px',
                }}
              >
                Move to
              </div>
              {BOARD_COLUMNS.filter((col) => {
                const conv = conversations.find((c) => c.id === moveMenuCardId);
                return conv ? currentQueueOf(conv) !== col.id : true;
              }).map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    moveCard(moveMenuCardId, col.id);
                    setMoveMenuCardId(null);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '13px 10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#333',
                    fontFamily: FONT,
                    cursor: 'pointer',
                    borderRadius: 8,
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </>
        )}
        {leadModal}
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        fontFamily: FONT,
        background: MSG_BG,
        color: '#1a1a1a',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <MessagingHeader
        active="inbox"
        onSelect={(s) => setSubView(s)}
        connections={connectionsSummary}
        extra={notificationBell}
      />
      <div style={{ height: 14, flex: '0 0 14px' }} />
      {view === 'board' && (
        <div
          style={{
            height: 48,
            flex: '0 0 48px',
            margin: '0 28px 12px',
            background: '#fff',
            border: '1px solid #F4E9EE',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
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
          <div style={{ fontSize: 12, color: '#999' }}>Drag a card between columns to re-triage it</div>
        </div>
      )}

      {view === 'list' ? (
        <div
          ref={deskRef}
          style={{ flex: '1 0 auto', height: 0, minHeight: 440, display: 'flex', padding: '0 24px 16px' }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              position: 'relative',
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #F4E9EE',
              boxShadow: '0 1px 3px rgba(80,20,50,.05)',
              overflow: 'hidden',
            }}
          >
            {/* filters */}
            {showFilters && (
              <div
                style={{
                  width: 188,
                  flex: '0 0 188px',
                  borderRight: '1px solid #F1EBEE',
                  padding: '18px 0',
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {ownerViews.map((v) => (
                  <NavRow
                    key={v.id}
                    label={v.label}
                    count={v.count}
                    active={selectedQueue === 'all' && ownerFilter === v.id}
                    onClick={() => {
                      setOwnerFilter(v.id);
                      setSelectedQueue('all');
                    }}
                  />
                ))}
                <div style={{ height: 1, background: '#EFE9EC', margin: '12px 20px' }} />
                <button
                  type="button"
                  onClick={() => setSmartOpen((o) => !o)}
                  style={{
                    width: 'calc(100% - 16px)',
                    margin: '0 8px 4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: '#2A2230',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Smart views
                  <ChevronDown size={15} style={{ transform: smartOpen ? undefined : 'rotate(-90deg)' }} />
                </button>
                {smartOpen &&
                  smartViews.map((q) => (
                    <NavRow
                      key={q.id}
                      label={
                        q.id === 'unanswered' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E0155F' }} />
                            {q.label}
                          </span>
                        ) : (
                          q.label
                        )
                      }
                      count={q.count}
                      active={q.active}
                      onClick={() => {
                        setSelectedQueue(q.id);
                        setOwnerFilter('all');
                      }}
                    />
                  ))}
              </div>
            )}

            {/* conversation list */}
            {chatExpanded && listOverlayOpen && (
              <div
                onClick={() => setListOverlayOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,15,.18)', zIndex: 29 }}
              />
            )}
            <div
              style={{
                width: 290,
                flex: '0 0 290px',
                borderRight: '1px solid #F1EBEE',
                display: chatExpanded && !listOverlayOpen ? 'none' : 'flex',
                flexDirection: 'column',
                minHeight: 0,
                ...(chatExpanded
                  ? {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      zIndex: 30,
                      background: '#fff',
                      boxShadow: '8px 0 24px rgba(20,10,15,.12)',
                    }
                  : {}),
              }}
            >
              {!showFilters && (
                <div style={{ padding: '12px 12px 0' }}>
                  <select
                    aria-label="View"
                    value={selectedQueue === 'all' ? `o:${ownerFilter}` : `q:${selectedQueue}`}
                    onChange={(e) => {
                      const [kind, id] = e.target.value.split(':');
                      if (kind === 'o') {
                        setOwnerFilter(id as OwnerFilter);
                        setSelectedQueue('all');
                      } else {
                        setSelectedQueue(id as QueueFilter);
                        setOwnerFilter('all');
                      }
                    }}
                    style={{ ...deskSelect, width: '100%' }}
                  >
                    {ownerViews.map((v) => (
                      <option key={v.id} value={`o:${v.id}`}>
                        {v.label} ({v.count})
                      </option>
                    ))}
                    {smartViews.map((q) => (
                      <option key={q.id} value={`q:${q.id}`}>
                        {q.label} ({q.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 10px' }}>
                <select
                  aria-label="Platform"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as 'all' | ChannelKey)}
                  style={deskSelect}
                >
                  <option value="all">All platforms</option>
                  {(['instagram', 'facebook', 'whatsapp', 'tiktok'] as const)
                    .filter((ch) => conversations.some((c) => c.channel === ch))
                    .map((ch) => (
                      <option key={ch} value={ch}>
                        {CHANNEL_META[ch].label}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewestFirst((n) => !n)}
                  style={{ ...deskButton, gap: 6 }}
                  aria-label="Sort order"
                >
                  {newestFirst ? 'Newest' : 'Oldest'}
                  <ListFilter size={15} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    aria-label="More filters"
                    onClick={() => setTypeFilterMenuOpen((o) => !o)}
                    style={{
                      ...deskButton,
                      width: 34,
                      padding: 0,
                      borderColor: hasExtraFilters || searchQuery ? '#E0156B' : '#ECE6EA',
                      color: hasExtraFilters || searchQuery ? '#E0156B' : '#2A2230',
                    }}
                  >
                    <Filter size={15} />
                  </button>
                  {typeFilterMenuOpen && (
                    <>
                      <div
                        onClick={() => setTypeFilterMenuOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '110%',
                          right: 0,
                          zIndex: 999,
                          background: '#fff',
                          borderRadius: 12,
                          boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                          border: '1px solid rgba(0,0,0,.06)',
                          width: 240,
                          maxHeight: '70vh',
                          overflowY: 'auto',
                          padding: 10,
                        }}
                      >
                        <input
                          aria-label="Search conversations"
                          placeholder="Search names or messages"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            height: 32,
                            border: '1px solid #ECE6EA',
                            borderRadius: 8,
                            padding: '0 10px',
                            fontSize: 12.5,
                            fontFamily: FONT,
                            boxSizing: 'border-box',
                          }}
                        />
                        <div style={deskMenuLabel}>Type</div>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as 'all' | ConversationType)}
                          style={{ ...deskSelect, width: '100%' }}
                        >
                          <option value="all">All types</option>
                          <option value="dm">Messages only</option>
                          <option value="comment">Comments only</option>
                        </select>
                        {allTagsInUse.length > 0 && (
                          <>
                            <div style={deskMenuLabel}>Tag</div>
                            <select
                              value={tagFilter}
                              onChange={(e) => setTagFilter(e.target.value)}
                              style={{ ...deskSelect, width: '100%' }}
                            >
                              <option value="all">All tags</option>
                              {allTagsInUse.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        <div style={deskMenuLabel}>Group by</div>
                        <select
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value as GroupMode)}
                          style={{ ...deskSelect, width: '100%' }}
                        >
                          <option value="time">Time</option>
                          <option value="platform">Platform</option>
                          <option value="customer">Customer</option>
                        </select>
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setView('board');
                              setTypeFilterMenuOpen(false);
                            }}
                            style={{ ...deskButton, flex: 1 }}
                          >
                            Board view
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectMode) exitSelectMode();
                              else setSelectMode(true);
                              setTypeFilterMenuOpen(false);
                            }}
                            style={{ ...deskButton, flex: 1 }}
                          >
                            {selectMode ? 'Stop selecting' : 'Select'}
                          </button>
                        </div>
                        {(hasExtraFilters || searchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              setTypeFilter('all');
                              setTagFilter('all');
                              setSearchQuery('');
                            }}
                            style={{
                              marginTop: 8,
                              border: 'none',
                              background: 'none',
                              color: '#D0145C',
                              fontWeight: 600,
                              fontSize: 12.5,
                              cursor: 'pointer',
                              fontFamily: FONT,
                            }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {selectMode && (
                <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{selectedIds.size} selected</span>
                  <button
                    type="button"
                    disabled={selectedIds.size === 0}
                    onClick={bulkMarkResolved}
                    style={{ ...deskButton, height: 28 }}
                  >
                    Mark as done
                  </button>
                  <button type="button" onClick={exitSelectMode} style={{ ...deskButton, height: 28 }}>
                    Cancel
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 12px' }}>
                {filteredConversations.length === 0 && listEmptyState}
                {groups.map((grp) => (
                  <div key={grp.key}>
                    {grp.label && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 4px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: grp.dotColor }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#8A8290',
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                          }}
                        >
                          {grp.label}
                        </span>
                        <span style={{ fontSize: 10.5, color: '#aaa' }}>({grp.items.length})</span>
                      </div>
                    )}
                    {grp.items.map((item) => {
                      const selected = selectedId === item.id;
                      const pill = QUEUE_PILL[currentQueueOf(item)];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => (selectMode ? toggleSelectId(item.id) : openConversation(item.id))}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            display: 'flex',
                            gap: 12,
                            padding: '10px 10px 10px 9px',
                            border: 'none',
                            borderLeft: selected ? '3px solid #D81B60' : '3px solid transparent',
                            borderBottom: selected ? 'none' : '1px solid #F3EEF1',
                            background: selected ? '#FDEEF4' : '#fff',
                            borderRadius: selected ? 8 : 0,
                            cursor: 'pointer',
                            fontFamily: FONT,
                            position: 'relative',
                          }}
                        >
                          {selectMode && (
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 5,
                                border: selectedIds.has(item.id) ? 'none' : '1.5px solid rgba(0,0,0,.2)',
                                background: selectedIds.has(item.id) ? '#AD1457' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                flex: '0 0 auto',
                              }}
                            >
                              {selectedIds.has(item.id) && <I n="check" s={12} c="#fff" />}
                            </span>
                          )}
                          <PlatformBadge
                            platform={item.channel}
                            size={40}
                            initials={item.initials}
                            color={item.avatarColor}
                          />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: '#1B1520',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.starred && (
                                  <Star
                                    size={11}
                                    fill="#F5B301"
                                    color="#F5B301"
                                    style={{ marginRight: 4, verticalAlign: -1 }}
                                  />
                                )}
                                {item.name}
                              </span>
                              <span style={{ fontSize: 11, color: '#8A8290', flex: '0 0 auto' }}>{item.time}</span>
                            </span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: 11.5,
                                color: openedIds.has(item.id) ? '#8A8290' : '#4B4350',
                                fontWeight: openedIds.has(item.id) ? 400 : 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: 3,
                              }}
                            >
                              {item.excerpt}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 9px',
                                borderRadius: 5,
                                marginTop: 6,
                                background: pill.bg,
                                color: pill.fg,
                              }}
                            >
                              {pill.label}
                            </span>
                          </span>
                          {!openedIds.has(item.id) && (
                            <span
                              style={{
                                position: 'absolute',
                                right: 12,
                                bottom: 16,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#E0155F',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* chat + details: the header runs across both, as in the design */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
              {deskHeader}
              <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
                  {sourceStrip}
                  {agentStrip}
                  {messagesView}
                  {threadComposer}
                </div>
                {showDetails && detailsPanel}
                {!showDetails && detailsOverlayOpen && (
                  <>
                    <div
                      onClick={() => setDetailsOverlayOpen(false)}
                      style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,15,.18)', zIndex: 20 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: 260,
                        background: '#fff',
                        boxShadow: '-8px 0 24px rgba(20,10,15,.12)',
                        padding: '16px',
                        overflowY: 'auto',
                        zIndex: 21,
                        fontFamily: FONT,
                        boxSizing: 'border-box',
                      }}
                    >
                      {detailsContent}
                    </div>
                  </>
                )}
              </div>
            </div>
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
                  // dataTransfer, not the draggingId state closure, is the source of
                  // truth here — a dragstart's setState may not have re-rendered this
                  // handler's closure yet by the time drop fires on a fast drag.
                  const id = e.dataTransfer.getData('text/plain') || draggingId;
                  moveCard(id, col.id);
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
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', c.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingId(c.id);
                        }}
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
      {leadModal}
    </div>
  );
}
