/**
 * Main Canvas Editor Hook
 *
 * Manages document state, layer selection, and API interactions
 */

import { useState, useCallback, useEffect } from 'react';
import { CanvasEditorService } from '@/src/api/CanvasEditorService';
import { Layer, CanvasEditorState } from '@/src/types/canvas.types';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

export function useCanvasEditor(draftId: string) {
  const [state, setState] = useState<CanvasEditorState>({
    document: null,
    selectedLayerId: null,
    isDirty: false,
    canUndo: false,
    canRedo: false,
    isRendering: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load document from API
   */
  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await CanvasEditorService.getDocument(draftId);
      setState((prev) => ({
        ...prev,
        document: response.document,
        isDirty: false,
      }));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load canvas document';
      setError(errorMsg);
      ToastService.showToast(errorMsg, ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  /**
   * Update a specific layer
   */
  const updateLayer = useCallback(
    async (layerId: string, updates: Partial<Layer>) => {
      if (!state.document) return;

      try {
        const response = await CanvasEditorService.updateLayer(draftId, layerId, updates);

        setState((prev) => ({
          ...prev,
          document: response.document,
          isDirty: true,
          canUndo: true,
        }));
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update layer';
        ToastService.showToast(errorMsg, ToastTypeEnum.Error);
        throw err;
      }
    },
    [draftId, state.document]
  );

  /**
   * Select a layer
   */
  const selectLayer = useCallback((layerId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedLayerId: layerId,
    }));
  }, []);

  /**
   * Get selected layer
   */
  const getSelectedLayer = useCallback((): Layer | null => {
    if (!state.document || !state.selectedLayerId) return null;
    return state.document.layers.find((l) => l.id === state.selectedLayerId) || null;
  }, [state.document, state.selectedLayerId]);

  /**
   * Undo last edit
   */
  const undo = useCallback(async () => {
    try {
      const response = await CanvasEditorService.undo(draftId);
      setState((prev) => ({
        ...prev,
        document: response.document,
        canRedo: true,
      }));
      ToastService.showToast('Undone', ToastTypeEnum.Success);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Nothing to undo';
      ToastService.showToast(errorMsg, ToastTypeEnum.Warning);
    }
  }, [draftId]);

  /**
   * Redo last undone edit
   */
  const redo = useCallback(async () => {
    try {
      const response = await CanvasEditorService.redo(draftId);
      setState((prev) => ({
        ...prev,
        document: response.document,
        canUndo: true,
      }));
      ToastService.showToast('Redone', ToastTypeEnum.Success);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Nothing to redo';
      ToastService.showToast(errorMsg, ToastTypeEnum.Warning);
    }
  }, [draftId]);

  /**
   * Delete a layer
   */
  const deleteLayer = useCallback(
    async (layerId: string) => {
      try {
        const response = await CanvasEditorService.deleteLayer(draftId, layerId);
        setState((prev) => ({
          ...prev,
          document: response.document,
          selectedLayerId: prev.selectedLayerId === layerId ? null : prev.selectedLayerId,
          isDirty: true,
        }));
        ToastService.showToast('Layer deleted', ToastTypeEnum.Success);
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete layer';
        ToastService.showToast(errorMsg, ToastTypeEnum.Error);
        throw err;
      }
    },
    [draftId]
  );

  /**
   * Reorder layers
   */
  const reorderLayers = useCallback(
    async (layerOrder: string[]) => {
      try {
        const response = await CanvasEditorService.reorderLayers(draftId, layerOrder);
        setState((prev) => ({
          ...prev,
          document: response.document,
          isDirty: true,
        }));
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to reorder layers';
        ToastService.showToast(errorMsg, ToastTypeEnum.Error);
        throw err;
      }
    },
    [draftId]
  );

  /**
   * Render document to image
   */
  const renderDocument = useCallback(
    async (aspectRatio: '1:1' | '9:16' | '4:5' | '16:9' = '1:1') => {
      try {
        setState((prev) => ({ ...prev, isRendering: true }));
        const response = await CanvasEditorService.render(draftId, {
          aspect_ratio: aspectRatio,
          output_format: 'png',
          quality: 95,
        });
        ToastService.showToast(`Rendered ${aspectRatio} image`, ToastTypeEnum.Success);
        return response;
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to render document';
        ToastService.showToast(errorMsg, ToastTypeEnum.Error);
        throw err;
      } finally {
        setState((prev) => ({ ...prev, isRendering: false }));
      }
    },
    [draftId]
  );

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback(
    async (layerId: string) => {
      const layer = state.document?.layers.find((l) => l.id === layerId);
      if (!layer) return;

      await updateLayer(layerId, { visible: !layer.visible });
    },
    [state.document, updateLayer]
  );

  /**
   * Load document on mount
   */
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  return {
    // State
    document: state.document,
    selectedLayerId: state.selectedLayerId,
    isDirty: state.isDirty,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    isRendering: state.isRendering,
    loading,
    error,

    // Actions
    loadDocument,
    updateLayer,
    selectLayer,
    getSelectedLayer,
    undo,
    redo,
    deleteLayer,
    reorderLayers,
    renderDocument,
    toggleLayerVisibility,
  };
}
