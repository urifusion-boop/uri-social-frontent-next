import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

const BASE = '/social-media/custom-guides-v2';

// ============================================================================
// TYPES
// ============================================================================

export interface StyleProfile {
  medium: string;
  aesthetic_dominance: 'low' | 'medium' | 'high';
  overall_aesthetic: string;
  mood: string;
  layout_structure: {
    composition: string;
    information_density: string;
    focal_strategy: string;
    structural_devices: string[];
  };
  imagery_style: {
    subject_type: string;
    lighting: string;
    treatment: string;
    realism_level: string;
  };
  color_system: {
    dominant_color: string;
    accent_strategy: string;
    palette_role: string;
    temperature: string;
    saturation: string;
    contrast: string;
  };
  graphic_elements: string[];
  typography: {
    character: string;
    hierarchy: string;
    text_placement: string;
    text_treatment: string;
  };
  what_to_leave_behind: string[];
}

export interface StyleSummary {
  medium: string;
  overall_aesthetic: string;
  mood: string;
  color_system?: {
    dominant_color: string;
    accent_strategy: string;
  };
  typography_character?: string;
}

export interface CustomVisualGuideV2 {
  id: string;
  name: string;
  version: 'v2';
  original_image_url: string;
  uploaded_at: string;
  style_summary: StyleSummary;
  identity_elements_excluded: number;
  times_used: number;
  status: 'active' | 'archived';
}

export interface CustomVisualGuideV2Detail extends CustomVisualGuideV2 {
  style_profile: StyleProfile;
  last_used_at: string | null;
}

export interface UploadReferenceImageV2Request {
  image_url: string;
  name: string;
  brand_id?: string;
}

export interface GenerateWithV2GuideRequest {
  guide_id: string;
  seed_content: string;
  headline: string;
  subtext?: string;
  cta?: string;
  platform: string;
}

export interface GenerateWithV2GuideResponse {
  success: boolean;
  image_url: string;
  image_prompt: string;
  reserved_text_zones: Array<{
    zone: string;
    position: string;
    text: string;
    style_note: string;
  }>;
  brand_overlay: {
    logo: string;
    handle: string;
    colors_used: string[];
  };
  identity_safety_check: {
    reference_identity_excluded: string[];
    only_target_brand_present: boolean;
    medium_preserved: string;
    aesthetic_dominance_applied: string;
  };
  style_profile_used: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class CustomVisualGuideV2Service {
  /**
   * Upload image file to Cloudinary (reuses V1 endpoint)
   */
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

  /**
   * Upload and process reference image for V2 guide
   * Extracts comprehensive style profile using GPT-4o Vision
   */
  static async uploadReferenceImageV2(
    imageUrl: string,
    name: string,
    brandId?: string
  ): Promise<UriResponse<CustomVisualGuideV2>> {
    const res: AxiosResponse<UriResponse<CustomVisualGuideV2>> = await UriHttpClient.getClient().post(
      `${BASE}/upload`,
      { image_url: imageUrl, name, brand_id: brandId }
    );
    return res.data;
  }

  /**
   * Get all V2 guides for current user
   */
  static async getUserGuidesV2(status: 'active' | 'archived' = 'active'): Promise<UriResponse<CustomVisualGuideV2[]>> {
    const res: AxiosResponse<UriResponse<CustomVisualGuideV2[]>> = await UriHttpClient.getClient().get(BASE, {
      params: { status },
    });
    return res.data;
  }

  /**
   * Get detailed V2 guide (includes full style profile)
   */
  static async getGuideDetailV2(guideId: string): Promise<UriResponse<CustomVisualGuideV2Detail>> {
    const res: AxiosResponse<UriResponse<CustomVisualGuideV2Detail>> = await UriHttpClient.getClient().get(
      `${BASE}/${guideId}`
    );
    return res.data;
  }

  /**
   * Archive V2 guide
   */
  static async archiveGuideV2(guideId: string): Promise<UriResponse<null>> {
    const res: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().delete(`${BASE}/${guideId}`);
    return res.data;
  }

  /**
   * Generate image using V2 guide with meta-prompt
   */
  static async generateWithV2Guide(
    request: GenerateWithV2GuideRequest
  ): Promise<UriResponse<GenerateWithV2GuideResponse>> {
    const res: AxiosResponse<UriResponse<GenerateWithV2GuideResponse>> = await UriHttpClient.getClient().post(
      `${BASE}/generate`,
      request
    );
    return res.data;
  }
}
