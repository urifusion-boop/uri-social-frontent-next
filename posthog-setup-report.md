<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the URI Social Next.js App Router project. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), which ensures it loads client-side before the app renders. All 13 business-critical events were instrumented across 8 files, including user identification on login/signup, a full payment conversion funnel, content generation tracking, draft lifecycle events, onboarding milestones, and social account connection signals. Existing GA4 tracking (`trackEvent`) was preserved in all files — PostHog calls are added alongside, not replacing, the current analytics layer.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `signup_completed` | User successfully creates a new account (email or Google OAuth). Triggers `posthog.identify()` to link the user. | `app/(app)/login/page.tsx` |
| `login_completed` | User successfully logs in to an existing account. Triggers `posthog.identify()` to link the user. | `app/(app)/login/page.tsx` |
| `pricing_viewed` | User views the pricing page — top of the payment conversion funnel. | `app/(app)/pricing/page.tsx` |
| `plan_selected` | User clicks "Subscribe Now" on a specific pricing tier. | `app/(app)/pricing/page.tsx` |
| `checkout_started` | Payment initialized; user is being redirected to SQUAD checkout gateway. | `app/(app)/pricing/page.tsx` |
| `purchase_complete` | Payment verified and subscription/credits successfully allocated. | `app/(app)/checkout/callback/page.tsx` |
| `purchase_failed` | Payment verification failed after max retry attempts. | `app/(app)/checkout/callback/page.tsx` |
| `content_generated` | AI successfully generates content drafts for one or more platforms. | `src/components/app/social-media/ContentGeneratorForm.tsx` |
| `out_of_credits` | User attempts content generation but has no credits remaining. | `src/components/app/social-media/ContentGeneratorForm.tsx` |
| `draft_approved` | User approves a content draft (immediate publish, schedule, or save). | `src/components/app/social-media/DraftCard.tsx` |
| `draft_denied` | User denies a content draft, optionally requesting regeneration. | `src/components/app/social-media/DraftCard.tsx` |
| `onboarding_complete` | User completes all steps of the brand setup wizard. | `app/(app)/social-media/brand-setup/page.tsx` |
| `social_account_connected` | User successfully connects Instagram or Facebook in the workspace. | `src/components/app/workspace/WorkspaceDashboard.tsx` |

## Files created / modified

- **Created** `instrumentation-client.ts` — PostHog client-side initialization
- **Modified** `app/(app)/login/page.tsx`
- **Modified** `app/(app)/pricing/page.tsx`
- **Modified** `app/(app)/checkout/callback/page.tsx`
- **Modified** `src/components/app/social-media/ContentGeneratorForm.tsx`
- **Modified** `src/components/app/social-media/DraftCard.tsx`
- **Modified** `app/(app)/social-media/brand-setup/page.tsx`
- **Modified** `src/components/app/workspace/WorkspaceDashboard.tsx`
- **Updated** `.env.local` — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1602894)
- [Payment Conversion Funnel](/insights/Ii9okKju) — 4-step funnel: pricing viewed → plan selected → checkout started → purchase complete
- [New Signups Over Time](/insights/mhBbpxtd) — daily signup trend (30 days)
- [Content Generation Activity](/insights/oqq05VqY) — total generations + unique daily users
- [Out of Credits (Upgrade Intent)](/insights/EWZAP7hl) — tracks users hitting the credit wall — prime upgrade candidates
- [Onboarding & Draft Approval Funnel](/insights/GSRy9tjV) — activation funnel: signup → brand setup → content generated → draft approved

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
