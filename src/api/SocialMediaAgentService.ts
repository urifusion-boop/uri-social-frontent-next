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
  image_model?: string;
  brand_context?: BrandContext;
  reference_image?: string;
  post_type?: 'feed' | 'carousel' | 'story';
  num_slides?: number;
  acknowledged_incomplete_profile?: boolean; // OPTION 1: User acknowledged incomplete profile warning
}

export interface StoryboardScene {
  scene_number: number;
  duration_seconds: number;
  shot_type: string;
  motion: string;
  video_prompt: string;
  reference_image_index: number;
  text_overlay: string | null;
  frame_image_url?: string;
}

export interface Storyboard {
  total_duration_seconds: number;
  target_platform: string;
  aspect_ratio: string;
  scenes: StoryboardScene[];
}

export interface StoryboardPayload {
  brand_images: string[];
  optional_text?: string;
  target_platform: string;
  target_duration_seconds: number;
  video_style?: string;
}

export interface VideoClip {
  scene_number: number;
  shot_type: string;
  duration_seconds: number;
  motion: string;
  text_overlay: string | null;
  video_prompt: string;
  video_url: string | null;
  error?: string;
}

export interface VideoJob {
  job_id: string;
  status: 'queued' | 'generating' | 'complete' | 'failed';
  model: string;
  total_scenes: number;
  current_scene: number;
  clips: VideoClip[];
  error: string | null;
}

export interface VideoFromStoryboardPayload {
  storyboard: Storyboard;
  brand_images: string[];
  model?: string;
}

export interface VideoDraft {
  id: string;
  user_id: string;
  media_type: 'video';
  video_url: string;
  content: string;
  platforms: string[];
  status: string;
  created_at: string;
}

export interface VideoPublishJob {
  job_id: string;
  draft_id: string;
  platform: string;
  status: 'queued' | 'uploading' | 'processing' | 'published' | 'failed';
  platform_post_id: string | null;
  post_url: string | null;
  error: string | null;
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
  outstand_account_id?: string;
  ig_user_id?: string;
  connected_via?: string;
}

export interface CarouselSlide {
  headline: string;
  body: string;
  image_url?: string;
  image_specs?: { width: number; height: number };
}

export interface ContentDraft {
  id?: string;
  draft_id?: string;
  platform: string;
  content: string;
  hashtags?: string[];
  status?:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'published'
    | 'denied'
    | 'scheduled'
    | 'ready_to_publish'
    | 'replaced'
    | 'publish_failed'
    | 'refined';
  approval_status?: 'pending' | 'approved' | 'denied';
  image_url?: string;
  image_version?: number;
  has_image?: boolean;
  image_failed?: boolean;
  image_retry_count?: number; // PRD 4.2: Track image retry count for credit deduction
  created_at?: string;
  scheduled_datetime?: string;
  auto_generated?: boolean;
  post_type?: 'feed' | 'carousel' | 'story';
  slides?: CarouselSlide[];
  image_specs?: { width: number; height: number };
  error_message?: string;
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

  static async disconnectInstagramDirect(igUserId: string): Promise<UriResponse<string>> {
    const response: Awaited<AxiosResponse<UriResponse<string>>> = await UriHttpClient.getClient().delete(
      `/social-media/connections/instagram-direct/${igUserId}`
    );
    return response.data;
  }

  static async disconnectFacebookDirect(): Promise<UriResponse<string>> {
    const response: Awaited<AxiosResponse<UriResponse<string>>> = await UriHttpClient.getClient().delete(
      `/social-media/connections/facebook-direct`
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

  static async regenerateImage(
    draftId: string,
    feedback: string,
    confirmed?: boolean
  ): Promise<UriResponse<{ draft_id: string; status: string; requires_confirmation?: boolean; confirmed?: boolean }>> {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.deleteDraft}/${draftId}/regenerate-image`,
      { feedback, confirmed: confirmed || false },
      { timeout: 15000 }
    );
    return response.data;
  }

  static async deleteDraft(draftId: string): Promise<UriResponse<string>> {
    const response = await UriHttpClient.getClient().delete(`${socialMediaAgentRoutes.deleteDraft}/${draftId}`);
    return response.data;
  }

  static async editDraftImage(
    draftId: string,
    feedback: string,
    forceCategory?: 'text_edit' | 'style_edit' | 'content_edit' | 'full_redesign'
  ): Promise<
    UriResponse<{
      image_url: string;
      version: number;
      edit_category: string;
      message: string;
      credit_charged: boolean;
      credits_consumed?: number;
    }>
  > {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.deleteDraft}/${draftId}/edit-image`,
      {
        feedback,
        force_category: forceCategory,
      }
    );
    return response.data;
  }

