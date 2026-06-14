/**
 * Canvas Editor API Service
 *
 * Handles all API calls to Canvas Editor backend endpoints
 */

import { UriHttpClient } from '@/src/configs/http.config';
import { LayeredDocument, RenderDocumentPayload, DocumentEdit } from '@/src/types/canvas.types';
import { AxiosResponse } from 'axios';

interface UriResponse<T = unknown> {
  status: boolean;
  responseCode: number;
  responseMessage: string;
  responseData?: T;
}

export interface CanvasDocumentResponse {
  draft_id: string;
  document: LayeredDocument;
  document_version: number;
  preview_url: string;
  platform: string;
  created_at: string;
}

export interface LayerUpdateResponse {
  draft_id: string;
  layer_id: string;
  document: LayeredDocument;
  document_version: number;
}

export interface RenderResponse {
  draft_id: string;
  aspect_ratio: string;
  output_format: string;
  image_url: string;
  image_base64: string;
  size_bytes: number;
}

export interface EditHistoryResponse {
  draft_id: string;
  total_edits: number;
  edits: DocumentEdit[];
}

export class CanvasEditorService {
  private static readonly BASE_PATH = '/social-media/canvas-editor';

  /**
   * Handle UriResponse format and extract data or throw error
   */
  private static handleResponse<T>(response: AxiosResponse<UriResponse<T>>, errorMessage: string): T {
    // Handle UriResponse format: {status, responseCode, responseMessage, responseData}
    if (response.data && response.data.status === false) {
      throw new Error(response.data.responseMessage || errorMessage);
    }
    // Extract responseData if present, otherwise use data directly
    return (response.data.responseData || response.data) as T;
  }

  /**
   * Get layered document for a draft
   */
  static async getDocument(draftId: string): Promise<CanvasDocumentResponse> {
    const response = await UriHttpClient.getClient().get<UriResponse<CanvasDocumentResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/document`
    );
    return this.handleResponse<CanvasDocumentResponse>(response, 'Failed to load canvas document');
  }

  /**
   * Update a specific layer's properties
   */
  static async updateLayer(
    draftId: string,
    layerId: string,
    updates: Record<string, unknown>
  ): Promise<LayerUpdateResponse> {
    const response = await UriHttpClient.getClient().post<UriResponse<LayerUpdateResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/${layerId}/update`,
      { layer_id: layerId, updates }
    );
    return this.handleResponse<LayerUpdateResponse>(response, 'Failed to update layer');
  }

  /**
   * Undo the last edit
   */
  static async undo(draftId: string): Promise<LayerUpdateResponse> {
    const response = await UriHttpClient.getClient().post<UriResponse<LayerUpdateResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/undo`
    );
    return this.handleResponse<LayerUpdateResponse>(response, 'Failed to undo');
  }

  /**
   * Redo the last undone edit
   */
  static async redo(draftId: string): Promise<LayerUpdateResponse> {
    const response = await UriHttpClient.getClient().post<UriResponse<LayerUpdateResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/redo`
    );
    return this.handleResponse<LayerUpdateResponse>(response, 'Failed to redo');
  }

  /**
   * Render document to final image
   */
  static async render(draftId: string, payload: RenderDocumentPayload = {}): Promise<RenderResponse> {
    const response = await UriHttpClient.getClient().post<UriResponse<RenderResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/render`,
      payload
    );
    return this.handleResponse<RenderResponse>(response, 'Failed to render document');
  }

  /**
   * Reorder layers
   */
  static async reorderLayers(draftId: string, layerOrder: string[]): Promise<LayerUpdateResponse> {
    const response = await UriHttpClient.getClient().post<UriResponse<LayerUpdateResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/reorder`,
      { layer_order: layerOrder }
    );
    return this.handleResponse<LayerUpdateResponse>(response, 'Failed to reorder layers');
  }

  /**
   * Delete a layer
   */
  static async deleteLayer(draftId: string, layerId: string): Promise<LayerUpdateResponse> {
    const response = await UriHttpClient.getClient().delete<UriResponse<LayerUpdateResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/${layerId}`
    );
    return this.handleResponse<LayerUpdateResponse>(response, 'Failed to delete layer');
  }

  /**
   * Get edit history
   */
  static async getEditHistory(draftId: string, limit = 50): Promise<EditHistoryResponse> {
    const response = await UriHttpClient.getClient().get<UriResponse<EditHistoryResponse>>(
      `${this.BASE_PATH}/drafts/${draftId}/edit-history`,
      { params: { limit } }
    );
    return this.handleResponse<EditHistoryResponse>(response, 'Failed to get edit history');
  }
}
