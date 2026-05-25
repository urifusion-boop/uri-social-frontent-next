/**
 * Event Bus Service
 * Professional enterprise pattern for cross-component real-time updates
 *
 * Usage:
 * - EventBus.emit('credit:updated', { creditsRemaining: 10 })
 * - EventBus.on('credit:updated', (data) => console.log(data))
 */

type EventCallback = (data?: unknown) => void;

class EventBusService {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: string, data?: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Clear all event listeners (useful for testing)
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get subscriber count for an event (useful for debugging)
   */
  getSubscriberCount(event: string): number {
    return this.events.get(event)?.size ?? 0;
  }
}

// Singleton instance
export const EventBus = new EventBusService();

// Event type definitions for type safety
export const EVENTS = {
  // Credit events
  CREDIT_UPDATED: 'credit:updated',
  CREDIT_CONSUMED: 'credit:consumed',

  // Draft events
  DRAFT_UPDATED: 'draft:updated',
  DRAFT_CREATED: 'draft:created',
  DRAFT_DELETED: 'draft:deleted',
  DRAFT_SCHEDULED: 'draft:scheduled',

  // Image events
  IMAGE_EDIT_STARTED: 'image:edit:started',
  IMAGE_EDIT_COMPLETED: 'image:edit:completed',
  IMAGE_EDIT_FAILED: 'image:edit:failed',

  // Carousel events
  CAROUSEL_SLIDE_UPDATED: 'carousel:slide:updated',

  // Trial events
  TRIAL_UPDATED: 'trial:updated',
} as const;

export type EventData = {
  [EVENTS.CREDIT_UPDATED]: {
    creditsRemaining: number;
    creditBalance: number;
    subscriptionTier?: string;
    lowCreditWarning?: boolean;
  };
  [EVENTS.CREDIT_CONSUMED]: {
    amount: number;
    operation: string;
  };
  [EVENTS.DRAFT_UPDATED]: {
    draftId: string;
    updates: Record<string, unknown>;
  };
  [EVENTS.DRAFT_CREATED]: {
    draftId: string;
    draft: Record<string, unknown>;
  };
  [EVENTS.DRAFT_DELETED]: {
    draftId: string;
  };
  [EVENTS.IMAGE_EDIT_STARTED]: {
    draftId: string;
  };
  [EVENTS.IMAGE_EDIT_COMPLETED]: {
    draftId: string;
    imageUrl: string;
    version: number;
  };
  [EVENTS.IMAGE_EDIT_FAILED]: {
    draftId: string;
    error: string;
  };
  [EVENTS.CAROUSEL_SLIDE_UPDATED]: {
    draftId: string;
    slideIndex: number;
    updates: Record<string, unknown>;
  };
  [EVENTS.TRIAL_UPDATED]: {
    isTrial: boolean;
    trialActive: boolean;
    trialCreditsRemaining?: number;
    trialDaysRemaining?: number;
  };
};
