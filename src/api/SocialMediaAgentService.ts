import { UriHttpClient } from '@/src/configs/http.config';
import { socialMediaAgentRoutes } from '@/src/constants/routes/socialMediaAgentRoutes';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosProgressEvent, AxiosResponse } from 'axios';

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

export interface VideoEditJob {
  job_id: string;
  status: 'processing' | 'complete' | 'failed';
  progress?: number;
  edited_video_url?: string;
  draft?: ContentDraft;
  edits_applied?: string[];
  error?: string;
}

export interface VideoPolishClip {
  clip_url: string;
  captioned_clip_url?: string;
  duration: number;
  caption_text: string; // Reap social media caption
  transcript?: string; // actual spoken words from transcription
  title?: string;
  topic?: string;
  hook?: string;
  virality_score?: number;
  start_time?: number;
  end_time?: number;
}

export interface VideoPolishJob {
  job_id: string;
  user_id: string;
  style_preset: string;
  language_setting: string;
  status: 'ingesting' | 'processing' | 'ready' | 'failed';
  status_message: string;
  progress: number;
  source_video_url: string;
  source_duration_seconds: number;
  source_quality_flags: { dark?: boolean; noisy?: boolean; short?: boolean };
  output_clips: VideoPolishClip[];
  credits_charged: number;
  user_action: 'pending' | 'approved' | 'restyled' | 'skipped';
  created_at: string;
  completed_at?: string;
}

export interface VideoPolishStyle {
  name: string;
  display_name: string;
  description: string;
  best_for: string;
  energy_level: number;
  good_for_intents: string[];
}

export interface MultiClipClip {
  clip_id: string;
  filename: string;
  cloudinary_url: string;
  order_index: number;
  duration_seconds: number;
  clip_type: 'speech' | 'silent' | 'still';
  has_face: boolean;
  quality_flags: string[];
  recommended_drop: boolean;
  drop_reason: string | null;
  transcript: string;
  dropped?: boolean;
  // Product Story fields
  vision_description?: string;
  shot_type?: string;
  vision_role?: string;
}

export interface MultiClipJob {
  job_id: string;
  user_id: string;
  story_type: 'founder' | 'product';
  status: 'analyzing' | 'awaiting_script' | 'awaiting_order' | 'stitching' | 'ready' | 'failed';
  status_message: string;
  progress: number;
  clips: MultiClipClip[];
  suggested_order: string[];
  target_duration_seconds: number;
  orientation: '9:16' | '1:1' | '16:9';
  enable_music: boolean;
  music_mood: string;
  output_url: string | null;
  created_at: string;
  completed_at: string | null;
  // Product Story script fields
  story_description?: string;
  script_draft?: string;
  script_lines_draft?: string[];
  script?: string;
  script_lines?: string[];
  // Phase 3: mismatch detection
  mismatch_info?: { type: string; message: string } | null;
  // Phase 4: length budget
  length_budget_info?: {
    total_footage_seconds: number;
    target_seconds: number;
    ratio: number;
    recommendation: 'ok' | 'trim_light' | 'trim_heavy' | 'short';
    message: string;
  } | null;
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

export interface ApproveError {
  draft_id: string;
  error: string;
}

export interface ApproveResult {
  approved_drafts: ApprovedDraft[];
  errors: ApproveError[];
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
  account_name?: string;
  username?: string;
  fan_count?: number;
  status?: 'active' | 'expired';
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
  video_url?: string;
  created_at?: string;
  scheduled_datetime?: string;
  auto_generated?: boolean;
  post_type?: 'feed' | 'carousel' | 'story' | 'reel';
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
      { timeout: 180000 }
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

