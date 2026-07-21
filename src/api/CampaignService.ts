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

  /** The full one-shot: message -> plan -> generated creative -> real (PAUSED) campaign. */
  static async launchFromMessage(payload: {
    message: string;
    business_name?: string;
    category?: string;
  }): Promise<LaunchFromMessageResult> {
    const res = await UriHttpClient.getClient().post('/jane-ads/meta/launch-from-message', payload);
    return res.data as LaunchFromMessageResult;
  }

  /** The active brand's campaigns + live metrics, for the management view. */
  static async listCampaigns(): Promise<{ campaigns: CampaignRow[] }> {
    const res = await UriHttpClient.getClient().get('/jane-ads/meta/campaigns');
    return res.data as { campaigns: CampaignRow[] };
  }
}
