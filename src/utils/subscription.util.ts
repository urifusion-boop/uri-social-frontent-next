/**
 * Single source of truth for "does this user have an active paid
 * subscription" on the frontend. userDetails.subscriptionTier (from
 * AuthProvider, sourced from GET /billing/credits/balance) is null for a
 * non-subscriber and the real tier id (starter/growth/pro/agency/custom) —
 * never the literal string "free" — for a subscriber, but several call sites
 * defensively also treat 'free' as "no subscription" in case that ever
 * changes. Centralized here instead of each component repeating its own
 * inline check, since "trial + subscription can both be true at once" is
 * easy to get wrong ad hoc.
 */
export function hasActiveSubscription(tier?: string | null): boolean {
  return !!tier && tier !== 'free';
}
