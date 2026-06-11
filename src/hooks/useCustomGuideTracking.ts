import { CustomVisualGuideService } from '@/src/api/CustomVisualGuideService';

/**
 * Custom Guide Usage Tracking Hook
 *
 * PRD Section 9.3: Track guide usage for analytics
 *
 * This hook provides functions to track:
 * - When a guide is used for content generation
 * - Whether the matched font was applied
 */
export function useCustomGuideTracking() {
  /**
   * Track guide usage when generating content
   *
   * @param guideId - ID of the custom guide being used
   * @param appliedFont - Whether the matched font from the guide was applied
   */
  const trackGuideUsage = async (guideId: string, appliedFont: boolean = false): Promise<void> => {
    try {
      console.log('[GuideTracking] Tracking usage:', { guideId, appliedFont });
      await CustomVisualGuideService.trackGuideUsage(guideId, appliedFont);
    } catch (error) {
      // Silently fail - analytics shouldn't break user flow
      console.warn('[GuideTracking] Failed to track usage:', error);
    }
  };

  return { trackGuideUsage };
}

/**
 * Helper function to track guide usage (can be called from anywhere)
 *
 * Usage:
 * ```ts
 * import { trackCustomGuideUsage } from '@/src/hooks/useCustomGuideTracking';
 *
 * // When generating content with a custom guide
 * await trackCustomGuideUsage('guide_123', true); // true if matched font was applied
 * ```
 */
export async function trackCustomGuideUsage(guideId: string, appliedFont: boolean = false): Promise<void> {
  try {
    console.log('[GuideTracking] Tracking usage:', { guideId, appliedFont });
    await CustomVisualGuideService.trackGuideUsage(guideId, appliedFont);
  } catch (error) {
    console.warn('[GuideTracking] Failed to track usage:', error);
  }
}
