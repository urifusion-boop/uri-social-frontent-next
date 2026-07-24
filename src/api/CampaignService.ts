import { UriHttpClient } from '@/src/configs/http.config';

// The jane-ads endpoints return plain JSON (not the UriResponse envelope), so these
// methods return the raw response bodies. Auth + X-Brand-Id are attached automatically
// by the UriHttpClient request interceptor.

export interface UnderstoodFields {
  business_name?: string;
  category?: string;
  goal?: string;
  budget_ngn?: number | null;
  city?: string;
  stated_behaviour?: string | null;
  missing?: string[];
  clarify?: string;
}

export interface CampaignPlatform {
  platform: string;
  budget_ngn: number;
  days: number;
  variants: number;
  test_scope: string;
}

export interface LaunchFromMessageResult {
  stage: 'need_more' | 'advise' | 'planned' | 'launched';
  plan_id?: string;                     // present when stage === 'planned' — pass to launchPlan()
  understood?: UnderstoodFields;
  question?: string;
  advice?: { reason: string; suggested_min_ngn?: number };
  jane_recommended_platforms?: string[];
  forced_to_meta?: boolean;
  plan?: {
    goal: string;
    behaviour: string;
    explanation: string;
    platforms: CampaignPlatform[];
    geo?: { pins?: { name: string; reason?: string }[]; explanation?: string } | null;
    trace?: string[];
  };
  creative?: {
    image_url: string;
    headline: string;
    primary_text: string;
    cta: string;
    is_video?: boolean;
  };
  wallet?: {
    balance_ngn: number;
    budget_ngn: number;              // the ad spend that goes to Meta
    service_fee_ngn?: number;        // URI's markup
    total_due_ngn?: number;          // budget + fee — what the wallet must cover
    sufficient: boolean;
  };
  launch?: {
    campaign_id: string;
    status: string;
    note: string;
    ads_manager_url: string;
  };
}

export interface CampaignMetrics {
  spend_ngn: number;
  conversations: number;
  cost_per_conversation_ngn: number | null;
  impressions: number;
  reach: number;
  delivery: string;
  ends_at: string | null;
}

export interface CampaignRow {
  campaign_id: string;
  name: string;
  headline: string;
  primary_text: string;
  image_url: string;
  budget_ngn: number | null;
  goal: string;
  city: string;
  status: string;
  created_at: string | null;
  ads_manager_url: string;
  metrics: CampaignMetrics | null;
}

export interface DraftSummary {
  draft_id: string;
  platform: string;
  content: string;
  image_url: string;
  created_at: string;
}

export type CreativeSource = 'generate' | 'upload' | 'draft';

export interface BillingRow {
  business_id: string;
  label?: string;              // owning account email, best-effort
  campaigns: number;
  charges: number;
  real_spend_ngn: number;      // what Meta actually charged us
  billed_ngn: number;          // what we charged the customer's wallet
  margin_ngn: number;          // our service fee earned
}

export interface BillingSummary {
  from_date: string | null;
  to_date: string | null;
  per_user: BillingRow[];
  totals: { real_spend_ngn: number; billed_ngn: number; margin_ngn: number; charges: number; users: number };
}

export interface WalletTransaction {
  transaction_id: string;
  type: 'topup' | 'ad_spend' | 'conversation_charge' | 'refund' | 'adjustment';
  amount_ngn: number;          // signed: + credit, − debit
  balance_after_ngn: number;
  reference: string;
  campaign_id: string;
  created_at: string;
}

export interface WalletInfo {
  balance_ngn: number;
  currency: string;
  min_topup_ngn: number;
  transactions: WalletTransaction[];
}

export interface SavedChatMessage {
  message_id: string;
  role: 'user' | 'jane';
  kind: 'text' | 'result';
  text: string;
  result: LaunchFromMessageResult | null;
  created_at: string;
  updated_at: string;
}

export class CampaignService {
  /** Conversational planning: Jane parses a plain-English message and returns her plan
   * (or asks a follow-up). Does NOT create anything — used for the chat preview. */
  static async understand(message: string, businessName = '', category = '') {
    const res = await UriHttpClient.getClient().post('/jane-ads/understand', {
      message,
      business_name: businessName,
      category,
    });
    return res.data as {
      decision?: string;
      understood?: UnderstoodFields;
      question?: string;
      explanation?: string;
      behaviour?: string;
      platforms?: CampaignPlatform[];
      geo?: { pins?: { name: string }[] } | null;
    };
  }

  /** The full one-shot: message -> plan -> creative (generated, uploaded, or drafted) -> real (PAUSED) campaign,
   * all in a single call. Superseded by planFromMessage()+launchPlan() below for the chat UI (plan-then-launch,
   * reviewable before anything touches Meta) — kept for any caller that genuinely wants one-shot behavior. */
  static async launchFromMessage(payload: {
    message: string;
    business_name?: string;
    category?: string;
    creative_source?: CreativeSource;
    reference_image_url?: string;
    is_video?: boolean;
    draft_id?: string;
  }): Promise<LaunchFromMessageResult> {
    // NL parse + geo lookup + creative generation + the real Meta API calls have been
    // observed taking 90-130s end to end — past the client's global 120s default,
    // which was cutting off successful requests mid-flight. Give this one call room.
    const res = await UriHttpClient.getClient().post('/jane-ads/meta/launch-from-message', payload, { timeout: 240000 });
    return res.data as LaunchFromMessageResult;
  }