  static async undoDraftImage(
    draftId: string
  ): Promise<UriResponse<{ image_url: string; version: number; message: string }>> {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.deleteDraft}/${draftId}/undo-image`
    );
    return response.data;
  }

  static async syncImageAcrossDrafts(
    sourceDraftId: string,
    targetDraftIds: string[]
  ): Promise<UriResponse<{ updated_count: number; source_draft_id: string }>> {
    const response = await UriHttpClient.getClient().post('/social-media/image-sync', {
      source_draft_id: sourceDraftId,
      target_draft_ids: targetDraftIds,
    });
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

  static async unscheduleDraft(draftId: string): Promise<UriResponse<{ draft_id: string; status: string }>> {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.deleteDraft}/${draftId}/unschedule`
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
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.calendarPlan
    );
    return response.data;
  }

  static async generateCalendarPlan(platforms: string[], force = false): Promise<UriResponse<ContentCalendarPlan>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.calendarPlanGenerate,
      { platforms, force_regenerate: force },
      { timeout: 120000 }
    );
    return response.data;
  }

  static async regenerateCalendarDay(planId: string, dayIndex: number): Promise<UriResponse<ContentCalendarPlan>> {
    const response: Awaited<AxiosResponse<UriResponse<ContentCalendarPlan>>> = await UriHttpClient.getClient().post(
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

  static async getCalendarPerformance(): Promise<UriResponse<CalendarPerformanceData>> {
    const response: Awaited<AxiosResponse<UriResponse<CalendarPerformanceData>>> = await UriHttpClient.getClient().get(
      '/social-media/content-calendar/performance'
    );
    return response.data;
  }

  static async getCalendarTrends(): Promise<UriResponse<TrendsData>> {
    const response: Awaited<AxiosResponse<UriResponse<TrendsData>>> = await UriHttpClient.getClient().get(
      '/social-media/content-calendar/trends'
    );
    return response.data;
  }

  static async getTodaySuggestion(): Promise<UriResponse<TodaySuggestion>> {
    const response: Awaited<AxiosResponse<UriResponse<TodaySuggestion>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.calendarToday
    );
    return response.data;
  }

  static async generateStoryboard(payload: StoryboardPayload): Promise<UriResponse<Storyboard>> {
    const response: Awaited<AxiosResponse<UriResponse<Storyboard>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateStoryboard,
      payload,
      { timeout: 60000 }
    );
    return response.data;
  }

  static async generateVideoFromStoryboard(payload: VideoFromStoryboardPayload): Promise<UriResponse<VideoJob>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoJob>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateVideoFromStoryboard,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  }

  static async getVideoJob(jobId: string): Promise<UriResponse<VideoJob>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoJob>>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.videoJob}/${jobId}`
    );
    return response.data;
  }

  static async mergeVideoJob(jobId: string): Promise<UriResponse<{ merged_video_url: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ merged_video_url: string }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.mergeVideoJob}/${jobId}`, {}, { timeout: 180000 });
    return response.data;
  }

  static async saveVideoDraft(payload: {
    merged_video_url: string;
    caption: string;
    platforms: string[];
  }): Promise<UriResponse<VideoDraft>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoDraft>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.videoDrafts,
      payload
    );
    return response.data;
  }

  static async listVideoDrafts(): Promise<UriResponse<VideoDraft[]>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoDraft[]>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.videoDrafts
    );
    return response.data;
  }

  static async generateStoryboardFrames(
    scenes: StoryboardScene[],
    brandImages: string[] = []
  ): Promise<UriResponse<{ job_id: string; status: string; total_scenes: number }>> {
    const response = await UriHttpClient.getClient().post(socialMediaAgentRoutes.generateStoryboardFrames, {
      scenes,
      brand_images: brandImages,
    });
    return response.data;
  }

  static async getStoryboardFrameJob(
    jobId: string
  ): Promise<
    UriResponse<{ job_id: string; status: string; frames: { scene_number: number; frame_image_url: string }[] }>
  > {
    const response = await UriHttpClient.getClient().get(`${socialMediaAgentRoutes.storyboardFrameJob}/${jobId}`);
    return response.data;
  }

  static async publishVideoDraft(payload: {
    draft_id: string;
    platform: string;
    caption?: string;
  }): Promise<UriResponse<{ job_id: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string }>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.publishVideoDraft,
      payload
    );
    return response.data;
  }

  static async getVideoPublishJob(jobId: string): Promise<UriResponse<VideoPublishJob>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoPublishJob>>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.videoPublishJob}/${jobId}`
    );
    return response.data;
  }

  static async extractImageText(imageUrl: string): Promise<UriResponse<ImageTextResponse>> {
    const response: Awaited<AxiosResponse<UriResponse<ImageTextResponse>>> = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.extractImageText}?image_url=${encodeURIComponent(imageUrl)}`
    );
    return response.data;
  }

  static async uploadCustomFont(file: File): Promise<UriResponse<CustomFontUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response: Awaited<AxiosResponse<UriResponse<CustomFontUploadResponse>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.uploadCustomFont, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
  }

  static async analyzeCustomFont(fontUrl: string): Promise<UriResponse<CustomFontAnalysisResponse>> {
    const response: Awaited<AxiosResponse<UriResponse<CustomFontAnalysisResponse>>> =
      await UriHttpClient.getClient().post(
        `${socialMediaAgentRoutes.analyzeCustomFont}?font_url=${encodeURIComponent(fontUrl)}`
      );
    return response.data;
  }

  static async generateBlogContent(data: BlogGenerationRequest): Promise<UriResponse<BlogContentResponse>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogContentResponse>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateBlog,
      data
    );
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
  keyword?: string;
  format?: string;
  trend_score?: number;
  performance_score?: number;
  format_score?: number;
  final_score?: number;
  reason?: string;
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
  generation_method?: 'data_driven' | 'trend_driven' | 'ai';
  data_signals?: {
    post_count: number;
    top_topics: string[];
    top_formats: string[];
  };
}

