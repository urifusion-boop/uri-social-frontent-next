import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

const BASE = '/social-media/custom-guides';

// ============================================================================
// TYPES
// ============================================================================

export interface AestheticSummary {
  visual_genre: string;
  mood: {
    primary: string;
    secondary?: string;
  };
  color_palette: {
    primary_colors: string[];
    temperature: string;
    saturation: string;
    contrast: string;
  };
  lighting: string;
}

export interface TypographyMatch {
  has_typography: boolean;
  match_outcome: MatchOutcome;
  matched_font_id?: string;
  matched_font_name?: string;
  match_confidence?: 'high' | 'medium' | 'low';
  identified_font_name?: string;
  next_step_suggestion?: NextStepSuggestion;
  alternative_matches?: FontMatch[];
}

export type MatchOutcome =
  | 'STRONG_MATCH'
  | 'DECENT_MATCH'
  | 'WEAK_MATCH'
  | 'NO_RECOMMENDED_MATCH'
  | 'NO_MATCH'
  | 'NO_TYPOGRAPHY'
  | 'DECORATIVE_ACCEPTED';

export interface FontMatch {
  font_id: string;
  font_name: string;
  match_score: number;
  match_confidence: 'high' | 'medium' | 'low';
  source: 'library' | 'user_upload';
}

export interface NextStepSuggestion {
  type:
    | 'use_match'
    | 'use_match_with_caveat'
    | 'upload_identified'
    | 'upload_descriptive'
    | 'use_brand_default_decorative'
    | 'use_brand_default';
  message: string;
  actionable_link?: string;
}

export interface CustomVisualGuide {
  id: string;
  name: string;
  original_image_url: string;
  uploaded_at: string;
  aesthetic_summary: AestheticSummary;
  typography_match: TypographyMatch;
  match_outcome: MatchOutcome;
  metadata_tags: Record<string, string | number | boolean>;
  times_used: number;
  status: 'active' | 'archived';
}

export interface CustomVisualGuideDetail extends CustomVisualGuide {
  aesthetic_profile: Record<string, string | number | boolean | object>;
  prompt_fragment: string;
  typography_extraction: Record<string, string | number | boolean | object>;
}

export interface UploadReferenceImageRequest {
  image_url: string;
  name: string;
  brand_id?: string;
}

export interface UpdateGuideFontRequest {
  matched_font_id: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class CustomVisualGuideService {
  static async uploadImageFile(file: File): Promise<UriResponse<{ url: string }>> {
    const form = new FormData();
    form.append('file', file);
    const res: AxiosResponse<UriResponse<{ url: string }>> = await UriHttpClient.getClient().post(
      '/social-media/agent/chat/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }

  static async uploadReferenceImage(
    imageUrl: string,
    name: string,
    brandId?: string
  ): Promise<UriResponse<CustomVisualGuide>> {
    const res: AxiosResponse<UriResponse<CustomVisualGuide>> = await UriHttpClient.getClient().post(
      `${BASE}/upload`,
      { image_url: imageUrl, name, brand_id: brandId }
    );
    return res.data;
  }

  static async getUserGuides(status: 'active' | 'archived' = 'active'): Promise<UriResponse<{ guides: CustomVisualGuide[] }>> {
    const res: AxiosResponse<UriResponse<{ guides: CustomVisualGuide[] }>> = await UriHttpClient.getClient().get(BASE, {
      params: { status },
    });
    return res.data;
  }

  static async getGuideDetail(guideId: string): Promise<UriResponse<CustomVisualGuideDetail>> {
    const res: AxiosResponse<UriResponse<CustomVisualGuideDetail>> = await UriHttpClient.getClient().get(
      `${BASE}/${guideId}`
    );
    return res.data;
  }

  static async updateGuideFont(guideId: string, matchedFontId: string): Promise<UriResponse<null>> {
    const res: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().patch(`${BASE}/${guideId}/font`, {
      matched_font_id: matchedFontId,
    });
    return res.data;
  }

  static async archiveGuide(guideId: string): Promise<UriResponse<null>> {
    const res: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().delete(`${BASE}/${guideId}`);
    return res.data;
  }

  static async rematchFonts(
    guideId: string
  ): Promise<UriResponse<{ match_outcome: MatchOutcome; matched_font_id?: string; match_confidence?: string }>> {
    const res: AxiosResponse<
      UriResponse<{ match_outcome: MatchOutcome; matched_font_id?: string; match_confidence?: string }>
    > = await UriHttpClient.getClient().post(`${BASE}/${guideId}/rematch`, {});
    return res.data;
  }

  static async autoRematchAfterFontUpload(newFontId: string): Promise<UriResponse<{ updated_guide_ids: string[] }>> {
    const res: AxiosResponse<UriResponse<{ updated_guide_ids: string[] }>> = await UriHttpClient.getClient().post(
      `${BASE}/auto-rematch`,
      {},
      { params: { new_font_id: newFontId } }
    );
    return res.data;
  }

  static async trackGuideUsage(guideId: string, appliedFont: boolean = false): Promise<UriResponse<null>> {
    const res: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().post(
      `${BASE}/${guideId}/track-usage`,
      {},
      { params: { applied_font: appliedFont } }
    );
    return res.data;
  }
}
