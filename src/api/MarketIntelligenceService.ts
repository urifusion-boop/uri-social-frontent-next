import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

// Mirrors uri-social-backend's app/agents/market_intelligence/models.py field-for-field —
// keep the two in sync by hand until a shared schema generator exists (none does yet
// anywhere in this codebase, so this is the established pattern for every other
// backend-paired service file too).

export type EvidenceType =
  | 'purchase_inquiry'
  | 'customer_concern'
  | 'unmet_need'
  | 'product_praise'
  | 'emerging_trend'
  | 'competitor_movement'
  | 'upcoming_development'
  | 'reputation_risk'
  | 'general_discussion'
  | 'noise';

export type ScanStatus =
  | 'queued'
  | 'collecting'
  | 'analysing'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled'
  | 'budget_limited';

export type ConfidenceBand = 'low' | 'medium' | 'high';
export type Lifecycle = 'early' | 'emerging' | 'established' | 'cooling' | 'unknown';
export type InsightStatus = 'active' | 'superseded' | 'retracted' | 'dismissed';
export type FeedbackVerdict = 'useful' | 'not_relevant' | 'incorrect';

export interface ComponentScore {
  name: string;
  points: number;
  reason: string;
}

export interface ScoreBreakdown {
  components: ComponentScore[];
  total: number;
  band: ConfidenceBand;
}

export interface UrgencyAssessment {
  is_urgent: boolean;
  deadline?: string | null;
  reason: string;
}

export interface Geography {
  explicit_location?: string | null;
  source_field_location?: string | null;
  inferred_location?: string | null;
}

export interface Evidence {
  id: string;
  brand_id: string;
  user_id: string;
  topic_id: string;
  provider: string;
  platform: string;
  source_id: string;
  url?: string | null;
  content_type: string;
  parent_id?: string | null;
  text: string;
  language: string;
  original_text?: string | null;
  author_handle?: string | null;
  author_is_verified?: boolean | null;
  published_at?: string | null;
  collected_at: string;
  geography: Geography;
  duplicate_of?: string | null;
  raw_metrics: Record<string, number>;
}

export interface InsightVersion {
  id: string;
  revision: number;
  brand_id: string;
  topic_id: string;
  cluster_id?: string | null;
  type: EvidenceType;
  headline: string;
  observed_change: string;
  business_implication: string;
  suggested_next_step: string;
  assumptions: string[];
  evidence_ids: string[];
  confidence: ScoreBreakdown;
  relevance: ScoreBreakdown;
  urgency: UrgencyAssessment;
  lifecycle: Lifecycle;
  status: InsightStatus;
  coverage_note?: string | null;
  language: string;
  action_readiness: 'ready_to_act' | 'check_suitability';
  first_seen: string;
  last_updated: string;
}

export interface SourceConfig {
  provider: string;
  platform: string;
  enabled: boolean;
  verified_lookback_days: number;
  refresh_cadence_hours: number;
}

export interface SourceCapability {
  provider: string;
  platform: string;
  verified_lookback_days: number;
  supports_date_filters: boolean;
  supports_keyword_search: boolean;
  accessible_languages: string[];
  refresh_cadence_hours: number;
  notes: string;
}

export type NotificationSensitivity = 'low' | 'normal' | 'high';

export interface Topic {
  id: string;
  brand_id: string;
  user_id: string;
  question: string;
  keywords: string[];
  excluded_keywords: string[];
  sources: SourceConfig[];
  geographic_scope?: string | null;
  requested_days: number;
  keep_updating: boolean;
  active: boolean;
  created_at: string;
  competitors: string[];
  languages: string[];
  notification_sensitivity: NotificationSensitivity;
}

export interface CollectionRun {
  id: string;
  topic_id: string;
  brand_id: string;
  source_provider: string;
  status: ScanStatus;
  started_at?: string | null;
  completed_at?: string | null;
  evidence_collected: number;
  gaps: string[];
  estimated_cost_usd: number;
}

