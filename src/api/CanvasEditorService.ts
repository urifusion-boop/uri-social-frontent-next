/**
 * Canvas Editor API Service
 *
 * Handles all API calls to Canvas Editor backend endpoints
 */

import http from '@/src/configs/http.config';
import {
  LayeredDocument,
  RenderDocumentPayload,
  DocumentEdit,
} from '@/src/types/canvas.types';

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
   * Get layered document for a draft
   */
  static async getDocument(draftId: string): Promise<CanvasDocumentResponse> {
    const response = await http.get<CanvasDocumentResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/document`
    );
    return response.data;
  }

  /**
   * Update a specific layer's properties
   */
  static async updateLayer(
    draftId: string,
    layerId: string,
    updates: Record<string, unknown>
  ): Promise<LayerUpdateResponse> {
    const response = await http.post<LayerUpdateResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/${layerId}/update`,
      { layer_id: layerId, updates }
    );
    return response.data;
  }

  /**
   * Undo the last edit
   */
  static async undo(draftId: string): Promise<LayerUpdateResponse> {
    const response = await http.post<LayerUpdateResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/undo`
    );
    return response.data;
  }

  /**
   * Redo the last undone edit
   */
  static async redo(draftId: string): Promise<LayerUpdateResponse> {
    const response = await http.post<LayerUpdateResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/redo`
    );
    return response.data;
  }

  /**
   * Render document to final image
   */
  static async render(
    draftId: string,
    payload: RenderDocumentPayload = {}
  ): Promise<RenderResponse> {
    const response = await http.post<RenderResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/render`,
      payload
    );
    return response.data;
  }

  /**
   * Reorder layers
   */
  static async reorderLayers(
    draftId: string,
    layerOrder: string[]
  ): Promise<LayerUpdateResponse> {
    const response = await http.post<LayerUpdateResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/reorder`,
      { layer_order: layerOrder }
    );
    return response.data;
  }

  /**
   * Delete a layer
   */
  static async deleteLayer(draftId: string, layerId: string): Promise<LayerUpdateResponse> {
    const response = await http.delete<LayerUpdateResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/layers/${layerId}`
    );
    return response.data;
  }

  /**
   * Get edit history
   */
  static async getEditHistory(draftId: string, limit = 50): Promise<EditHistoryResponse> {
    const response = await http.get<EditHistoryResponse>(
      `${this.BASE_PATH}/drafts/${draftId}/edit-history`,
      { params: { limit } }
    );
    return response.data;
  }
}
