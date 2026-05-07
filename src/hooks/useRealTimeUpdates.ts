/**
 * Custom hooks for real-time updates across the application
 * Enterprise-grade event-driven state management
 */

import { useEffect, useState, useCallback } from 'react';
import { EventBus, EVENTS, EventData } from '@/src/services/EventBus';

/**
 * Hook to listen for credit balance updates
 * Any component can use this to react to credit changes
 */
export function useCreditUpdates() {
  const [creditData, setCreditData] = useState<EventData[typeof EVENTS.CREDIT_UPDATED] | null>(null);

  useEffect(() => {
    const unsubscribe = EventBus.on(EVENTS.CREDIT_UPDATED, (data) => {
      setCreditData(data);
    });

    return () => unsubscribe();
  }, []);

  return creditData;
}

/**
 * Hook to listen for image edit completion
 * @param draftId - Optional draft ID to filter events
 */
export function useImageEditUpdates(draftId?: string) {
  const [editStatus, setEditStatus] = useState<{
    status: 'idle' | 'editing' | 'completed' | 'failed';
    data?: EventData[typeof EVENTS.IMAGE_EDIT_COMPLETED];
    error?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    const unsubscribeStarted = EventBus.on(EVENTS.IMAGE_EDIT_STARTED, (data) => {
      if (!draftId || data?.draftId === draftId) {
        setEditStatus({ status: 'editing' });
      }
    });

    const unsubscribeCompleted = EventBus.on(EVENTS.IMAGE_EDIT_COMPLETED, (data) => {
      if (!draftId || data?.draftId === draftId) {
        setEditStatus({ status: 'completed', data });
      }
    });

    const unsubscribeFailed = EventBus.on(EVENTS.IMAGE_EDIT_FAILED, (data) => {
      if (!draftId || data?.draftId === draftId) {
        setEditStatus({ status: 'failed', error: data?.error });
      }
    });

    return () => {
      unsubscribeStarted();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [draftId]);

  const reset = useCallback(() => {
    setEditStatus({ status: 'idle' });
  }, []);

  return { ...editStatus, reset };
}

/**
 * Hook to listen for draft updates
 * @param draftId - Optional draft ID to filter events
 */
export function useDraftUpdates(draftId?: string) {
  const [updates, setUpdates] = useState<EventData[typeof EVENTS.DRAFT_UPDATED] | null>(null);

  useEffect(() => {
    const unsubscribe = EventBus.on(EVENTS.DRAFT_UPDATED, (data) => {
      if (!draftId || data?.draftId === draftId) {
        setUpdates(data);
      }
    });

    return () => unsubscribe();
  }, [draftId]);

  return updates;
}

/**
 * Hook to emit events with proper typing
 */
export function useEventEmitter() {
  const emitCreditConsumed = useCallback((amount: number, operation: string) => {
    EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount, operation });
  }, []);

  const emitImageEditCompleted = useCallback((draftId: string, imageUrl: string, version: number) => {
    EventBus.emit(EVENTS.IMAGE_EDIT_COMPLETED, { draftId, imageUrl, version });
  }, []);

  const emitDraftUpdated = useCallback((draftId: string, updates: Record<string, unknown>) => {
    EventBus.emit(EVENTS.DRAFT_UPDATED, { draftId, updates });
  }, []);

  return {
    emitCreditConsumed,
    emitImageEditCompleted,
    emitDraftUpdated,
  };
}