export interface ActionBrief {
  id: string;
  insight_id: string;
  insight_revision: number;
  brand_id: string;
  customer_need: string;
  proposed_message: string;
  evidence_ids: string[];
  destination: string;
  destination_ref_id?: string | null;
  created_at: string;
}

export interface FeedbackOutcome {
  id: string;
  insight_id: string;
  user_id: string;
  verdict: FeedbackVerdict;
  reason?: string | null;
  created_at: string;
}

export type DevelopmentStatus = 'date_to_confirm' | 'scheduled' | 'postponed' | 'cancelled' | 'occurred';

export interface Development {
  id: string;
  brand_id: string;
  topic_id: string;
  evidence_id: string;
  issuer?: string | null;
  headline: string;
  event_date?: string | null;
  event_date_range_end?: string | null;
  location?: string | null;
  registration_deadline?: string | null;
  preparation_action?: string | null;
  source_url?: string | null;
  status: DevelopmentStatus;
  verification_note?: string | null;
  first_seen: string;
  last_updated: string;
}

export type NotificationCategory =
  | 'act_soon'
  | 'qualified_inquiry'
  | 'prepare'
  | 'useful_pattern'
  | 'early_signal'
  | 'material_update'
  | 'cooling';

export interface MINotificationPreferences {
  user_id: string;
  brand_id: string;
  email_enabled: boolean;
  timezone: string;
  digest_hour_local: number;
  quiet_hours_start_local: number;
  quiet_hours_end_local: number;
  urgent_override: boolean;
  muted_topic_ids: string[];
  muted_categories: NotificationCategory[];
  snoozed_insight_ids: string[];
}

export interface PreferencesUpdateRequest {
  email_enabled?: boolean;
  timezone?: string;
  digest_hour_local?: number;
  quiet_hours_start_local?: number;
  quiet_hours_end_local?: number;
  urgent_override?: boolean;
  mute_topic_id?: string;
  unmute_topic_id?: string;
  mute_category?: NotificationCategory;
  unmute_category?: NotificationCategory;
}

export interface BrandBudget {
  brand_id: string;
  monthly_allowance_usd: number;
  period: string;
  reserved_usd: number;
  spent_usd: number;
  updated_at: string;
}

export interface SourceCoveragePreview {
  provider: string;
  requested_days: number;
  accessible_days: number;
  capped: boolean;
  note?: string | null;
  estimated_cost_usd: number;
}

export interface BrandTopicSuggestion {
  question: string;
  keywords: string[];
  excluded_keywords: string[];
  geographic_scope?: string | null;
  competitors: string[];
  languages: string[];
  requested_days: number;
  keep_updating: boolean;
  sources: string[];
  built_from: string[];
}

export interface TopicCreateRequest {
  question: string;
  keywords?: string[];
  excluded_keywords?: string[];
  // Provider names, e.g. ['x'] — see uri-social-backend's
  // scan_runner.ADAPTER_REGISTRY (mock, x = X test actor, x_pro = X at scale).
  sources?: string[];
  geographic_scope?: string;
  requested_days?: number;
  keep_updating?: boolean;
  competitors?: string[];
  languages?: string[];
  notification_sensitivity?: NotificationSensitivity;
}

export interface KeywordSuggestion {
  keywords: string[];
  excluded_keywords: string[];
}

export type MIAccessLevel = 'full' | 'view_only';

export interface AccessGrant {
  id: string;
  brand_id: string;
  user_id: string;
  level: MIAccessLevel;
  granted_by: string;
  created_at: string;
  // Best-effort display info, resolved server-side — absent if the user
  // record couldn't be joined, never blocking the grant itself.
  email?: string;
  user_name?: string | null;
}

const BASE = '/market-intelligence';

// ── Listening Intelligence (market-level listening -> action cards) ─────────
export type ListeningSignalType = 'rising' | 'spike' | 'emerging' | 'new_entity' | 'recurring_need';
export type ListeningCardAction = 'saved' | 'dismissed' | 'snoozed' | 'acted' | 'created' | 'shown';

