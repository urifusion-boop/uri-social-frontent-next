import posthog from 'posthog-js';

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, params);
  }
}
