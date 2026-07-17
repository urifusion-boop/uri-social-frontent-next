import { UriHttpClient } from '@/src/configs/http.config';
import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

/**
 * Client for the isolated Visual Engine V2 module (app/agents/visual_engine_v2 on
 * the backend's develop branch) — a from-scratch implementation of the Visual
 * Content Engine PRD's 4-layer pipeline (content / imagery / brand / typesetting).
 * Kept in its own file and called only from the "Visual Engine V2" workspace tab,
 * separate from the production content pipeline (SocialMediaAgentService).
 */
const BASE = `${BackendUrlEnum.INSIGHTS}/social-media/visual-engine/v2`;

export type ImagePath = 'A' | 'B' | 'placeholder';
export type AspectFormat = '1:1' | '4:5' | '9:16';
export type ReviewTier = 'auto' | 'soft' | 'mandatory';

export interface LayerFields {
  headline?: string;
  subtext?: string;
  promo?: string;
  cta?: string;
  imagery_url?: string;
  logo_url?: string;
  primary_color?: string;
  template_id?: string;
  style_family?: string;
  rendered_urls?: string[];
  [key: string]: unknown;
}

export interface LayerData {
  layer_type: string;
  data: LayerFields;
  metadata: Record<string, unknown>;
}

export type NegativeSpace = 'left_third' | 'right_third' | 'top_third' | 'bottom_third';
export type CleanupLevel = 'none' | 'background_removal' | 'reframe' | 'ai_recomposite';

export interface ContentPlanPayload {
  seed_content: string;
  platforms: string[];
  post_intent: 'sale' | 'product' | 'announcement' | 'testimonial' | 'educational' | 'carousel';
  carousel_slides?: number;
}

export interface ContentPlanResult {
  success: boolean;
  content_layer: LayerData;
  cost: number;
}

export interface CarouselSlideContent {
  headline: string;
  subtext: string;
  promo: string;
  cta: string;
  image_brief: string;
}

export interface CarouselContentPlanPayload {
  seed_content: string;
  platforms: string[];
  post_intent: string;
  carousel_count: number;
}

export interface CarouselContentPlanResult {
  success: boolean;
  /** content_layer.data.slides: CarouselSlideContent[] */
  content_layer: LayerData;
  cost: number;
}

export interface GenerateImagePayload {
  content_plan: string;
  format?: AspectFormat;
  negative_space?: NegativeSpace;
}

export interface ImageResult {
  success: boolean;
  imagery_layer: LayerData;
  cost: number;
  needs_attention?: boolean;
}

export interface CarouselGenerateImagesPayload {
  image_briefs: string[];
  format?: AspectFormat;
  negative_space?: NegativeSpace;
}

export interface CarouselImagesResult {
  success: boolean;
  imagery_layers: LayerData[];
  cost: number;
}

export interface RenderPayload {
  content_layer: LayerData;
  imagery_layer: LayerData;
  format?: AspectFormat;
  /** PRD Section 14: one content+image plan rendered into every listed format. Overrides `format` when set. */
  formats?: AspectFormat[];
}

export interface CarouselRenderPayload {
  /** Carousel content plan with data.slides[] (from generateCarouselContentPlan) */
  content_layer: LayerData;
  /** One per slide, same order as content_layer.data.slides */
  imagery_layers: LayerData[];
  format?: AspectFormat;
  formats?: AspectFormat[];
  carousel_count: number;
}

export interface QualityGateResult {
  approved: boolean;
  requires_review: boolean;
  review_tier: ReviewTier;
  quality_score: number;
  issues: string[];
  review_queue_id: string | null;
}

export interface RenderResult {
  success: boolean;
  render_id: string;
  final_outputs: string[];
  format_outputs: Record<string, string[]>;
  template_id: string | null;
  style_family: string | null;
  total_cost: number;
  quality_gate: QualityGateResult;
  status: 'pending_review' | 'completed';
}

export interface CarouselRenderResult {
  success: boolean;
  render_id: string;
  carousel_slides: string[];
  slide_count: number;
  format_outputs: Record<string, string[]>;
  template_id: string | null;
  style_family: string | null;
  total_cost: number;
  quality_gate: QualityGateResult;
  status: 'pending_review' | 'completed';
}

export interface ReviewQueueItem {
  queue_id: string;
  render_id: string;
  user_id: string;
  brand_profile_id: string;
  review_tier: 'soft' | 'mandatory';
  review_reason: string;
  quality_score: number;
  detected_issues: string[];
  preview_url: string;
  content_preview: LayerFields;
  status: 'pending' | 'approved' | 'rejected';
  assigned_to?: string | null;
  reviewed_at?: string | null;
  reviewer_notes?: string | null;
  created_at: string;
  priority: number;
}

export type SupportedPlatform = 'instagram' | 'facebook' | 'x' | 'linkedin';

export interface ConnectedPlatformsResult {
  success: boolean;
  connected_platforms: SupportedPlatform[];
  supported_platforms: SupportedPlatform[];
}