export type CreateFromListeningCardResult =
  | { card_id: string; draft_ids: string[]; request_id?: string }
  | {
      card_id: string;
      optional_text: string;
      target_platform: string;
      target_duration_seconds: number;
      video_style: string;
    }
  | {
      card_id: string;
      thread: { thread_id: string; status: string; title: string };
      seed_message: string;
    };

export interface ListeningCardActionBrief {
  type: string;
  title: string;
  platforms: string[];
  format: string;
  hook: string;
  outline: string[];
  cta: string;
  caption: string;
}

export interface ListeningCard {
  id: string;
  market: string;
  market_label?: string;
  topic: string;
  topic_name?: string;
  type: ListeningSignalType;
  observation: string;
  why: string;
  action: ListeningCardActionBrief;
  // PRD §9.3's "Alternatives": a second, genuinely different-shaped option
  // for the same signal, when Jane found one worth considering — absent on
  // most cards, since padding every card with a weaker near-duplicate isn't
  // the point (see personalize.py's cards_for).
  alternative?: ListeningCardActionBrief | null;
  evidence: {
    current?: Record<string, number>;
    baseline?: { median_per_day?: number; days?: number } | null;
    window_start?: string;
    window_end?: string;
    samples?: { url?: string; text?: string; author?: string; published_at?: string }[];
    needs?: string[];
    intent_mix?: Record<string, number>;
    source?: string;
    scope_note?: string;
  };
  scores: { R: number; M: number; C: number; E: number; B: number; total: number };
  confidence?: number;
  status: string;
  created_at?: string;
  expires_at?: string;
}

export interface ListeningMarketStatus {
  key: string;
  label?: string;
  last_collected_at?: string | null;
  topics: number;
  // Counts within `topics` by lifecycle stage (PRD §6.3): observed -> seen,
  // not yet searched for; candidate -> repeated enough to be watched;
  // monitored -> added to the market's own searches; paused/retired ->
  // dropped out. Absent keys mean 0 in that stage, not unknown.
  topic_statuses?: Record<string, number>;
  active_signals: number;
  learned_terms: string[];
  last_run?: {
    status?: string;
    started_at?: string;
    items_returned?: number;
    new_items?: number;
    note?: string;
  } | null;
}

export interface MarketPulseTopic {
  topic: string;
  accounts: number;
  posts: number;
  intents: Record<string, number>;
  needs: string[];
}

export interface MarketPulse {
  market: string;
  label?: string;
  covered_hours: number;
  window_days: number;
  topics: MarketPulseTopic[];
}

export interface ListeningRunQuery {
  id?: string;
  q: string;
  kind: string;
  role: string;
  status: 'pending' | 'done';
  items: number | null;
  capped: boolean | null;
  cost: number | null;
  error: string | null;
}

export interface ListeningRun {
  id: string;
  market: string;
  status: string;
  started_at: string;
  per_query: ListeningRunQuery[];
}

export interface ListeningStatus {
  profile: { brand_id: string; markets: string[]; country: string; status: string; updated_at?: string } | null;
  markets: ListeningMarketStatus[];
  cadence_hours: number;
  budget: { monthly_usd: number; spent_usd: number };
}

export class MarketIntelligenceService {
  static async listSources(): Promise<UriResponse<SourceCapability[]>> {
    const res: AxiosResponse<UriResponse<SourceCapability[]>> = await UriHttpClient.getClient().get(`${BASE}/sources`);
    return res.data;
  }

  static async suggestKeywords(question: string): Promise<UriResponse<KeywordSuggestion>> {
    const res: AxiosResponse<UriResponse<KeywordSuggestion>> = await UriHttpClient.getClient().post(
      `${BASE}/topics/suggest-keywords`,
      { question }
    );
    return res.data;
  }

  // A starter topic built from the brand's own Playbook, for the owner to review.
  static async suggestFromBrand(): Promise<UriResponse<BrandTopicSuggestion>> {
    const res: AxiosResponse<UriResponse<BrandTopicSuggestion>> = await UriHttpClient.getClient().post(
      `${BASE}/topics/suggest-from-brand`,
      {}
    );
    return res.data;
  }

