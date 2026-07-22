# Codebase Index & Architecture Overview: `uri-social-frontend-next`

## 1. Executive Summary
`uri-social-frontend-next` is a modern, full-featured AI-powered Social Media & Workspace Management Platform frontend. It enables brands, agencies, and content creators to generate visual content, manage brand kits, edit graphics in a custom canvas, schedule posts across social platforms, generate video storyboards, and handle workspace/billing credit management.

---

## 2. Technology Stack & Core Dependencies

| Category | Technologies / Libraries |
| :--- | :--- |
| **Framework** | Next.js 16.2.0 (App Router), React 19.2.4, TypeScript 5 |
| **Styling & UI Design** | Tailwind CSS v4, `@emotion/react` & `@emotion/styled`, `@mui/material` v7, Shadcn UI (`radix-ui`), Framer Motion (`framer-motion`) |
| **Graphic Canvas Editing** | Konva (`konva`), `react-konva`, `react-colorful` |
| **Networking & HTTP** | Axios (`axios`), Custom Interceptors in `lib/api.ts` |
| **State & Pub/Sub** | React Context (`AuthProvider`, `NotificationProvider`), EventBus (`src/services/EventBus.ts`) |
| **Analytics & Monitoring** | PostHog (`posthog-js`), React Error Boundary (`react-error-boundary`) |
| **Data Visualization** | Recharts (`recharts`), Lucide React (`lucide-react`), React Icons (`react-icons`) |
| **Notifications & Toasts** | `react-hot-toast` |

---

## 3. High-Level Architecture & Flow

```mermaid
graph TD
    User([User / Browser]) --> Layout[app/layout.tsx & app/(app)/layout.tsx]
    Layout --> Providers[AuthProvider & NotificationProvider]
    Providers --> EventBus[EventBus Pub/Sub]
    
    Layout --> AppPages[App Route Group '(app)']
    Layout --> MarketingPages[Marketing Pages]
    
    AppPages --> Workspace[Workspace & Agency Pages]
    AppPages --> SocialMedia[Social Media & Canvas Studio]
    AppPages --> SettingsBilling[Settings & Billing Pages]
    
    SocialMedia --> Canvas[Konva Canvas Editor]
    SocialMedia --> Services[src/api/* API Services]
    Workspace --> Services
    SettingsBilling --> Services
    
    Services --> ApiClient[lib/api.ts Axios Client]
    ApiClient --> Backend[(URI Backend API)]
```

---

## 4. Architectural Layer Breakdown

### A. Next.js App Router (`app/`)
- **Root Layout (`app/layout.tsx`)**: Global styles (`globals.css`), fonts, PostHog initialization, and root metadata.
- **App Route Group `app/(app)/`**: Authenticated app routes wrapped with app `providers.tsx`.
  - `/workspace`: Workspace dashboard, administration, video generators.
  - `/social-media`: Content generation, calendar, canvas editor, brand guides.
  - `/billing` & `/checkout` & `/pricing`: Subscription plans, credit top-ups, checkout callbacks.
  - `/settings`: Account connections (Facebook/Instagram), security, visual style, social accounts.
  - `/notifications`: Center for real-time user notifications.
  - `/auth`, `/login`, `/reset-password`, `/verify-email`: Authentication & onboarding workflows.
- **Marketing & Support Pages**: Public routes including `/`, `/about`, `/careers`, `/contact`, `/pricing`, `/privacy`, `/terms`, `/use-cases`, `/api-docs`.

### B. Core API Services (`src/api/`)
Encapsulated API integration layer communicating with the URI backend microservices:
- `AuthService.ts`: User registration, login, token refresh, password resets.
- `SocialMediaAgentService.ts`: AI content generation, draft creation, scheduling, calendar feeds.
- `BrandProfileService.ts`: Brand kit management, logo/asset uploads, Writing DNA.
- `CustomVisualGuideService.ts` & `CustomVisualGuideV2Service.ts`: Brand visual guidelines, layout rule tracking, style templates.
- `CanvasEditorService.ts`: Visual asset creation, layer state persistence, canvas export.
- `BillingService.ts`: Subscriptions, credit balance (`getCreditBalance()`), trial statuses, invoice history.
- `SocialAccountService.ts` & `SocialConnectionService.ts`: Social media OAuth connections and platform account management.
- `AgencyService.ts` & `AdminService.ts`: Workspace management, user access controls, multi-tenant agency tools.
- `NotificationService.ts`: User notification retrieval, read flags, real-time update handling.

