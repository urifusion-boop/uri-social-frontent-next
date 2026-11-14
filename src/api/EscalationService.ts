/**
 * Escalation Service
 * API calls for customer-care replies to Jane-on-WhatsApp escalated conversations
 */

import { UriHttpClient } from '@/src/configs/http.config';

export interface EscalationConversation {
  id: string;
  brand_id?: string;
  state: 'jane_handling' | 'escalated' | 'closed';
  escalated_reason?: string;
  escalated_at?: number;
  last_message_at?: number;
  created_at?: number;
  resolved_via?: string;
  resolved_by?: string;
}

export interface EscalationMessage {
  role: 'customer' | 'jane' | 'agent';
  channel?: 'dashboard' | 'email' | 'whatsapp_echo';
  agent_email?: string | null;
  body: string;
  confidence?: number | null;
  created_at?: string;
}

export interface EscalationDetail extends EscalationConversation {
  messages: EscalationMessage[];
}

export interface EscalationListResponse {
  conversations: EscalationConversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface EscalationActionResponse {
  status: string;
  conversation_id: string;
  state: string;
}

export class EscalationService {
  /**
   * List escalated (or any-state) conversations, paginated.
   */
  static async getEscalations(params: {
    state?: string;
    brand_id?: string;
    page?: number;
    limit?: number;
  }): Promise<EscalationListResponse> {
    const queryParams = new URLSearchParams();
    if (params.state) queryParams.append('state', params.state);
    if (params.brand_id) queryParams.append('brand_id', params.brand_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await UriHttpClient.getClient().get(`/api/support/escalations?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * A single conversation's state plus its full decrypted message history.
   */
  static async getEscalationDetail(conversationId: string): Promise<EscalationDetail> {
    const response = await UriHttpClient.getClient().get(`/api/support/escalations/${conversationId}`);
    return response.data;
  }

  /**
   * Reply to the customer on this conversation — sends via WhatsApp, logs the
   * message, and resolves the conversation. idempotencyKey must be a fresh
   * value per user-initiated send (crypto.randomUUID()) so a retried request
   * (network blip, double-click) can never double-send to the customer.
   */
  static async sendReply(
    conversationId: string,
    text: string,
    idempotencyKey: string
  ): Promise<EscalationActionResponse> {
    const response = await UriHttpClient.getClient().post(`/api/support/escalations/${conversationId}/reply`, {
      text,
      idempotency_key: idempotencyKey,
    });
    return response.data;
  }

  /**
   * Resolve without sending a message — for out-of-band resolutions (a phone
   * call, in person). Not the way to resolve a WhatsApp-phone-app reply, which
   * self-resolves once Meta's message-echo webhook is wired up.
   */
  static async resolveEscalation(conversationId: string): Promise<EscalationActionResponse> {
    const response = await UriHttpClient.getClient().post(`/api/support/escalations/${conversationId}/resolve`);
    return response.data;
  }
}
