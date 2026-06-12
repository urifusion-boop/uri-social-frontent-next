/**
 * Canvas Editor Type Definitions
 *
 * Matches backend layered document structure from LayeredDocumentService
 */

export interface CanvasConfig {
  width: number;
  height: number;
  background_color?: string;
  aspect_ratio?: string;
}

export interface BaseLayer {
  id: string;
  type: string;
  z_index: number;
  visible: boolean;
  locked: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'ai_generated_background';
  url: string;
  generation_prompt?: string;
  style_slug?: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  font_family: string;
  font_size: number;
  font_weight?: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  vertical_align?: 'top' | 'middle' | 'bottom';
  line_height?: number;
  letter_spacing?: number;
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface BrandAssetLayer extends BaseLayer {
  type: 'brand_asset';
  asset_type: 'logo' | 'product' | 'icon';
  url: string;
  original_url?: string;
}

export type Layer = BackgroundLayer | TextLayer | BrandAssetLayer;

export interface LayeredDocument {
  id: string;
  version: number;
  canvas: CanvasConfig;
  layers: Layer[];
  metadata: {
    created_at: string;
    updated_at?: string;
    user_id?: string;
    draft_id?: string;
  };
}

export interface DocumentEdit {
  id: string;
  draft_id: string;
  user_id: string;
  edit_type: 'text_change' | 'move' | 'resize' | 'color' | 'visibility' | 'property_change';
  layer_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: string;
  undone: boolean;
}

export interface UpdateLayerPayload {
  layer_id: string;
  updates: Partial<Layer>;
}

export interface RenderDocumentPayload {
  aspect_ratio?: '1:1' | '9:16' | '4:5' | '16:9';
  output_format?: 'png' | 'jpg';
  quality?: number;
}

export interface CanvasEditorState {
  document: LayeredDocument | null;
  selectedLayerId: string | null;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isRendering: boolean;
}
