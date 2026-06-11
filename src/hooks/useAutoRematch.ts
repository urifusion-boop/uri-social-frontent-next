import { CustomVisualGuideService } from '@/src/api/CustomVisualGuideService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

/**
 * Auto-Rematch Hook for Custom Visual Guides
 *
 * PRD Section 11.7: When a user uploads a new custom font, automatically
 * re-run font matching for all guides with NO_RECOMMENDED_MATCH or NO_MATCH outcomes.
 *
 * This hook provides a function to trigger auto-rematch after font upload.
 */
export function useAutoRematch() {
  const triggerAutoRematch = async (newFontId: string): Promise<string[]> => {
    try {
      console.log('[AutoRematch] Triggering auto-rematch for new font:', newFontId);

      const updatedGuideIds = await CustomVisualGuideService.autoRematchAfterFontUpload(newFontId);

      if (updatedGuideIds.length > 0) {
        ToastService.showToast(
          `🎉 ${updatedGuideIds.length} custom guide${updatedGuideIds.length > 1 ? 's' : ''} now have better font matches!`,
          ToastTypeEnum.Success
        );
      } else {
        console.log('[AutoRematch] No guides were updated');
      }

      return updatedGuideIds;
    } catch (error: any) {
      console.error('[AutoRematch] Error during auto-rematch:', error);
      // Silently fail - don't interrupt font upload flow
      return [];
    }
  };

  return { triggerAutoRematch };
}

/**
 * Helper function to trigger auto-rematch (can be called from anywhere)
 *
 * Usage:
 * ```ts
 * import { triggerAutoRematchForFont } from '@/src/hooks/useAutoRematch';
 *
 * // After successfully uploading a font
 * const fontId = 'font_123';
 * await triggerAutoRematchForFont(fontId);
 * ```
 */
export async function triggerAutoRematchForFont(newFontId: string): Promise<string[]> {
  try {
    console.log('[AutoRematch] Triggering auto-rematch for new font:', newFontId);

    const updatedGuideIds = await CustomVisualGuideService.autoRematchAfterFontUpload(newFontId);

    if (updatedGuideIds.length > 0) {
      ToastService.showToast(
        `🎉 ${updatedGuideIds.length} custom guide${updatedGuideIds.length > 1 ? 's' : ''} now have better font matches!`,
        ToastTypeEnum.Success
      );
    }

    return updatedGuideIds;
  } catch (error: any) {
    console.error('[AutoRematch] Error during auto-rematch:', error);
    return [];
  }
}
