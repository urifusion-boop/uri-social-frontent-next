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

export interface TopicCreateRequest {
  question: string;
  keywords?: string[];
  excluded_keywords?: string[];
  // Provider names only, e.g. ['mock'] — 'mock' is the only registered
  // adapter today (see uri-social-backend's scan_runner.ADAPTER_REGISTRY).
  sources?: string[];
  geographic_scope?: string;
  requested_days?: number;
  keep_updating?: boolean;
}

const BASE = '/market-intelligence';

export class MarketIntelligenceService {
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

  static async createBrief(insightId: string, proposedMessage?: string): Promise<UriResponse<ActionBrief>> {
    const res: AxiosResponse<UriResponse<ActionBrief>> = await UriHttpClient.getClient().post(
      `${BASE}/insights/${insightId}/briefs`,
      { proposed_message: proposedMessage }
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
}
