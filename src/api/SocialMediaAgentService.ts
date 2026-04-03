import { UriHttpClient } from '@/src/configs/http.config';
import { socialMediaAgentRoutes } from '@/src/constants/routes/socialMediaAgentRoutes';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface BrandContext {
  brand_name?: string;
  industry?: string;
  business_description?: string;
  tagline?: string;
  brand_voice?: string;
  target_audience?: string;
  key_products_services?: string[];
  brand_colors?: string[];
}

export interface ConnectFacebookPayload {
  platform: string;
  page_access_token: string;
}

export interface GenerateContentPayload {
  seed_content: string;
  platforms: string[];
  seed_type?: string;
  include_images?: boolean;
  brand_context?: BrandContext;
  reference_image?: string;
}

export interface RefinePayload {
  draft_id: string;
  refinements: {
    content?: string;
    hashtags?: string[];
  };
}

export interface ApprovePayload {
  draft_ids: string[];
  schedule_option: 'immediate' | 'schedule' | 'save_draft';
  scheduled_datetime?: string;
}

export interface ApprovePublishResult {
  success: boolean;
  error?: string;
  post_id?: string;
}

export interface ApprovedDraft {
  draft_id: string;
  platform: string;
  status: string;
  scheduled_date?: string | null;
  publish_result?: ApprovePublishResult;
}

export interface ApproveResult {
  approved_drafts: ApprovedDraft[];
  errors: string[];
  schedule_option: string;
  scheduled_datetime: string | null;
  approved_at: string;
}

export interface DenyPayload {
  draft_ids: string[];
  denial_reason: string;
  request_regeneration?: boolean;
}

export interface SocialConnection {
  platform: string;
  page_name?: string;
  fan_count?: number;
  status: 'active' | 'expired';
  page_id?: string;
}

export interface ContentDraft {
  id?: string;
  draft_id?: string;
  platform: string;
  content: string;
  hashtags?: string[];
  status?: 'draft' | 'pending_approval' | 'approved' | 'published' | 'denied' | 'scheduled' | 'ready_to_publish' | 'replaced' | 'publish_failed' | 'refined';
  approval_status?: 'pending' | 'approved' | 'denied';
  image_url?: string;
  has_image?: boolean;
  created_at?: string;
  scheduled_datetime?: string;
  auto_generated?: boolean;
}

export interface ContentCalendarResponse {
  drafts: ContentDraft[];
}

export interface ScheduledContentResponse {
  scheduled_drafts: ContentDraft[];
}

export interface ConnectInsightsPayload {
  influencer_id: string;
  platform: string;
  social_user_id?: string;
  insights: Record<string, unknown>;
}

export interface AnalyticsContext {
  connected: boolean;
  connected_platforms: string[];
  accounts_analysed: number;
  industries_detected: string[];
  last_synced_at?: string;
}

export interface AutoGenerateSettings {
  enabled: boolean;
  platforms: string[];
  frequency: 'daily' | 'weekly';
  include_images: boolean;
  brand_context?: BrandContext;
  last_run_at?: string;
  last_run_draft_count?: number;
  next_run_at?: string;
  analytics_context?: AnalyticsContext;
}