  static async createTopic(data: TopicCreateRequest): Promise<UriResponse<Topic>> {
    const res: AxiosResponse<UriResponse<Topic>> = await UriHttpClient.getClient().post(`${BASE}/topics`, data);
    return res.data;
  }

  static async listTopics(): Promise<UriResponse<Topic[]>> {
    const res: AxiosResponse<UriResponse<Topic[]>> = await UriHttpClient.getClient().get(`${BASE}/topics`);
    return res.data;
  }

  static async getBudget(): Promise<UriResponse<BrandBudget>> {
    const res: AxiosResponse<UriResponse<BrandBudget>> = await UriHttpClient.getClient().get(`${BASE}/budget`);
    return res.data;
  }

  static async getCoveragePreview(topicId: string): Promise<UriResponse<SourceCoveragePreview[]>> {
    const res: AxiosResponse<UriResponse<SourceCoveragePreview[]>> = await UriHttpClient.getClient().get(
      `${BASE}/topics/${topicId}/coverage-preview`
    );
    return res.data;
  }

  static async startScan(topicId: string): Promise<UriResponse<CollectionRun>> {
    const res: AxiosResponse<UriResponse<CollectionRun>> = await UriHttpClient.getClient().post(
      `${BASE}/topics/${topicId}/scans`
    );
    return res.data;
  }

  static async getScan(scanId: string): Promise<UriResponse<CollectionRun>> {
    const res: AxiosResponse<UriResponse<CollectionRun>> = await UriHttpClient.getClient().get(
      `${BASE}/scans/${scanId}`
    );
    return res.data;
  }

  static async listInsights(): Promise<UriResponse<InsightVersion[]>> {
    const res: AxiosResponse<UriResponse<InsightVersion[]>> = await UriHttpClient.getClient().get(`${BASE}/insights`);
    return res.data;
  }

  static async getInsight(insightId: string): Promise<UriResponse<InsightVersion>> {
    const res: AxiosResponse<UriResponse<InsightVersion>> = await UriHttpClient.getClient().get(
      `${BASE}/insights/${insightId}`
    );
    return res.data;
  }

  static async getInsightEvidence(insightId: string): Promise<UriResponse<Evidence[]>> {
    const res: AxiosResponse<UriResponse<Evidence[]>> = await UriHttpClient.getClient().get(
      `${BASE}/insights/${insightId}/evidence`
    );
    return res.data;
  }

  static async submitFeedback(
    insightId: string,
    verdict: FeedbackVerdict,
    reason?: string
  ): Promise<UriResponse<FeedbackOutcome>> {
    const res: AxiosResponse<UriResponse<FeedbackOutcome>> = await UriHttpClient.getClient().post(
      `${BASE}/insights/${insightId}/feedback`,
      { verdict, reason }
    );
    return res.data;
  }

  static async getBrief(insightId: string): Promise<UriResponse<ActionBrief>> {
    const res: AxiosResponse<UriResponse<ActionBrief>> = await UriHttpClient.getClient().get(
      `${BASE}/insights/${insightId}/briefs`
    );
    return res.data;
  }

  static async createBrief(insightId: string, proposedMessage?: string): Promise<UriResponse<ActionBrief>> {
    const res: AxiosResponse<UriResponse<ActionBrief>> = await UriHttpClient.getClient().post(
      `${BASE}/insights/${insightId}/briefs`,
      { proposed_message: proposedMessage }
    );
    return res.data;
  }

  static async updateBrief(insightId: string, proposedMessage: string): Promise<UriResponse<ActionBrief>> {
    const res: AxiosResponse<UriResponse<ActionBrief>> = await UriHttpClient.getClient().patch(
      `${BASE}/insights/${insightId}/briefs`,
      { proposed_message: proposedMessage }
    );
    return res.data;
  }

  static async getPreferences(): Promise<UriResponse<MINotificationPreferences>> {
    const res: AxiosResponse<UriResponse<MINotificationPreferences>> = await UriHttpClient.getClient().get(
      `${BASE}/preferences`
    );
    return res.data;
  }

