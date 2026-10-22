import { UriHttpClient } from '@/src/configs/http.config';

export type GrowthMode = 'advisory' | 'approval' | 'autonomous';

export interface GrowthTotals {
  spend_ngn: number;
  impressions: number;
  clicks: number;
  conversations: number;
  ctr: number | null;
  cpc_ngn: number | null;
  cost_per_conversation_ngn: number | null;
  conversion_rate: number | null;
  frequency: number | null;
  days: number;
}

export interface GrowthGoal {
  target_cpl_ngn?: number | null;
  target_cost_per_qualified_ngn?: number | null;
  target_results?: number | null;
  conversion_definition?: string;
}

export interface GrowthCampaignHealth {
  campaign_id: string;
  name: string;
  budget_ngn: number | null;
  ended: boolean;
  totals: GrowthTotals;
  goal: GrowthGoal;
  result_vs_target: number | null;
  budget_used: number | null;
  last_updated: string | null;
  last_error: string;
  open_issues: number;
}

export interface GrowthPolicy {
  mode: GrowthMode;
  allowed_actions: string[];
  max_daily_budget_ngn: number;
  max_increase_pct_7d: number;
  min_spend_before_pause_ngn: number;
  cooldown_hours: number;
  emergency_stop: boolean;
  notify: boolean;
  autonomous_authorized_by: string;
  autonomous_authorized_at: string | null;
}

export interface GrowthHypothesis {
  cause: string;
  confidence: 'low' | 'medium' | 'high';
  why: string;
}

export interface GrowthRecommendation {
  id: string;
  diagnosis_id: string;
  action_type: string;
  summary: string;
  parameters: Record<string, unknown>;
  expected_goal: string;
  risk: string;
  reversible: boolean;
  executable: boolean;
  approval_required: boolean;
  success_metric: string;
  eval_window_days: number;
  status: string;
  history?: { text: string } | null;
}

export interface GrowthMarketSignal {
  headline: string;
  suggestion: string;
  source: string;
  observed_at: string | null;
  label: string;
}

export interface GrowthDiagnosis {
  id: string;
  issue_type: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  confidence: 'low' | 'medium' | 'high';
  evidence: Record<string, unknown>;
  window?: { recent: string[]; baseline: string[] } | null;
  hypotheses: GrowthHypothesis[];
  alternatives: string[];
  market_signals: GrowthMarketSignal[];
  created_at: string;
  updated_at: string;
}

export interface GrowthLeads {
  leads: number;
  by_stage: Record<string, number>;
  with_outcome: number;
  qualified_rate: number | null;
  cost_per_lead_ngn: number | null;
  cost_per_qualified_lead_ngn: number | null;
  customer_acquisition_cost_ngn: number | null;
  revenue_ngn: number;
  roas: number | null;
  available: boolean;
  note: string;
}

export interface GrowthVariantResult {
  ad_id: string;
  version: number;
  attributes: Record<string, string>;
  spend_ngn: number;
  impressions: number;
  clicks: number;
  conversations: number;
  cost_per_conversation_ngn: number | null;
  enough_data: boolean;
}

export interface GrowthCampaignDetail {
  campaign_id: string;
  name: string;
  totals: GrowthTotals;
  daily: { date: string; spend_ngn: number; impressions: number; clicks: number; conversations: number }[];
  health: {
    last_updated: string | null;
    last_error: string;
    landing: { checked?: boolean; ok?: boolean; status?: number | null; seconds?: number; url?: string };
    source: string;
    attribution: string;
  };
  goal: GrowthGoal;
  diagnoses: GrowthDiagnosis[];
  recommendations: GrowthRecommendation[];
  leads: GrowthLeads;
  follow_ups: { waiting: number; oldest_hours: number };
  creative_test: { variants: GrowthVariantResult[]; winner: string | null; reason: string } | null;
  controls: {
    status: string | null;
    daily_budget_ngn: number | null;
    ads: { id: string; name: string; status: string; effective_status?: string }[];
    ads_manager_url: string;
    error: string;
  };
  forecast: {
    available: boolean;
    reason?: string;
    remaining_days?: number;
    conversations_range?: [number, number];
    spend_estimate_ngn?: number;
    assumptions?: string[];
  };
}

