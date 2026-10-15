import { UriHttpClient } from '@/src/configs/http.config';

// The inbox endpoints return plain JSON (not the UriResponse envelope). Auth and
// X-Brand-Id are attached automatically by the UriHttpClient request interceptor.

export interface InboxConversationDTO {
  id: string;
  platform: string;
  kind: 'dm' | 'comment';
  status: string;
  assignee_id: string;
  tags: string[];
  last_activity_at: string | null;
  contact_name: string;
  excerpt: string;
  source_post_id: string;
  source_ad_id: string;
  last_direction?: 'inbound' | 'outbound' | '';
  intent?: string;
  intent_confidence?: number | null;
  intent_rationale?: string;
  intent_corrected?: boolean;
  urgency?: string;
  sentiment?: string;
  language?: string;
  exclusions?: string[];
  priority?: string;
  needs_human?: boolean;
  handoff_reason?: string;
  ai_suggestion?: InboxSuggestionDTO | null;
  emotion?: string;
  situation?: string;
  situation_label?: string;
  voice_name?: string;
}

export interface InboxSuggestionDTO {
  id: string;
  text: string;
  confidence: number;
  sources: { id: string; label: string; approved: boolean }[];
  unverified: string[];
  unanswered: boolean;
}

export type InboxAgentView = Pick<
  InboxConversationDTO,
  | 'intent'
  | 'intent_confidence'
  | 'intent_rationale'
  | 'intent_corrected'
  | 'urgency'
  | 'sentiment'
  | 'language'
  | 'exclusions'
  | 'priority'
  | 'needs_human'
  | 'handoff_reason'
  | 'ai_suggestion'
  | 'emotion'
  | 'situation'
  | 'situation_label'
  | 'voice_name'
>;

export interface InboxAgentSettings {
  auto_reply_enabled: boolean;
  confidence_threshold: number;
  auto_reply_channels: { dm: boolean; comment: boolean };
  business_hours: { timezone: string; days: Record<string, boolean>; open: string; close: string };
}

export interface InboxKnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  approved: boolean;
}

export interface InboxMessageDTO {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  attachments: unknown[];
  delivery: string;
  by_agent?: boolean;
  provider_timestamp: string | null;
  received_at: string | null;
}

export interface SendReplyResult {
  delivery: string;
  provider_message_id: string;
  failure_reason: string;
}

const listConversations = async (params?: {
  channel?: string;
  status?: string;
  limit?: number;
}): Promise<InboxConversationDTO[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/conversations', { params });
  return r.data?.conversations ?? [];
};

const listMessages = async (conversationId: string): Promise<InboxMessageDTO[]> => {
  const r = await UriHttpClient.getClient().get(`/inbox/conversations/${conversationId}/messages`);
  return r.data?.messages ?? [];
};

// idempotencyKey is generated per composer submission, not per retry, so a
// double-clicked Send or a retried request sends once.
// suggestionId marks a reply that started from the agent's draft, so URI can tell
// a draft sent as-is from one an agent rewrote.
const sendReply = async (
  conversationId: string,
  text: string,
  idempotencyKey: string,
  suggestionId = ''
): Promise<SendReplyResult> => {
  const r = await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/reply`, {
    text,
    idempotency_key: idempotencyKey,
    suggestion_id: suggestionId,
  });
  return r.data;
};

const regenerateSuggestion = async (conversationId: string): Promise<InboxAgentView> => {
  const r = await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/suggestion`, {});
  return r.data;
};

const correctClassification = async (
  conversationId: string,
  intent: string,
  urgency?: string
): Promise<InboxAgentView> => {
  const r = await UriHttpClient.getClient().patch(`/inbox/conversations/${conversationId}/classification`, {
    intent,
    urgency,
  });
  return r.data;
};

const getAgentSettings = async (): Promise<InboxAgentSettings> => {
  const r = await UriHttpClient.getClient().get('/inbox/agent/settings');
  return r.data.settings;
};

const saveAgentSettings = async (settings: InboxAgentSettings): Promise<InboxAgentSettings> => {
  const r = await UriHttpClient.getClient().put('/inbox/agent/settings', settings);
  return r.data.settings;
};

const listKnowledge = async (): Promise<InboxKnowledgeEntry[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/knowledge');
  return r.data?.entries ?? [];
};

const createKnowledge = async (entry: Omit<InboxKnowledgeEntry, 'id'>): Promise<string> => {
  const r = await UriHttpClient.getClient().post('/inbox/knowledge', entry);
  return r.data.id;
};

const updateKnowledge = async (entry: InboxKnowledgeEntry): Promise<void> => {
  await UriHttpClient.getClient().put(`/inbox/knowledge/${entry.id}`, {
    question: entry.question,
    answer: entry.answer,
    approved: entry.approved,
  });
};

const deleteKnowledge = async (id: string): Promise<void> => {
  await UriHttpClient.getClient().delete(`/inbox/knowledge/${id}`);
};

export interface InboxChannelDTO {
  platform: string;
  name: string;
  external_account_id: string;
  page_id: string;
  connected_at: string | null;
  updated_at: string | null;
  has_token: boolean;
  last_event_at: string | null;
}

const listChannels = async (): Promise<InboxChannelDTO[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/channels');
  return r.data?.channels ?? [];
};

const linkChannels = async (): Promise<{ linked: number }> => {
  const r = await UriHttpClient.getClient().post('/inbox/channels/link', {});
  return r.data;
};

export const InboxService = {
  listConversations,
  listMessages,
  sendReply,
  regenerateSuggestion,
  correctClassification,
  getAgentSettings,
  saveAgentSettings,
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  linkChannels,
  listChannels,
};