  static async submitVideoEdit(formData: FormData): Promise<UriResponse<{ job_id: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string }>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.editVideo,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
    );
    return response.data;
  }

  static async getVideoEditJob(jobId: string): Promise<UriResponse<VideoEditJob>> {
    const response: Awaited<AxiosResponse<UriResponse<VideoEditJob>>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.editVideoJob}/${jobId}`
    );
    return response.data;
  }

  static async getVideoPolishStyles(): Promise<UriResponse<VideoPolishStyle[]>> {
    const response = await UriHttpClient.getClient().get(socialMediaAgentRoutes.videoPolishStyles);
    return response.data;
  }

  static async getVideoCaptionPresets(): Promise<UriResponse<{ id: string; name: string; source: string }[]>> {
    const response = await UriHttpClient.getClient().get('/video-polish-caption-presets');
    return response.data;
  }

  static async submitVideoPolish(formData: FormData): Promise<UriResponse<{ job_id: string }>> {
    const response = await UriHttpClient.getClient().post(socialMediaAgentRoutes.polishVideo, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  }

  static async getVideoPolishJob(jobId: string): Promise<UriResponse<VideoPolishJob>> {
    const response = await UriHttpClient.getClient().get(`${socialMediaAgentRoutes.polishVideoJob}/${jobId}`);
    return response.data;
  }

  static async restyleVideoPolish(formData: FormData): Promise<UriResponse<{ job_id: string }>> {
    const response = await UriHttpClient.getClient().post(socialMediaAgentRoutes.polishVideoRestyle, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return response.data;
  }

  static async clipAction(
    jobId: string,
    clipIdx: number,
    action: 'reframe' | 'dub',
    params: { orientation?: string; source_language?: string; target_language?: string }
  ): Promise<UriResponse<{ action_job_id: string; status: string }>> {
    const fd = new FormData();
    fd.append('job_id', jobId);
    fd.append('clip_idx', String(clipIdx));
    fd.append('action', action);
    if (params.orientation) fd.append('orientation', params.orientation);
    if (params.source_language) fd.append('source_language', params.source_language);
    if (params.target_language) fd.append('target_language', params.target_language);
    const response = await UriHttpClient.getClient().post('/polish-video-clip-action', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  static async getClipActionResult(
    actionJobId: string
  ): Promise<UriResponse<{ status: string; clip_url?: string; error?: string }>> {
    const response = await UriHttpClient.getClient().get(`/polish-video-clip-action/${actionJobId}`);
    return response.data;
  }

  // ── Video Production ──────────────────────────────────────────────────────

  static async submitVideoProduction(
    formData: FormData,
    onUploadProgress?: (percent: number) => void
  ): Promise<UriResponse<{ job_id: string }>> {
    const response = await UriHttpClient.getClient().post(socialMediaAgentRoutes.produceVideo, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // no timeout — upload duration depends on file size + connection speed
      onUploadProgress: onUploadProgress
        ? (e: AxiosProgressEvent) => {
            if (e.total) onUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        : undefined,
    });
    return response.data;
  }

  static async getVideoProductionJob(jobId: string): Promise<
    UriResponse<{
      job_id: string;
      status: 'processing' | 'awaiting_review' | 'ready' | 'failed';
      status_message: string;
      progress: number;
      output_url: string | null;
      video_type: string;
      pacing_note: string;
      cuts: { remove_start: number; remove_end: number; reason: string }[];
      zooms: { at: number; type: string; intensity: string; reason: string }[];
      ai_decisions?: {
        cuts: { remove_start: number; remove_end: number; reason: string; confidence?: number }[];
        zooms: { at: number; type: string; intensity: string; reason: string }[];
        sound_effects: { at: number; type: string; reason: string }[];
        broll: { at: number; duration: number; description: string; concept: string }[];
        hook_text: string;
        music_mood: string;
        pacing_note: string;
        caption_cues?: { start: number; end: number; type: 'emphasis' | 'cta' | 'metric' }[];
        topic_changes?: { at: number; confidence: number }[];
        icon_overlays?: { at: number; duration: number; category: string }[];
      };
    }>
  > {
    const response = await UriHttpClient.getClient().get(`${socialMediaAgentRoutes.produceVideoJob}/${jobId}`);
    return response.data;
  }

  static async startVideoRender(
    jobId: string,
    decisions?: {
      cuts: { remove_start: number; remove_end: number; reason: string }[];
      zooms: { at: number; type: string; intensity: string; reason: string }[];
      sound_effects: { at: number; type: string; reason: string }[];
      broll: { at: number; duration: number; description: string; concept: string }[];
      hook_text: string;
      music_mood: string;
    }
  ): Promise<UriResponse<{ job_id: string; status: string }>> {
    const response = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.produceVideoStartRender}/${jobId}/start-render`,
      decisions ? { decisions } : {}
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

  static async getBlogDrafts(): Promise<UriResponse<BlogDraft[]>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogDraft[]>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.getBlogDrafts
    );
    return response.data;
  }

  static async getBlogDraft(draftId: string): Promise<UriResponse<BlogDraft>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogDraft>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.getBlogDraft.replace('{draft_id}', draftId)
    );
    return response.data;
  }

  static async agentChat(
    messages: { role: string; content: string }[],
    imageUrl?: string,
    brandContext?: BrandContext
  ): Promise<
    UriResponse<{
      reply: string;
      navigate: string | null;
    }>
  > {
    const response: Awaited<
      AxiosResponse<
        UriResponse<{
          reply: string;
          navigate: string | null;
        }>
      >
    > = await UriHttpClient.getClient().post(socialMediaAgentRoutes.agentChat, {
      messages,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(brandContext ? { brand_context: brandContext } : {}),
    });
    return response.data;
  }

  static async getAgentChatHistory(): Promise<UriResponse<{ role: string; content: string; created_at: string }[]>> {
    const response: Awaited<AxiosResponse<UriResponse<{ role: string; content: string; created_at: string }[]>>> =
      await UriHttpClient.getClient().get(socialMediaAgentRoutes.agentChatHistory);
    return response.data;
  }

  static async clearAgentChat(): Promise<UriResponse<{ cleared: boolean }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ cleared: boolean }>>> = await UriHttpClient.getClient().delete(
      socialMediaAgentRoutes.clearAgentChat
    );
    return response.data;
  }

  static async uploadChatImage(file: File): Promise<UriResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    const response: Awaited<AxiosResponse<UriResponse<{ url: string }>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.agentChatUpload,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  static agentChatStream(
    messages: { role: string; content: string }[],
    callbacks: {
      onToken: (token: string) => void;
      onDone: (navigate: string | null) => void;
      onError: (msg: string) => void;
    },
    imageUrl?: string,
    brandContext?: BrandContext
  ): { abort: () => void } {
    const controller = new AbortController();
    const baseUrl = process.env.NEXT_PUBLIC_URI_API_BASE_URL ?? '';
    const tokens: { accessToken?: string } = (() => {
      try {
        return JSON.parse(localStorage.getItem('@URI@USER_TOKENS') ?? '{}');
      } catch {
        return {};
      }
    })();
    const url = `${baseUrl}${socialMediaAgentRoutes.agentChatStream}`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
          },
          body: JSON.stringify({
            messages,
            ...(imageUrl ? { image_url: imageUrl } : {}),
            ...(brandContext ? { brand_context: brandContext } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          callbacks.onError('Stream request failed.');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.token !== undefined) callbacks.onToken(ev.token);
              else if (ev.done) callbacks.onDone(ev.navigate ?? null);
              else if (ev.error) callbacks.onError(ev.error);
            } catch {
              // ignore malformed SSE line
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        callbacks.onError('Connection lost. Please try again.');
      }
    })();

    return { abort: () => controller.abort() };
  }

  // ── Writing DNA Blog Generator ────────────────────────────────────────────

  static async submitWritingDNAQuiz(data: WritingDNARequest): Promise<UriResponse<WritingDNAData>> {
    const response: Awaited<AxiosResponse<UriResponse<WritingDNAData>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.writingDnaQuiz,
      data
    );
    return response.data;
  }

  static async getWritingDNA(): Promise<UriResponse<WritingDNAData>> {
    const response: Awaited<AxiosResponse<UriResponse<WritingDNAData>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.writingDna
    );
    return response.data;
  }

  static async generateBlogPost(data: BlogPostGenerateRequest): Promise<UriResponse<BlogPostGenerateResult>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogPostGenerateResult>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateBlogPost,
      data
    );
    return response.data;
  }

  static async listBlogPosts(): Promise<UriResponse<BlogPostData[]>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogPostData[]>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.blogPosts
    );
    return response.data;
  }

  static async getBlogPostById(blogId: string): Promise<UriResponse<BlogPostData>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogPostData>>> = await UriHttpClient.getClient().get(
      socialMediaAgentRoutes.blogPostById.replace('{blog_id}', blogId)
    );
    return response.data;
  }

  static async updateBlogPost(blogId: string, content: string, title?: string): Promise<UriResponse<BlogPostData>> {
    const response: Awaited<AxiosResponse<UriResponse<BlogPostData>>> = await UriHttpClient.getClient().patch(
      socialMediaAgentRoutes.blogPostById.replace('{blog_id}', blogId),
      { content, ...(title ? { title } : {}) }
    );
    return response.data;
  }

  static async recordBlogPostFeedback(
    blogId: string,
    rating: 'up' | 'down',
    issues?: string[]
  ): Promise<UriResponse<{ blog_id: string; rating: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ blog_id: string; rating: string }>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.blogPostFeedback.replace('{blog_id}', blogId), {
        rating,
        issues,
      });
    return response.data;
  }

  // ── Multi-Clip Composition ────────────────────────────────────────────────

  static async startMultiClipJob(formData: FormData): Promise<UriResponse<{ job_id: string; status: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string; status: string }>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.multiClipStart, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
      });
    return response.data;
  }

  static async getMultiClipJob(jobId: string): Promise<UriResponse<MultiClipJob>> {
    const response: Awaited<AxiosResponse<UriResponse<MultiClipJob>>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.multiClipJob}/${jobId}`
    );
    return response.data;
  }

  static async reorderMultiClipJob(jobId: string, clipIds: string[]): Promise<UriResponse<{ accepted: boolean }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ accepted: boolean }>>> = await UriHttpClient.getClient().post(
      `${socialMediaAgentRoutes.multiClipReorder}/${jobId}/reorder`,
      { clip_ids: clipIds }
    );
    return response.data;
  }

  static async dropMultiClip(
    jobId: string,
    clipId: string,
    dropped: boolean
  ): Promise<UriResponse<{ clip_id: string; dropped: boolean }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ clip_id: string; dropped: boolean }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.multiClipDropClip}/${jobId}/drop-clip`, {
        clip_id: clipId,
        dropped,
      });
    return response.data;
  }

  static async stitchMultiClipJob(jobId: string): Promise<UriResponse<{ job_id: string; status: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string; status: string }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.multiClipStitch}/${jobId}/stitch`, {});
    return response.data;
  }

  static async draftProductScript(
    jobId: string,
    description: string
  ): Promise<UriResponse<{ draft: string; lines: string[] }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ draft: string; lines: string[] }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.multiClipDraftScript}/${jobId}/draft-script`, {
        description,
      });
    return response.data;
  }

  static async approveProductScript(
    jobId: string,
    script: string,
    lines: string[]
  ): Promise<UriResponse<{ job_id: string; status: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string; status: string }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.multiClipApproveScript}/${jobId}/approve-script`, {
        script,
        lines,
      });
    return response.data;
  }

  static async resetMultiClipJob(jobId: string): Promise<UriResponse<{ job_id: string; status: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ job_id: string; status: string }>>> =
      await UriHttpClient.getClient().post(`${socialMediaAgentRoutes.multiClipReset}/${jobId}/reset`);
    return response.data;
  }

  static async generateVideoCaption(payload: {
    storyboard: Record<string, unknown>;
    platform?: string;
  }): Promise<UriResponse<{ caption: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ caption: string }>>> = await UriHttpClient.getClient().post(
      socialMediaAgentRoutes.generateVideoCaption,
      payload,
      { timeout: 60000 }
    );
    return response.data;
  }

  static async publishBlogPost(
    blogId: string,
    publishedUrl?: string
  ): Promise<UriResponse<{ blog_id: string; status: string }>> {
    const response: Awaited<AxiosResponse<UriResponse<{ blog_id: string; status: string }>>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.blogPostPublish.replace('{blog_id}', blogId), {
        published_url: publishedUrl,
      });
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
    insights_available?: boolean;
    insights_note?: string | null;
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
  image_url: string | null;
  has_image: boolean;
  social_snippets: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
  keywords: string[];
  tone: string;
  generated_at: string;
}

export interface BlogDraft {
  id: string;
  user_id: string;
  status: string;
  title: string;
  meta_description: string;
  content: string;
  reading_time: number;
  word_count: number;
  featured_image_url: string | null;
  has_image: boolean;
  social_snippets: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
  keywords: string[];
  tone: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

// ── Writing DNA Blog Generator types ─────────────────────────────────────

export interface WritingDNAAnswers {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
  q16: string;
}

export interface WritingDNARequest {
  quiz_answers: WritingDNAAnswers;
  writing_sample?: string;
}

export interface WritingDNAData {
  user_id: string;
  quiz_answers: WritingDNAAnswers;
  sample_text?: string;
  writing_dna_prompt: string;
  aspirational_writers: string[];
  dna_keys: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface BlogPostGenerateRequest {
  topic: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  word_count?: number;
}

export interface BlogPostGenerateResult {
  blog_id: string;
  title: string;
  meta: string;
  content: string;
  word_count: number;
  has_writing_dna: boolean;
  status: string;
  created_at: string;
}

export interface BlogPostData {
  id: string;
  user_id: string;
  topic: string;
  primary_keyword: string;
  secondary_keywords: string[];
  target_word_count: number;
  generated_content: string;
  generated_title: string;
  generated_meta: string;
  current_content: string;
  current_title: string;
  status: 'draft' | 'review' | 'published';
  has_writing_dna: boolean;
  feedback: { rating?: string; issues?: string[] };
  published_url?: string;
  created_at: string;
  updated_at: string;
}