export class SocialMediaAgentService {
  static async connectFacebookToken(payload: ConnectFacebookPayload): Promise<UriResponse<SocialConnection>> {
    const response: Awaited<AxiosResponse<UriResponse<SocialConnection>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.connectFacebookToken,
      payload
    );
    return response.data;
  }

  static async getConnections(): Promise<
    UriResponse<{
      connections: Record<string, SocialConnection[]>;
      connected_platforms: string[];
      total_connections: number;
    }>
  > {
    const response = await UriHttpClient.getClient().get(socialMediaAgentRoutes.getConnections);
    return response.data;
  }

  static async disconnectPlatform(platform: string): Promise<UriResponse<string>> {
    const response: Awaited<AxiosResponse<UriResponse<string>>> = await UriHttpClient.getClient().delete(
      `${socialMediaAgentRoutes.disconnectPlatform}/${platform}`
    );
    return response.data;
  }

  static async generateContent(payload: GenerateContentPayload): Promise<UriResponse<ContentDraft[]>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentDraft[]>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateContent,
      payload,
      { timeout: 300000 }
    );
    return response.data;
  }

  static async refineContent(payload: RefinePayload): Promise<UriResponse<ContentDraft>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentDraft>>> = await UriHttpClient.getClient().put(
      socialMediaAgentRoutes.refineContent,
      payload
    );
    return response.data;
  }

  static async approveContent(payload: ApprovePayload): Promise<UriResponse<ApproveResult>> {
    const response: Awaited<AxiosResponse<UriResponse<ApproveResult>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.approveContent,
      payload
    );
    return response.data;
  }

  static async regenerateImage(draftId: string, feedback: string): Promise<UriResponse<{ draft_id: string; status: string }>> {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.deleteDraft}/${draftId}/regenerate-image`,
      { feedback },
      { timeout: 15000 }
    );
    return response.data;
  }

  static async deleteDraft(draftId: string): Promise<UriResponse<string>> {
    const response = await UriHttpClient.getClient().delete(`${socialMediaAgentRoutes.deleteDraft}/${draftId}`);
    return response.data;
  }

  static async denyContent(payload: DenyPayload): Promise<UriResponse<string>> {
    const response: Awaited<AxiosResponse<UriResponse<string>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.denyContent,
      payload
    );
    return response.data;
  }

  static async getContentCalendar(params?: Record<string, string>): Promise<UriResponse<ContentCalendarResponse>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarResponse>>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.contentCalendar}${query}`
    );
    return response.data;
  }

  static async getScheduled(): Promise<UriResponse<ScheduledContentResponse>> {
    const response: Awaited<AxiosResponse<UriResponse<ScheduledContentResponse>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.scheduledContent
    );
    return response.data;
  }

  static async getAutoGenerateSettings(): Promise<UriResponse<AutoGenerateSettings>> {
    const response: Awaited<AxiosResponse<UriResponse<AutoGenerateSettings>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.autoGenerateSettings
    );
    return response.data;
  }

  static async updateAutoGenerateSettings(
    payload: Omit<AutoGenerateSettings, 'last_run_at' | 'last_run_draft_count' | 'next_run_at'>
  ): Promise<UriResponse<AutoGenerateSettings>> {
    const response: Awaited<AxiosResponse<UriResponse<AutoGenerateSettings>>> = await UriHttpClient.getClient().put(
      socialMediaAgentRoutes.autoGenerateSettings,
      payload
    );
    return response.data;
  }

  static async connectInsights(
    payload: ConnectInsightsPayload
  ): Promise<UriResponse<{ saved: boolean; platform: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ saved: boolean; platform: string }>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.autoGenerateConnectInsights, payload);
    return response.data;
  }

  static async triggerAutoGenerate(): Promise<UriResponse<{ message: string; user_id: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ message: string; user_id: string }>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.autoGenerateTrigger);
    return response.data;
  }

  static async getPerformance(days = 30): Promise<UriResponse<PerformanceData>> {
    const response: Awaited<AxiosResponse<UriResponse<PerformanceData>>> = await UriHttpClient.getClient().get(
      `/social-media/performance?days=${days}`
    );
    return response.data;
  }

  static async getAccountMetrics(days = 30): Promise<UriResponse<AccountMetricsData>> {
    const response: Awaited<AxiosResponse<UriResponse<AccountMetricsData>>> = await UriHttpClient.getClient().get(
      `/social-media/account-metrics?days=${days}`
    );
    return response.data;
  }

  static async getCalendarPlan(): Promise<UriResponse<ContentCalendarPlan>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> =
      await UriHttpClient.getClient().get(socialMediaAgentRoutes.calendarPlan);
    return response.data;
  }

  static async generateCalendarPlan(
    platforms: string[],
    force = false
  ): Promise<UriResponse<ContentCalendarPlan>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> =
      await UriHttpClient.getClient().post(
        socialMediaAgentRoutes.calendarPlanGenerate,
        { platforms, force_regenerate: force },
        { timeout: 120000 }
      );
    return response.data;
  }

  static async regenerateCalendarDay(
    planId: string,
    dayIndex: number
  ): Promise<UriResponse<ContentCalendarPlan>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> =
      await UriHttpClient.getClient().post(
        `${socialMediaAgentRoutes.calendarDayBase}/${planId}/day/${dayIndex}/regenerate`
      );
    return response.data;
  }

  static async createDraftFromCalendarDay(
    planId: string,
    dayIndex: number,
    platforms: string[],
    includeImages = false
  ): Promise<UriResponse<{ drafts: ContentDraft[] }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ drafts: ContentDraft[] }>>> =
      await UriHttpClient.getClient().post(
        `${socialMediaAgentRoutes.calendarDayBase}/${planId}/day/${dayIndex}/create-draft`,
        { platforms, include_images: includeImages },
        { timeout: 300000 }
      );
    return response.data;
  }

  static async getTodaySuggestion(): Promise<UriResponse<TodaySuggestion>> {
    const response: Awaited<AxiosResponse<UriResponse<TodaySuggestion>>> =
      await UriHttpClient.getClient().get(socialMediaAgentRoutes.calendarToday);
    return response.data;
  }
}

export interface PerformancePost {
  draft_id: string;
  platform_post_id: string;
  platform: string;
  content_preview: string;
  published_at: string;
  image_url?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
}

export interface PerformancePlatformSummary {
  posts: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  avg_engagement_rate: number;
}

export interface PerformanceData {
  has_data: boolean;
  total_published: number;
  date_range_days: number;
  summary: {
    total_posts: number;
    total_impressions: number;
    total_reach: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_views: number;
    avg_engagement_rate: number;
  };
  by_platform: Record<string, PerformancePlatformSummary>;
  top_posts: PerformancePost[];
}

export interface CalendarDayItem {
  day_index: number;
  date: string;
  content_type: 'educational' | 'relatable' | 'promotional' | 'behind_the_scenes' | 'engagement';
  title: string;
  description: string;
  platforms: string[];
  acted_on: boolean;
  acted_on_draft_ids: string[];
  regenerated_count: number;
  last_regenerated_at: string | null;
}

export interface ContentCalendarPlan {
  plan_id: string;
  week_start: string;
  generated_at: string;
  platforms: string[];
  days: CalendarDayItem[];
  content_mix: Record<string, number>;
  brand_snapshot: {
    brand_name?: string;
    industry?: string;
    brand_voice?: string;
    target_audience?: string;
  };
}

export interface TodaySuggestion {
  has_plan: boolean;
  plan_id?: string;
  day_index?: number;
  today?: CalendarDayItem;
}

export interface AccountMetricItem {
  account_id: string;
  network: string;
  page_name?: string;
  category?: string;
  followers_count: number;
  following_count: number | null;
  posts_count: number | null;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reposts: number;
    quotes: number;
  } | null;
  engagement_note?: string;
  platform_specific: Record<string, unknown>;
  period: {
    since: number;
    until: number;
  };
}

export interface AccountMetricsData {
  has_data: boolean;
  accounts: AccountMetricItem[];
}
