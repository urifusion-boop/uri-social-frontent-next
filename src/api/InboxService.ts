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
  lead_stage?: string;
  lead_value?: number | null;
  lead_interest?: string;
  starred?: boolean;
  notes_count?: number;
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

export interface InboxFixedReply {
  enabled: boolean;
  text: string;
}

export interface InboxAgentSettings {
  auto_reply_enabled: boolean;
  confidence_threshold: number;
  auto_reply_channels: { dm: boolean; comment: boolean };
  business_hours: {
    timezone: string;
    days: Record<string, boolean>;
    open: string;
    close: string;
    /** a day's own hours, when different from open/close */
    day_hours?: Record<string, { open: string; close: string }>;
  };
  alert_emails: string[];
  /** sent once when a DM arrives outside business hours */
  away_message?: InboxFixedReply;
  /** sent once on the first message from someone who came from an ad */
  ad_lead_welcome?: InboxFixedReply;
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
// Let URI auto-reply in this conversation again after a team member had taken it over.
const handBack = async (conversationId: string): Promise<void> => {
  await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/hand-back`, {});
};

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

export type AutomationRuleKind = 'comment' | 'dm' | 'comment_to_dm';

export interface AutomationRule {
  id: string;
  kind: AutomationRuleKind;
  name: string;
  enabled: boolean;
  match: { keywords: string[]; examples: string[]; any: boolean };
  public_reply: string;
  dm: string;
  ad_ids: string[];
  platforms: string[];
  fired_count: number;
  last_fired_at: string | null;
}

export type AutomationRuleInput = Pick<
  AutomationRule,
  'kind' | 'name' | 'enabled' | 'match' | 'public_reply' | 'dm' | 'ad_ids' | 'platforms'
>;

export interface RuleAdCampaign {
  id: string;
  name: string;
  ad_ids: string[];
}

const listRules = async (): Promise<AutomationRule[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/rules');
  return r.data.rules;
};

const listRuleAds = async (): Promise<RuleAdCampaign[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/rules/ads');
  return r.data.campaigns;
};

const createRule = async (rule: AutomationRuleInput): Promise<AutomationRule> => {
  const r = await UriHttpClient.getClient().post('/inbox/rules', rule);
  return r.data.rule;
};

const updateRule = async (id: string, rule: Partial<AutomationRuleInput>): Promise<AutomationRule> => {
  const r = await UriHttpClient.getClient().put(`/inbox/rules/${id}`, rule);
  return r.data.rule;
};

const deleteRule = async (id: string): Promise<void> => {
  await UriHttpClient.getClient().delete(`/inbox/rules/${id}`);
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
  needs_reconnect?: boolean;
  subscription_ok?: boolean | null;
  subscription_issue?: { code: string; message: string } | null;
}

const listChannels = async (): Promise<InboxChannelDTO[]> => {
  const r = await UriHttpClient.getClient().get('/inbox/channels');
  return r.data?.channels ?? [];
};

const resubscribeChannels = async (): Promise<{
  subscriptions: { page_id: string; subscribed: boolean; issue: { code: string; message: string } | null }[];
}> => {
  const r = await UriHttpClient.getClient().post('/inbox/channels/resubscribe', {});
  return r.data;
};

const beginReplace = async (platform: 'instagram' | 'facebook'): Promise<{ replacing: string[] }> => {
  const r = await UriHttpClient.getClient().post('/inbox/channels/replace/begin', { platform });
  return r.data;
};

const finishReplace = async (platform: 'instagram' | 'facebook'): Promise<{ replaced: string[] }> => {
  const r = await UriHttpClient.getClient().post('/inbox/channels/replace/finish', { platform });
  return r.data;
};

const linkChannels = async (): Promise<{ linked: number }> => {
  const r = await UriHttpClient.getClient().post('/inbox/channels/link', {});
  return r.data;
};

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  body: string;
  variables: number;
}

const whatsappConfig = async (): Promise<{
  app_id: string;
  config_id: string;
  graph_version: string;
  available: boolean;
}> => (await UriHttpClient.getClient().get('/inbox/whatsapp/config')).data;

const connectWhatsApp = async (
  body: Record<string, unknown>
): Promise<{ connected: { name: string; display_phone_number: string } }> =>
  (await UriHttpClient.getClient().post('/inbox/whatsapp/connect', body)).data;

const whatsappTemplates = async (conversationId: string): Promise<WhatsAppTemplate[]> =>
  (await UriHttpClient.getClient().get(`/inbox/conversations/${conversationId}/whatsapp-templates`)).data?.templates ??
  [];

const sendWhatsAppTemplate = async (
  conversationId: string,
  name: string,
  language: string,
  params: string[]
): Promise<{ delivery: string; failure_reason: string }> =>
  (
    await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/whatsapp-template`, {
      name,
      language,
      params,
    })
  ).data;

export interface OneboxUsage {
  plan_id: string;
  plan_name: string;
  status: 'trial' | 'active' | 'expired';
  allowance: number;
  used: number;
  remaining: number;
  percent_used: number;
  period_start: string;
  period_end: string;
  warning: boolean;
  exhausted: boolean;
  message_cap: number;
  queued_plan: string | null;
  conversations: number;
  at_message_cap: number;
  median_messages: number;
  average_messages: number;
}

