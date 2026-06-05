/**
 * V3 Service - API client for V3 prompt system
 *
 * Provides methods to:
 * - Enable/disable V3 for user
 * - Check V3 status
 * - Generate A/B comparisons (testing)
 * - Get V3 statistics
 */

import { UriHttpClient } from '@/src/configs/http.config';
import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

const V3_BASE = `${BackendUrlEnum.INSIGHTS}/social-media/v3`;
const V3_TEST_BASE = `${BackendUrlEnum.INSIGHTS}/social-media/v3/test`;

export interface V3StatusResponse {
  use_v3_prompts: boolean;
  prompt_system: 'V3 10-Block' | 'V2 6-Section';
  message: string;
}

export interface V3ToggleResponse {
  use_v3_prompts: boolean;
  message: string;
  info: string;
}

export interface V3Metadata {
  architecture: string;
  prompt: string;
  prompt_length: number;
  blocks_used: string[];
  style_slug?: string;
  has_product_reference: boolean;
  generation_time_ms: number;
  image_model: string;
  timestamp: string;
}

export interface V3ComparisonResult {
  draft_id: string;
  image_url: string;
  platform: string;
  seed_content: string;
  v3_metadata?: V3Metadata;
  prompt_used?: string;
}

export interface V3ComparisonResponse {
  comparison_id: string;
  v2_result: V3ComparisonResult;
  v3_result: V3ComparisonResult;
  prompt_diff: {
    v2_length: number;
    v3_length: number;
    length_increase_pct: number;
    v3_new_blocks: string[];
    v3_architecture: string;
    v2_architecture: string;
  };
  message?: string;
}

export interface V3StatsResponse {
  total_comparisons: number;
  v3_wins: number;
  v2_wins: number;
  v3_win_rate: number;
  v2_win_rate: number;
  avg_prompt_length_v2: number;
  avg_prompt_length_v3: number;
  prompt_length_increase: number;
  recent_comparisons: Array<{
    comparison_id: string;
    platform: string;
    chosen_version: 'v2' | 'v3';
    created_at: string;
  }>;
  recommendation: string;
}

export class V3Service {
  /**
   * Enable or disable V3 prompt system for current user
   * Updates brand_profile.use_v3_prompts field
   *
   * @param enabled - true to enable V3, false to use V2
   * @returns Response with updated status
   */
  static async toggleV3(enabled: boolean): Promise<UriResponse<V3ToggleResponse>> {
    try {
      const response: AxiosResponse<UriResponse<V3ToggleResponse>> = await UriHttpClient.getClient().post(
        `${V3_BASE}/toggle`,
        { enabled }
      );
      return response.data;
    } catch (error) {
      console.error('[V3Service] Toggle failed:', error);
      throw error;
    }
  }

  /**
   * Get current V3 status for logged-in user
   * Returns whether V3 is enabled and which prompt system is active
   *
   * @returns Current V3 status
   */
  static async getStatus(): Promise<UriResponse<V3StatusResponse>> {
    try {
      const response: AxiosResponse<UriResponse<V3StatusResponse>> = await UriHttpClient.getClient().get(
        `${V3_BASE}/status`
      );
      return response.data;
    } catch (error) {
      console.error('[V3Service] Get status failed:', error);
      throw error;
    }
  }

  /**
   * Generate image with BOTH V2 and V3 for side-by-side comparison
   * Used for testing and evaluation
   *
   * @param seedContent - Content/prompt to generate from
   * @param platform - Target platform (instagram, linkedin, etc.)
   * @param referenceImage - Optional product image URL
   * @returns Comparison with both V2 and V3 results
   */
  static async compareGeneration(
    seedContent: string,
    platform: string = 'instagram',
    referenceImage?: string
  ): Promise<UriResponse<V3ComparisonResponse>> {
    try {
      const response: AxiosResponse<UriResponse<V3ComparisonResponse>> = await UriHttpClient.getClient().post(
        `${V3_TEST_BASE}/compare-generation`,
        {
          seed_content: seedContent,
          platform,
          reference_image: referenceImage,
        }
      );
      return response.data;
    } catch (error) {
      console.error('[V3Service] Compare generation failed:', error);
      throw error;
    }
  }

  /**
   * Record which version (V2 or V3) user chose from comparison
   * This is the PRIMARY success metric for V3 testing
   *
   * @param comparisonId - ID from compareGeneration response
   * @param chosenVersion - 'v2' or 'v3'
   * @returns Confirmation response
   */
  static async recordChoice(
    comparisonId: string,
    chosenVersion: 'v2' | 'v3'
  ): Promise<UriResponse<Record<string, unknown>>> {
    try {
      const response: AxiosResponse<UriResponse<Record<string, unknown>>> = await UriHttpClient.getClient().post(
        `${V3_TEST_BASE}/record-choice`,
        {
          comparison_id: comparisonId,
          chosen_version: chosenVersion,
        }
      );
      return response.data;
    } catch (error) {
      console.error('[V3Service] Record choice failed:', error);
      throw error;
    }
  }

  /**
   * Get V3 testing statistics
   * Shows win rates, prompt lengths, recent comparisons
   *
   * @returns V3 performance statistics
   */
  static async getStats(): Promise<UriResponse<V3StatsResponse>> {
    try {
      const response: AxiosResponse<UriResponse<V3StatsResponse>> = await UriHttpClient.getClient().get(
        `${V3_TEST_BASE}/stats`
      );
      return response.data;
    } catch (error) {
      console.error('[V3Service] Get stats failed:', error);
      throw error;
    }
  }
}