export interface GrowthAction {
  action_id: string;
  campaign_id: string;
  action_type: string;
  requested_change: string;
  actor: string;
  mode: string;
  status: string;
  verified?: boolean;
  error?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  executed_at: string;
  evaluation?: { verdict: string; metric: string; before: number | null; after: number | null; note: string };
}

const BASE = '/jane-ads/growth';

export const GrowthService = {
  async overview(): Promise<{
    campaigns: GrowthCampaignHealth[];
    policy: GrowthPolicy;
    pending_recommendations: number;
    can_change_policy: boolean;
  }> {
    return (await UriHttpClient.getClient().get(`${BASE}/overview`)).data;
  },
  async campaign(id: string): Promise<GrowthCampaignDetail> {
    return (await UriHttpClient.getClient().get(`${BASE}/campaigns/${id}`)).data;
  },
  async refresh(id: string): Promise<{ findings: number; new_recommendations: number; executed: number }> {
    return (await UriHttpClient.getClient().post(`${BASE}/campaigns/${id}/refresh`, {})).data;
  },
  async setGoal(id: string, goal: GrowthGoal): Promise<GrowthGoal> {
    return (await UriHttpClient.getClient().put(`${BASE}/campaigns/${id}/goal`, goal)).data.goal;
  },
  async approve(recId: string): Promise<GrowthAction> {
    return (await UriHttpClient.getClient().post(`${BASE}/recommendations/${recId}/approve`, {})).data.action;
  },
  async decide(recId: string, decision: 'rejected' | 'done', note = ''): Promise<void> {
    await UriHttpClient.getClient().post(`${BASE}/recommendations/${recId}/decide`, { decision, note });
  },
  async change(
    campaignId: string,
    action_type: 'pause_ad' | 'resume_ad' | 'pause_campaign' | 'resume_campaign' | 'set_daily_budget',
    params: { ad_id?: string; to_ngn?: number } = {}
  ): Promise<GrowthAction> {
    return (await UriHttpClient.getClient().post(`${BASE}/campaigns/${campaignId}/changes`, { action_type, ...params }))
      .data.action;
  },
  async undo(actionId: string): Promise<GrowthAction> {
    return (await UriHttpClient.getClient().post(`${BASE}/actions/${actionId}/undo`, {})).data.action;
  },
  async history(campaignId?: string): Promise<{
    actions: GrowthAction[];
    events: { type: string; at: string; campaign_id: string }[];
    track_record: Record<string, { text: string }>;
  }> {
    const q = campaignId ? `?campaign_id=${encodeURIComponent(campaignId)}` : '';
    return (await UriHttpClient.getClient().get(`${BASE}/history${q}`)).data;
  },
  async policy(): Promise<{ policy: GrowthPolicy; can_change: boolean; autonomous_actions: string[] }> {
    return (await UriHttpClient.getClient().get(`${BASE}/policy`)).data;
  },
  async savePolicy(p: Partial<GrowthPolicy> & { confirm_autonomous?: boolean }): Promise<GrowthPolicy> {
    return (await UriHttpClient.getClient().put(`${BASE}/policy`, p)).data.policy;
  },
  async emergencyStop(on: boolean): Promise<GrowthPolicy> {
    return (await UriHttpClient.getClient().post(`${BASE}/emergency-stop`, { on })).data.policy;
  },
  async setLeadStage(conversationId: string, stage: string, value?: number): Promise<void> {
    await UriHttpClient.getClient().patch(`${BASE}/leads/${conversationId}`, { stage, value });
  },
};