### C. Feature Component Architecture (`src/components/app/`)
- **`atoms/`**: Reusable app UI primitives like `TrialBanner.tsx`, `CreditDisplay.tsx`, `LowCreditWarning.tsx`, `OutOfCreditsModal.tsx`, `BugReportModal.tsx`, `NotificationBell.tsx`, `UserProfileMenu.tsx`.
- **`workspace/`**: Components for `WorkspaceDashboard.tsx`, `AdminUsersPage.tsx`, `VideoStoryboardGenerator.tsx`, `VideoProductionForm.tsx`, `UploadContentForm.tsx`.
- **`social-media/`**:
  - `DraftCard.tsx`, `ScheduledCard.tsx`, `ContentGeneratorForm.tsx`, `ContentCalendarTab.tsx`, `WritingDNAQuiz.tsx`.
  - `CustomGuidesV2Gallery.tsx`, `CustomGuideV2UploadModal.tsx`, `FontPickerGallery.tsx`, `StylePickerGallery.tsx`.
  - **`canvas-editor/`**: Konva-powered interactive visual editor (`CanvasEditor.tsx`, `CanvasToolbar.tsx`, `CanvasLayerPanel.tsx`, `CanvasPropertyPanel.tsx`, `useCanvasEditor.ts`).
- **`agency/`**: Multi-client workspace switcher and agency management views.

### D. Global State & Services (`src/providers/` & `src/services/`)
- **`AuthProvider.tsx`**: Manages auth state (`UserDto`, `ITokenDetails`), syncs credentials to `localStorage`, periodically checks credit balances, handles automatic 401 logout events.
- **`NotificationProvider.tsx`**: Provides real-time notification streams to the UI.
- **`EventBus.ts`**: Decoupled pub/sub event bus supporting cross-component communications (e.g., `EVENTS.CREDIT_UPDATED`, `EVENTS.CREDIT_CONSUMED`).

---

## 5. A-Z File Directory Reference

```
uri-social-frontent-next/
├── AGENTS.md                                # Next.js agent execution rules
├── BILLING_FRONTEND_README.md               # Detailed billing & credit system specification
├── DEPLOYMENT.md                            # Build and deployment procedures
├── HTTPS_SETUP.md                           # Local SSL/HTTPS setup guide
├── POST_ONBOARDING_ACCOUNT_CONNECTION_STRATEGY.md # Guide for social account integrations
├── app/                                     # Next.js App Router (pages & API routes)
│   ├── (app)/                               # Authenticated route group
│   │   ├── billing/                         # User billing page
│   │   ├── checkout/                        # Payment checkout & callbacks
│   │   ├── notifications/                   # Notification hub
│   │   ├── pricing/                         # Upgrade & plan comparisons
│   │   ├── settings/                        # Account & connection settings
│   │   ├── social-media/                    # AI post generator & canvas studio
│   │   ├── workspace/                       # Workspace & admin panel
│   │   ├── layout.tsx                       # Authenticated layout wrapper
│   │   └── providers.tsx                    # App providers wrapper
│   ├── about/                               # About page
│   ├── blog/                                # Blog page
│   ├── contact/                             # Contact page
│   ├── layout.tsx                           # Global root layout
│   └── page.tsx                             # Landing page
├── components/                              # General UI & Landing page components
│   ├── landing/                             # Landing page feature & hero sections
│   ├── ui/                                  # Primitive UI controls (Shadcn/Radix)
│   ├── Navbar.tsx                           # Global header navigation
│   └── Footer.tsx                           # Global footer navigation
├── lib/                                     # System core libraries
│   ├── api.ts                               # Base Axios client with request/response interceptors
│   ├── analytics.ts                         # PostHog integration hooks
│   └── utils.ts                             # Classname merging and string utils
└── src/                                     # Modular application logic
    ├── api/                                 # Typed backend service API handlers
    ├── components/app/                      # Feature component modules
    ├── configs/                             # App & HTTP configuration constants
    ├── constants/                           # Route mappings & static keys
    ├── data/                                # Font, style, and media asset presets
    ├── helpers/                             # Security & Route resolution helpers
    ├── hooks/                               # React custom hooks
    ├── models/                              # DTOs, Enums, and Response interfaces
    ├── providers/                           # Auth & Notification providers
    ├── services/                            # EventBus pub/sub event system
    ├── types/                               # TypeScript declarations
    └── utils/                               # Toast, color, and markdown utilities
```

---

## 6. Key Developer Workflows

1. **Running Development Server**: `npm run dev`
2. **Type Checking & Linting**: `npm run lint`
3. **Production Build**: `npm run build`
4. **Format Codebase**: `npm run format`
