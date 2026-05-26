import { UriHttpClient } from '@/src/configs/http.config';
import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

const BASE = `${BackendUrlEnum.INSIGHTS}/social-media/ai-marketing-images`;

export interface PromptSection {
  name: string;
  content: string[];
}

export interface AIMarketingTemplate {
  template_id: string;
  name: string;
  description: string;
  category: 'editorial' | 'beverage' | 'food' | 'ecommerce';
  default_aspect_ratio: string;
  default_size: string;
  variables: string[];
  sections: PromptSection[];
  example_images: string[];
  is_active: boolean;
  is_premium: boolean;
  usage_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AIImageGeneration {
  id: string;
  user_id: string;
  workspace_id?: string;
  template_id: string;
  template_name: string;
  prompt: string;
  variables: Record<string, string>;
  size: string;
  aspect_ratio: string;
  image_url?: string;
  dalle_url?: string;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  provider: string;
  cost_credits: number;
  cost_usd: number;
  generation_time_ms?: number;
  created_at: string;
}

export interface GenerateImageRequest {
  template_id: string;
  variables: Record<string, string>;
  aspect_ratio?: string;
}

export interface GenerationStats {
  total_generations: number;
  total_cost_usd: number;
  generations_this_month: number;
  cost_this_month_usd: number;
  templates_used: string[];
  most_used_template?: string;
}

export class AIMarketingImageService {
  /**
   * List all available templates
   */
  static async listTemplates(category?: string): Promise<AxiosResponse<UriResponse<AIMarketingTemplate[]>>> {
    const params = category ? { category } : {};
    return UriHttpClient.get(`${BASE}/templates`, { params });
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplate(templateId: string): Promise<AxiosResponse<UriResponse<AIMarketingTemplate>>> {
    return UriHttpClient.get(`${BASE}/templates/${templateId}`);
  }

  /**
   * Generate an AI marketing image
   */
  static async generateImage(request: GenerateImageRequest): Promise<AxiosResponse<UriResponse<AIImageGeneration>>> {
    return UriHttpClient.post(`${BASE}/generate`, request);
  }

  /**
   * Get user's generation history
   */
  static async getGenerationHistory(limit: number = 50): Promise<AxiosResponse<UriResponse<AIImageGeneration[]>>> {
    return UriHttpClient.get(`${BASE}/generations`, { params: { limit } });
  }

  /**
   * Get user's generation statistics
   */
  static async getStats(): Promise<AxiosResponse<UriResponse<GenerationStats>>> {
    return UriHttpClient.get(`${BASE}/stats`);
  }

  /**
   * Get available template categories
   */
  static async getCategories(): Promise<AxiosResponse<UriResponse<string[]>>> {
    return UriHttpClient.get(`${BASE}/categories`);
  }
}