export interface CalendarPerformanceData {
  avg_engagement_by_format: Record<string, number>;
  avg_engagement_by_topic: Record<string, number>;
  best_posting_hour: number;
  top_formats: string[];
  top_topics: string[];
  post_count: number;
  analytics_count: number;
  has_data: boolean;
}

export interface TrendKeyword {
  keyword: string;
  trend_score: number;
  growth_rate: number;
  source: 'google_trends' | 'fallback';
  type: 'rising' | 'top' | 'seed';
}

export interface TrendsData {
  industry: string;
  keywords: TrendKeyword[];
  count: number;
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

export interface ImageTextResponse {
  text: string;
  image_url: string;
}

export interface CustomFontUploadResponse {
  font_url: string;
  filename: string;
  size_mb: number;
}

export interface CustomFontAnalysisResponse {
  font_url: string;
  analysis: {
    font_category: string;
    stroke_weight: string;
    stroke_contrast: string;
    letter_shape: string;
    terminals: string;
    x_height: string;
    letter_spacing: string;
    special_features: string[];
    overall_feel: string;
  };
  prompt_directive: string;
}

export interface BlogGenerationRequest {
  topic: string;
  keywords: string[];
  tone: 'professional' | 'inspirational' | 'educational' | 'conversational';
  word_count: 1000 | 2000 | 3000;
}

export interface BlogContentResponse {
  draft_id: string;
  title: string;
  meta_description: string;
  content: string;
  reading_time: number;
  word_count: number;
  featured_image_url: string;
  social_snippets: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
  keywords: string[];
  tone: string;
  generated_at: string;
}