  static async updatePreferences(body: PreferencesUpdateRequest): Promise<UriResponse<MINotificationPreferences>> {
    const res: AxiosResponse<UriResponse<MINotificationPreferences>> = await UriHttpClient.getClient().patch(
      `${BASE}/preferences`,
      body
    );
    return res.data;
  }

  static async snoozeInsight(insightId: string): Promise<UriResponse<{ snoozed_insight_ids: string[] }>> {
    const res: AxiosResponse<UriResponse<{ snoozed_insight_ids: string[] }>> = await UriHttpClient.getClient().post(
      `${BASE}/insights/${insightId}/snooze`
    );
    return res.data;
  }

  static async deleteEvidence(evidenceId: string): Promise<UriResponse<Record<string, unknown>>> {
    const res: AxiosResponse<UriResponse<Record<string, unknown>>> = await UriHttpClient.getClient().delete(
      `${BASE}/evidence/${evidenceId}`
    );
    return res.data;
  }

  static async listDevelopments(): Promise<UriResponse<Development[]>> {
    const res: AxiosResponse<UriResponse<Development[]>> = await UriHttpClient.getClient().get(`${BASE}/developments`);
    return res.data;
  }

  static async updateDevelopment(
    developmentId: string,
    status: DevelopmentStatus,
    verificationNote?: string
  ): Promise<UriResponse<Development>> {
    const res: AxiosResponse<UriResponse<Development>> = await UriHttpClient.getClient().patch(
      `${BASE}/developments/${developmentId}`,
      { status, verification_note: verificationNote }
    );
    return res.data;
  }

  // Both silently 403 for anyone who isn't the brand owner (or an agency
  // admin, for an agency-owned brand) — callers should treat that 403 as
  // "hide this UI", not an error to surface.
  static async listAccessGrants(): Promise<UriResponse<AccessGrant[]>> {
    const res: AxiosResponse<UriResponse<AccessGrant[]>> = await UriHttpClient.getClient().get(`${BASE}/access`);
    return res.data;
  }

  static async setAccessGrant(email: string, level: MIAccessLevel): Promise<UriResponse<Record<string, unknown>>> {
    const res: AxiosResponse<UriResponse<Record<string, unknown>>> = await UriHttpClient.getClient().post(
      `${BASE}/access`,
      { email, level }
    );
    return res.data;
  }