export interface OneboxPlan {
  plan_id: string;
  name: string;
  price_ngn: number;
  conversations: number;
}

const oneboxUsage = async (): Promise<{ usage: OneboxUsage; plans: OneboxPlan[]; can_manage: boolean }> =>
  (await UriHttpClient.getClient().get('/inbox/onebox/usage')).data;

const oneboxSubscribe = async (planId: string): Promise<{ payment_url: string; transaction_ref: string }> =>
  (await UriHttpClient.getClient().post('/inbox/onebox/subscribe', { plan_id: planId })).data;

// ── Desk: what the team does to a conversation (saved per brand) ────────────
export type DeskStatus = 'open' | 'pending' | 'resolved';
export type LeadStage = '' | 'new' | 'qualified' | 'won' | 'lost';

export interface DeskView {
  status: DeskStatus;
  assignee_id: string;
  starred: boolean;
  tags: string[];
  lead_stage: LeadStage;
  lead_value: number | null;
  lead_interest: string;
  notes_count: number;
}

export interface DeskNote {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  at: string;
}

export type DeskChange = Partial<
  Pick<DeskView, 'status' | 'assignee_id' | 'starred' | 'tags' | 'lead_stage' | 'lead_interest'> & {
    lead_value: number | string | null;
  }
>;

export type QuickReplyButtonKind = 'link' | 'book' | 'buy' | 'learn_more';
export interface QuickReplyButton {
  label: string;
  kind: QuickReplyButtonKind;
  url: string;
}
export interface QuickReply {
  id: string;
  title: string;
  text: string;
  shortcut: string;
  category: string;
  buttons: QuickReplyButton[];
  uses: number;
}
export interface DeskPrefs {
  quick_replies: QuickReply[];
  categories: string[];
  tag_presets: string[];
}

export interface AudiencePerson {
  contact_id: string;
  platform: string;
  name: string;
  avatar_url: string;
  conversations: number;
  conversation_ids: string[];
  last_activity_at: string | null;
  first_seen_at: string | null;
  tags: string[];
  stage: 'contact' | 'lead' | 'customer';
  lead_value: number | null;
  from_ad: boolean;
  source: string;
  status: string;
  needs_follow_up: boolean;
}
export type AudienceSegment = 'all' | 'new' | 'leads' | 'customers' | 'ads' | 'follow_up';
export interface AudienceResult {
  people: AudiencePerson[];
  counts: Record<AudienceSegment, number>;
  channels: Record<string, number>;
}
export interface TeamMember {
  user_id: string;
  name: string;
  is_me: boolean;
}

const getDesk = async (conversationId: string): Promise<DeskView & { notes: DeskNote[] }> =>
  (await UriHttpClient.getClient().get(`/inbox/conversations/${conversationId}/desk`)).data;
const updateDesk = async (conversationId: string, change: DeskChange): Promise<DeskView> =>
  (await UriHttpClient.getClient().patch(`/inbox/conversations/${conversationId}/desk`, change)).data;
const addNote = async (conversationId: string, text: string): Promise<DeskNote> =>
  (await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/notes`, { text })).data;
const deleteNote = async (conversationId: string, noteId: string): Promise<void> => {
  await UriHttpClient.getClient().delete(`/inbox/conversations/${conversationId}/notes/${noteId}`);
};
const getDeskPrefs = async (): Promise<DeskPrefs> => (await UriHttpClient.getClient().get('/inbox/desk/prefs')).data;
const saveDeskPrefs = async (change: Partial<DeskPrefs>): Promise<DeskPrefs> =>
  (await UriHttpClient.getClient().put('/inbox/desk/prefs', change)).data;
const quickReplyUsed = async (replyId: string): Promise<void> => {
  await UriHttpClient.getClient().post(`/inbox/desk/prefs/quick-replies/${replyId}/used`);
};
const listAudience = async (params: {
  segment?: AudienceSegment;
  q?: string;
  channel?: string;
}): Promise<AudienceResult> => (await UriHttpClient.getClient().get('/inbox/audience', { params })).data;
const listTeam = async (): Promise<TeamMember[]> =>
  (await UriHttpClient.getClient().get('/inbox/team')).data?.members ?? [];

export const InboxService = {
  getDesk,
  updateDesk,
  addNote,
  deleteNote,
  getDeskPrefs,
  saveDeskPrefs,
  quickReplyUsed,
  listAudience,
  listTeam,
  oneboxUsage,
  oneboxSubscribe,
  whatsappConfig,
  connectWhatsApp,
  whatsappTemplates,
  sendWhatsAppTemplate,
  listConversations,
  listMessages,
  sendReply,
  handBack,
  regenerateSuggestion,
  correctClassification,
  listRules,
  listRuleAds,
  createRule,
  updateRule,
  deleteRule,
  getAgentSettings,
  saveAgentSettings,
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  beginReplace,
  finishReplace,
  linkChannels,
  listChannels,
  resubscribeChannels,
};