  /** Plan-before-launch, step 1: Jane understands the message, decides the platform,
   * and generates the creative — nothing touches Meta yet. Returns a reviewable plan
   * (plan_id) that can be launched later via launchPlan(), or just left alone —
   * nothing is lost if the user never confirms it. */
  static async planFromMessage(payload: {
    message: string;
    business_name?: string;
    category?: string;
    creative_source?: CreativeSource;
    reference_image_url?: string;
    is_video?: boolean;
    draft_id?: string;
  }): Promise<LaunchFromMessageResult> {
    const res = await UriHttpClient.getClient().post('/jane-ads/meta/plan-from-message', payload, { timeout: 240000 });
    return res.data as LaunchFromMessageResult;
  }

  /** Plan-before-launch, step 2 — the only call that actually creates a real (paused) Meta campaign. */
  static async launchPlan(planId: string): Promise<LaunchFromMessageResult> {
    const res = await UriHttpClient.getClient().post(`/jane-ads/meta/plan/${planId}/launch`, {}, { timeout: 120000 });
    return res.data as LaunchFromMessageResult;
  }

  /** The active brand's campaigns + live metrics, for the management view. */
  static async listCampaigns(): Promise<{ campaigns: CampaignRow[] }> {
    const res = await UriHttpClient.getClient().get('/jane-ads/meta/campaigns');
    return res.data as { campaigns: CampaignRow[] };
  }

  /** Upload the user's own photo or video to use as the campaign media. */
  static async uploadMedia(file: File): Promise<{ url: string; is_video: boolean }> {
    const form = new FormData();
    form.append('file', file);
    const res = await UriHttpClient.getClient().post('/jane-ads/creative/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as { url: string; is_video: boolean };
  }

  /** Recent drafts (with images) the user already created, to reuse as campaign media. */
  static async listDrafts(limit = 10): Promise<{ drafts: DraftSummary[] }> {
    const res = await UriHttpClient.getClient().get('/jane-ads/creative/drafts', { params: { limit } });
    return res.data as { drafts: DraftSummary[] };
  }

  /** Turn a campaign on (starts spending its budget) or off. */
  static async setCampaignStatus(campaignId: string, active: boolean): Promise<{ status: string }> {
    const res = await UriHttpClient.getClient().post(`/jane-ads/meta/campaigns/${campaignId}/status`, { active });
    return res.data as { status: string };
  }

  /** Permanently delete a campaign. */
  static async deleteCampaign(campaignId: string): Promise<void> {
    await UriHttpClient.getClient().delete(`/jane-ads/meta/campaigns/${campaignId}`);
  }

  /** The active brand's ad-wallet balance + recent ledger (brand-scoped; no id to pass). */
  static async getWallet(): Promise<WalletInfo> {
    const res = await UriHttpClient.getClient().get('/jane-ads/wallet');
    return res.data as WalletInfo;
  }

  /** Start a Squad checkout to fund the active brand's ad wallet. Returns the checkout
   * URL to open; nothing is credited until the payment is confirmed on return. */
  static async fundWallet(amountNgn: number): Promise<{ checkout_url: string; reference: string; amount_ngn: number }> {
    const res = await UriHttpClient.getClient().post('/jane-ads/wallet/fund', { amount_ngn: amountNgn });
    return res.data as { checkout_url: string; reference: string; amount_ngn: number };
  }

  /** Verify a top-up on return from Squad and credit the wallet (idempotent). */
  static async verifyTopup(reference: string): Promise<{ status: string; balance_ngn?: number }> {
    const res = await UriHttpClient.getClient().get(`/jane-ads/wallet/topup/${reference}/verify`);
    return res.data as { status: string; balance_ngn?: number };
  }

  /** Whether the logged-in user may see the admin billing report. */
  static async billingAccess(): Promise<boolean> {
    try {
      const res = await UriHttpClient.getClient().get('/jane-ads/admin/access');
      return !!(res.data as { allowed?: boolean }).allowed;
    } catch {
      return false;
    }
  }

  /** Admin: per-customer ad spend / billed / margin, plus grand totals. */
  static async billingSummary(fromDate?: string, toDate?: string): Promise<BillingSummary> {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const res = await UriHttpClient.getClient().get('/jane-ads/admin/billing-summary', { params });
    return res.data as BillingSummary;
  }

  /** Admin: download the billing report as a CSV file (triggers a browser download). */
  static async downloadBillingCsv(fromDate?: string, toDate?: string): Promise<void> {
    const params: Record<string, string> = { format: 'csv' };
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const res = await UriHttpClient.getClient().get('/jane-ads/admin/billing-summary', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jane-ads-billing.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  /** The active brand's saved Campaigns chat transcript, oldest first. */
  static async getChatHistory(): Promise<SavedChatMessage[]> {
    const res = await UriHttpClient.getClient().get('/jane-ads/chat/history');
    return (res.data as { messages: SavedChatMessage[] }).messages || [];
  }

  /** Save (or update in place, by the same message_id) one chat message. Fire-and-forget
   * from the caller's side — a save failing shouldn't block the chat itself working. */
  static async saveChatMessage(msg: {
    message_id: string;
    role: 'user' | 'jane';
    kind: 'text' | 'result';
    text?: string;
    result?: LaunchFromMessageResult | null;
  }): Promise<void> {
    await UriHttpClient.getClient().put(`/jane-ads/chat/history/${msg.message_id}`, msg);
  }
}