  // ── Listening Intelligence ────────────────────────────────────────────────
  static async getListeningStatus(): Promise<UriResponse<ListeningStatus>> {
    const res: AxiosResponse<UriResponse<ListeningStatus>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/status`
    );
    return res.data;
  }

  // What's real and measured in this business's market right now, whether
  // or not any of it has cleared the bar for a full opportunity card yet —
  // built this session already, just never connected to any screen before.
  static async getMarketPulse(days = 7): Promise<UriResponse<MarketPulse[]>> {
    const res: AxiosResponse<UriResponse<MarketPulse[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/pulse`,
      { params: { days } }
    );
    return res.data;
  }

  static async enableListening(): Promise<UriResponse<Record<string, unknown>>> {
    const res: AxiosResponse<UriResponse<Record<string, unknown>>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/enable`,
      {}
    );
    return res.data;
  }

  static async runListeningNow(): Promise<UriResponse<{ started: boolean; markets: string[] }>> {
    const res: AxiosResponse<UriResponse<{ started: boolean; markets: string[] }>> =
      await UriHttpClient.getClient().post(`${BASE}/listening/run`, {});
    return res.data;
  }

  // Real in-progress state, not a simulated percentage — see
  // GET /listening/run/active's own docstring.
  static async getActiveListeningRuns(): Promise<UriResponse<ListeningRun[]>> {
    const res: AxiosResponse<UriResponse<ListeningRun[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/run/active`
    );
    return res.data;
  }

  static async listListeningCards(): Promise<UriResponse<ListeningCard[]>> {
    const res: AxiosResponse<UriResponse<ListeningCard[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/cards`
    );
    return res.data;
  }

  static async actOnListeningCard(
    cardId: string,
    action: ListeningCardAction,
    reason?: string
  ): Promise<UriResponse<Record<string, unknown>>> {
    const res: AxiosResponse<UriResponse<Record<string, unknown>>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/cards/${cardId}/action`,
      { action, reason }
    );
    return res.data;
  }

  // One click, server-side. Shape depends on the card's own action.type:
  //   post/carousel/faq -> real drafts generated now (draft_ids)
  //   video             -> no draft can be generated server-side (the real
  //                        flow needs the owner's own images) — a pre-filled
  //                        brief for the storyboard screen instead
  //   ad_test           -> a fresh, pre-filled Jane Ads draft thread (never
  //                        auto-launched — the owner still drives it there)
  static async createFromListeningCard(cardId: string): Promise<UriResponse<CreateFromListeningCardResult>> {
    const res: AxiosResponse<UriResponse<CreateFromListeningCardResult>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/cards/${cardId}/create`,
      {}
    );
    return res.data;
  }

  // ── Listening curation console (admin-only) ─────────────────────────────
  // A market and its topics/sources/readings are shared across every
  // subscribed business, not any one tenant's own data — these endpoints
  // are gated server-side by platform-admin status, not brand context.

  static async getCurationMarkets(): Promise<UriResponse<CurationMarket[]>> {
    const res: AxiosResponse<UriResponse<CurationMarket[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/markets`
    );
    return res.data;
  }

  static async getCurationTopics(params: {
    status?: string;
    market?: string;
    limit?: number;
  }): Promise<UriResponse<CurationTopic[]>> {
    const res: AxiosResponse<UriResponse<CurationTopic[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/topics`,
      { params }
    );
    return res.data;
  }

  static async decideCurationTopic(
    marketKey: string,
    topicKey: string,
    body: { status: TopicStatus; reason?: string }
  ): Promise<UriResponse<{ found: boolean; status: string; market: string; topic: string }>> {
    const res: AxiosResponse<UriResponse<{ found: boolean; status: string; market: string; topic: string }>> =
      await UriHttpClient.getClient().post(
        `${BASE}/listening/curation/topics/${encodeURIComponent(marketKey)}/${encodeURIComponent(topicKey)}/decide`,
        body
      );
    return res.data;
  }

  static async getTopicHistory(marketKey: string, topicKey: string): Promise<UriResponse<TopicHistoryEntry[]>> {
    const res: AxiosResponse<UriResponse<TopicHistoryEntry[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/topics/${encodeURIComponent(marketKey)}/${encodeURIComponent(topicKey)}/history`
    );
    return res.data;
  }

  static async getSourcePermissions(): Promise<UriResponse<SourcePermission[]>> {
    const res: AxiosResponse<UriResponse<SourcePermission[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/sources`
    );
    return res.data;
  }

  static async setSourceApproval(
    source: string,
    body: { approved: boolean; notes?: string }
  ): Promise<UriResponse<SourcePermission>> {
    const res: AxiosResponse<UriResponse<SourcePermission>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/curation/sources/${encodeURIComponent(source)}/approval`,
      body
    );
    return res.data;
  }

  static async getPendingReviews(params: { market?: string; limit?: number }): Promise<UriResponse<PendingReview[]>> {
    const res: AxiosResponse<UriResponse<PendingReview[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/reviews`,
      { params }
    );
    return res.data;
  }

  static async resolveReview(
    marketKey: string,
    sourceId: string,
    body: { on_topic?: boolean; intent?: string; topics?: string[]; note?: string }
  ): Promise<UriResponse<{ found: boolean; corrected_fields: string[] }>> {
    const res: AxiosResponse<UriResponse<{ found: boolean; corrected_fields: string[] }>> =
      await UriHttpClient.getClient().post(
        `${BASE}/listening/curation/reviews/${encodeURIComponent(marketKey)}/${encodeURIComponent(sourceId)}/resolve`,
        body
      );
    return res.data;
  }

  static async replayDetection(body: {
    market: string;
    at: string[];
    candidate_overrides?: Record<string, unknown>;
  }): Promise<UriResponse<ReplayResult[]>> {
    const res: AxiosResponse<UriResponse<ReplayResult[]>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/curation/replay`,
      body
    );
    return res.data;
  }

  static async getGoldenExamples(params: { market?: string; limit?: number }): Promise<UriResponse<GoldenExample[]>> {
    const res: AxiosResponse<UriResponse<GoldenExample[]>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/golden`,
      { params }
    );
    return res.data;
  }

  static async markGolden(
    marketKey: string,
    sourceId: string
  ): Promise<UriResponse<{ found: boolean; marked: boolean }>> {
    const res: AxiosResponse<UriResponse<{ found: boolean; marked: boolean }>> = await UriHttpClient.getClient().post(
      `${BASE}/listening/curation/golden/${encodeURIComponent(marketKey)}/${encodeURIComponent(sourceId)}`,
      {}
    );
    return res.data;
  }

  static async unmarkGolden(marketKey: string, sourceId: string): Promise<UriResponse<{ removed: boolean }>> {
    const res: AxiosResponse<UriResponse<{ removed: boolean }>> = await UriHttpClient.getClient().delete(
      `${BASE}/listening/curation/golden/${encodeURIComponent(marketKey)}/${encodeURIComponent(sourceId)}`
    );
    return res.data;
  }

  static async getProductMetrics(params: {
    market?: string;
    window_days?: number;
  }): Promise<UriResponse<ProductMetrics>> {
    const res: AxiosResponse<UriResponse<ProductMetrics>> = await UriHttpClient.getClient().get(
      `${BASE}/listening/curation/metrics`,
      { params }
    );
    return res.data;
  }
}

export type TopicStatus = 'observed' | 'candidate' | 'monitored' | 'paused' | 'retired';

export interface CurationMarket {
  key: string;
  category_id?: string;
  country?: string;
  label?: string;
  status?: string;
  pilot?: boolean;
  learned_terms?: string[];
  cadence_hours?: number;
  created_at?: string;
  last_collected_at?: string | null;
  subscriber_count: number;
}

export interface CurationTopic {
  market: string;
  key: string;
  name?: string;
  aliases?: string[];
  status: TopicStatus;
  first_seen?: string;
  last_seen?: string;
  candidate_at?: string;
  monitored_at?: string;
  retired_at?: string;
  paused_at?: string;
  retired_reason?: string;
  low_yield_windows?: number;
  decided_by?: string;
  decision_reason?: string;
}

export interface TopicHistoryEntry {
  market: string;
  topic: string;
  old_status: TopicStatus | null;
  new_status: TopicStatus;
  reason?: string | null;
  actor: string;
  at: string;
}

export interface SourcePermission {
  source: string;
  terms_url?: string;
  allowed_use?: string[];
  retention_days?: number;
  display_rules?: { max_excerpt_chars?: number; require_link?: boolean; require_attribution?: boolean };
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

export interface PendingReview {
  source_id: string;
  market: string;
  on_topic?: boolean;
  intent?: string;
  topics?: string[];
  confidence?: number;
  sentiment?: string;
  buying_intent?: string;
  published_at?: string;
  reviewed?: boolean;
  text?: string;
  url?: string;
}

export interface ReplayResult {
  market: string;
  day: string;
  candidate_signal_count: number;
  compared_signal_count: number;
  new_signals: { topic: string; type: string }[];
  missed_signals: { topic: string; type: string }[];
  agreement_count: number;
}

export interface GoldenExample {
  source_id: string;
  market: string;
  text?: string;
  on_topic?: boolean;
  intent?: string;
  sentiment?: string;
  buying_intent?: string;
  topics?: string[];
  marked_by?: string;
  marked_at?: string;
  prompt_version?: string;
}

export interface ProductMetrics {
  window_days: number;
  cards_shown: number;
  useful_or_acted_on_rate?: number;
  dismissal_rate?: number;
  dismissal_reasons?: Record<string, number>;
  content_created_count?: number;
  content_created_rate?: number;
  not_available: Record<string, string>;
}
