// src/api/CustomVisualGuideService.ts

/**
 * Custom Visual Guide API Service
 * Handles reference image upload, analysis, font matching, and guide management.
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9003';

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
  type: 'use_match' | 'use_match_with_caveat' | 'upload_identified' | 'upload_descriptive' | 'use_brand_default_decorative' | 'use_brand_default';
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
  metadata_tags: Record<string, any>;
  times_used: number;
  status: 'active' | 'archived';
}

export interface CustomVisualGuideDetail extends CustomVisualGuide {
  aesthetic_profile: Record<string, any>;
  prompt_fragment: string;
  typography_extraction: Record<string, any>;
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
  private static get authHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Upload image file to Cloudinary
   */
  static async uploadImageFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/social-media/agent/chat/upload`,
        formData,
        {
          headers: {
            ...this.authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status) {
        return response.data.responseData.url;
      }
      throw new Error(response.data.message || 'Failed to upload image');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error uploading image file:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to upload image'
      );
    }
  }

  /**
   * Upload and process a reference image to create a custom visual guide
   */
  static async uploadReferenceImage(
    imageUrl: string,
    name: string,
    brandId?: string
  ): Promise<CustomVisualGuide> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/social-media/custom-guides/upload`,
        {
          image_url: imageUrl,
          name,
          brand_id: brandId,
        } as UploadReferenceImageRequest,
        { headers: this.authHeaders }
      );

      if (response.data.status) {
        return response.data.responseData;
      }
      throw new Error(response.data.message || 'Failed to upload reference image');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error uploading reference image:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to upload reference image'
      );
    }
  }

  /**
   * Get all custom visual guides for the authenticated user
   */
  static async getUserGuides(status: 'active' | 'archived' = 'active'): Promise<CustomVisualGuide[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/social-media/custom-guides`,
        {
          params: { status },
          headers: this.authHeaders
        }
      );

      if (response.data.status) {
        return response.data.responseData.guides || [];
      }
      throw new Error(response.data.message || 'Failed to fetch guides');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error fetching guides:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to fetch guides'
      );
    }
  }

  /**
   * Get detailed information for a specific guide
   */
  static async getGuideDetail(guideId: string): Promise<CustomVisualGuideDetail> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/social-media/custom-guides/${guideId}`,
        { headers: this.authHeaders }
      );

      if (response.data.status) {
        return response.data.responseData;
      }
      throw new Error(response.data.message || 'Failed to fetch guide detail');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error fetching guide detail:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to fetch guide detail'
      );
    }
  }

  /**
   * Update the matched font for a guide
   */
  static async updateGuideFont(
    guideId: string,
    matchedFontId: string
  ): Promise<void> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/social-media/custom-guides/${guideId}/font`,
        { matched_font_id: matchedFontId } as UpdateGuideFontRequest,
        { headers: this.authHeaders }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to update font');
      }
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error updating font:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update font'
      );
    }
  }

  /**
   * Archive (soft delete) a custom visual guide
   */
  static async archiveGuide(guideId: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/social-media/custom-guides/${guideId}`,
        { headers: this.authHeaders }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to archive guide');
      }
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error archiving guide:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to archive guide'
      );
    }
  }

  /**
   * Re-run font matching for a guide
   */
  static async rematchFonts(guideId: string): Promise<{
    match_outcome: MatchOutcome;
    matched_font_id?: string;
    match_confidence?: string;
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/social-media/custom-guides/${guideId}/rematch`,
        {},
        { headers: this.authHeaders }
      );

      if (response.data.status) {
        return response.data.responseData;
      }
      throw new Error(response.data.message || 'Failed to rematch fonts');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error rematching fonts:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to rematch fonts'
      );
    }
  }

  /**
   * Auto-rematch guides after uploading a new custom font
   * PRD Section 11.7
   */
  static async autoRematchAfterFontUpload(newFontId: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/social-media/custom-guides/auto-rematch`,
        {},
        {
          params: { new_font_id: newFontId },
          headers: this.authHeaders
        }
      );

      if (response.data.status) {
        return response.data.responseData.updated_guide_ids || [];
      }
      throw new Error(response.data.message || 'Failed to auto-rematch');
    } catch (error: any) {
      console.error('[CustomVisualGuideService] Error in auto-rematch:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to auto-rematch'
      );
    }
  }

  /**
   * Track guide usage when generating content
   */
  static async trackGuideUsage(guideId: string, appliedFont: boolean = false): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/social-media/custom-guides/${guideId}/track-usage`,
        {},
        {
          params: { applied_font: appliedFont },
          headers: this.authHeaders
        }
      );
    } catch (error: any) {
      // Silently fail - analytics shouldn't break user flow
      console.warn('[CustomVisualGuideService] Failed to track usage:', error);
    }
  }
}
