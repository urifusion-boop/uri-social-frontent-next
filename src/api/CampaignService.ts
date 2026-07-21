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
  stage: 'need_more' | 'advise' | 'launched';
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

  /** The full one-shot: message -> plan -> creative (generated, uploaded, or drafted) -> real (PAUSED) campaign. */
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
}