export interface PublishResult {
  success: boolean;
  draft_id: string;
  platform: SupportedPlatform;
  result: Record<string, unknown>;
}

export type LogoControlMode = 'agent' | 'user';
export type LogoPosition =
  | 'top_left'
  | 'top_right'
  | 'top_center'
  | 'bottom_left'
  | 'bottom_right'
  | 'bottom_center'
  | 'center';
export type StyleFamily =
  | 'bold_modern'
  | 'minimal_clean'
  | 'modern_professional'
  | 'educational'
  | 'testimonial_social_proof'
  | 'playful_colorful'
  | 'elegant_luxury';

export interface BrandPrefsResult {
  success: boolean;
  style_family: StyleFamily | null;
  style_family_override: boolean;
  logo_control_mode: LogoControlMode;
  logo_manual_position: LogoPosition | null;
  /** PRD Section 10.1: whether this brand has any previously-cleaned Path B upload on file. */
  has_product_images: boolean;
  /** "B" if the brand has usable product photos on file, "A" otherwise — PRD Section 10.1 fallback. */
  recommended_image_path: 'A' | 'B';
}

export interface BrandPrefsUpdatePayload {
  logo_control_mode?: LogoControlMode;
  logo_manual_position?: LogoPosition;
  style_family?: StyleFamily;
}

export interface VisualEngineMetrics {
  success: boolean;
  total_renders: number;
  text_correctness_rate: number;
  brand_accuracy: number;
  auto_publish_rate: number | null;
  render_success_rate: number | null;
  avg_cost_per_post_usd: number | null;
  avg_cost_per_carousel_usd: number | null;
  single_post_count: number;
  carousel_count: number;
  customer_visible_quality: string;
}

interface JobStartResult {
  success: boolean;
  job_id: string;
  status: 'pending';
}

interface JobStatusResult<T> {
  success: boolean;
  job_id: string;
  status: 'pending' | 'completed' | 'failed';
  result: T | null;
  error: string | null;
}

export class VisualEngineV2Service {
  /**
   * generate-image/upload-image/render/render-carousel all return a job_id
   * immediately and do the actual (potentially 30-90s+) work in a backend
   * background task — mirrors the production /generate-content endpoint's
   * own pattern, since holding one HTTP connection open for the full
   * duration of a GPT Image 2 or Orshot call is fragile against any
   * intermediate proxy timeout, independent of the client's own timeout.
   * Polls GET /v2/jobs/{job_id} every 3s until it's done.
   */
  private static async _pollJob<T>(jobId: string, intervalMs = 3000, maxAttempts = 100): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res: AxiosResponse<JobStatusResult<T>> = await UriHttpClient.getClient().get(`${BASE}/jobs/${jobId}`, {
        timeout: 15000,
      });
      const { status, result, error } = res.data;
      if (status === 'completed') {
        if (!result) throw new Error('Job completed with no result');
        return result;
      }
      if (status === 'failed') {
        throw new Error(error || 'Job failed');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Timed out waiting for job to complete');
  }

  static async generateContentPlan(payload: ContentPlanPayload): Promise<ContentPlanResult> {
    // A single GPT-4o text call is fast enough to stay synchronous.
    const res: AxiosResponse<ContentPlanResult> = await UriHttpClient.getClient().post(
      `${BASE}/content-plan`,
      payload,
      {
        timeout: 300000,
      }
    );
    return res.data;
  }

  static async generateImagePathA(payload: GenerateImagePayload): Promise<ImageResult> {
    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(
      `${BASE}/generate-image`,
      payload,
      { timeout: 30000 }
    );
    return VisualEngineV2Service._pollJob<ImageResult>(start.data.job_id);
  }

