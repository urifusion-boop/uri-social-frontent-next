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
}

export interface InboxMessageDTO {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  attachments: unknown[];
  delivery: string;
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
const sendReply = async (conversationId: string, text: string, idempotencyKey: string): Promise<SendReplyResult> => {
  const r = await UriHttpClient.getClient().post(`/inbox/conversations/${conversationId}/reply`, {
    text,
    idempotency_key: idempotencyKey,
  });
  return r.data;
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
  linkChannels,
  listChannels,
};