  static async uploadImagePathB(params: {
    file: File;
    format?: AspectFormat;
    cleanupLevel?: CleanupLevel;
    /** Required when cleanupLevel === 'ai_recomposite' — describes the new scene to generate around the product. */
    contentPlan?: string;
  }): Promise<ImageResult> {
    const form = new FormData();
    form.append('format', params.format || '1:1');
    form.append('cleanup_level', params.cleanupLevel || 'background_removal');
    if (params.contentPlan) form.append('content_plan', params.contentPlan);
    form.append('image_file', params.file);

    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(`${BASE}/upload-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return VisualEngineV2Service._pollJob<ImageResult>(start.data.job_id);
  }

  /** PRD Section 9.1: one AI call plans the whole carousel's narrative arc — one entry per slide in content_layer.data.slides. */
  static async generateCarouselContentPlan(payload: CarouselContentPlanPayload): Promise<CarouselContentPlanResult> {
    const res: AxiosResponse<CarouselContentPlanResult> = await UriHttpClient.getClient().post(
      `${BASE}/carousel-content-plan`,
      payload,
      { timeout: 300000 }
    );
    return res.data;
  }

  /** Path A carousel: one independent GPT Image 2 generation per slide brief, run concurrently server-side. */
  static async carouselGenerateImagesPathA(payload: CarouselGenerateImagesPayload): Promise<CarouselImagesResult> {
    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(
      `${BASE}/carousel-generate-images`,
      payload,
      { timeout: 30000 }
    );
    return VisualEngineV2Service._pollJob<CarouselImagesResult>(start.data.job_id, 3000, 150);
  }

  /** Path B carousel: one uploaded photo per slide (fewer uploads than slides repeats the last one). */
  static async carouselUploadImagesPathB(params: {
    files: File[];
    carouselCount: number;
    format?: AspectFormat;
    cleanupLevel?: CleanupLevel;
  }): Promise<CarouselImagesResult> {
    const form = new FormData();
    form.append('carousel_count', String(params.carouselCount));
    form.append('format', params.format || '1:1');
    form.append('cleanup_level', params.cleanupLevel || 'background_removal');
    params.files.forEach((file) => form.append('image_files', file));

    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(
      `${BASE}/carousel-upload-images`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    );
    return VisualEngineV2Service._pollJob<CarouselImagesResult>(start.data.job_id);
  }

  static async render(payload: RenderPayload): Promise<RenderResult> {
    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(`${BASE}/render`, payload, {
      timeout: 30000,
    });
    return VisualEngineV2Service._pollJob<RenderResult>(start.data.job_id);
  }

  static async renderCarousel(payload: CarouselRenderPayload): Promise<CarouselRenderResult> {
    const start: AxiosResponse<JobStartResult> = await UriHttpClient.getClient().post(
      `${BASE}/render-carousel`,
      payload,
      { timeout: 30000 }
    );
    return VisualEngineV2Service._pollJob<CarouselRenderResult>(start.data.job_id);
  }

  /** This brand's V2-only preferences: auto-derived (or overridden) style_family, and logo control mode. */
  static async getBrandPrefs(): Promise<BrandPrefsResult> {
    const res: AxiosResponse<BrandPrefsResult> = await UriHttpClient.getClient().get(`${BASE}/brand-prefs`);
    return res.data;
  }

  static async updateBrandPrefs(payload: BrandPrefsUpdatePayload): Promise<BrandPrefsResult> {
    const res: AxiosResponse<BrandPrefsResult> = await UriHttpClient.getClient().put(`${BASE}/brand-prefs`, payload);
    return res.data;
  }

  /** PRD Section 16 success metrics, computed from this user's stored V2 renders. */
  static async getMetrics(): Promise<VisualEngineMetrics> {
    const res: AxiosResponse<VisualEngineMetrics> = await UriHttpClient.getClient().get(`${BASE}/metrics`);
    return res.data;
  }

  static async getReviewQueue(): Promise<UriResponse<{ pending_reviews: ReviewQueueItem[]; count: number }>> {
    const res: AxiosResponse<UriResponse<{ pending_reviews: ReviewQueueItem[]; count: number }>> =
      await UriHttpClient.getClient().get(`${BASE}/review-queue`);
    return res.data;
  }

  static async approveReview(reviewId: string, reviewerNotes?: string): Promise<{ success: boolean; message: string }> {
    const res: AxiosResponse<{ success: boolean; message: string }> = await UriHttpClient.getClient().post(
      `${BASE}/review/${reviewId}/approve`,
      null,
      { params: reviewerNotes ? { reviewer_notes: reviewerNotes } : {} }
    );
    return res.data;
  }

  static async rejectReview(reviewId: string, reviewerNotes?: string): Promise<{ success: boolean; message: string }> {
    const res: AxiosResponse<{ success: boolean; message: string }> = await UriHttpClient.getClient().post(
      `${BASE}/review/${reviewId}/reject`,
      null,
      { params: reviewerNotes ? { reviewer_notes: reviewerNotes } : {} }
    );
    return res.data;
  }

  static async sweepExpiredReviews(): Promise<{ success: boolean; checked: number; auto_approved: number }> {
    const res: AxiosResponse<{ success: boolean; checked: number; auto_approved: number }> =
      await UriHttpClient.getClient().post(`${BASE}/review-queue/sweep-expired`);
    return res.data;
  }

  /** Which platforms does the active brand actually have connected right now — reuses the real posting pipeline's own check. */
  static async getConnectedPlatforms(): Promise<ConnectedPlatformsResult> {
    const res: AxiosResponse<ConnectedPlatformsResult> = await UriHttpClient.getClient().get(`${BASE}/connections`);
    return res.data;
  }

  /** Bridges a completed render into the real content_drafts + posting pipeline. Omit scheduledAt to publish immediately. */
  static async publishRender(
    renderId: string,
    platform: SupportedPlatform,
    scheduledAt?: string
  ): Promise<PublishResult> {
    const res: AxiosResponse<PublishResult> = await UriHttpClient.getClient().post(
      `${BASE}/render/${renderId}/publish`,
      null,
      { params: { platform, ...(scheduledAt ? { scheduled_datetime: scheduledAt } : {}) } }
    );
    return res.data;
  }
}
