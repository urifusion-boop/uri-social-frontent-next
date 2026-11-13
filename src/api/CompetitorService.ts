import { UriHttpClient } from '@/src/configs/http.config';
import type { DraftSummary } from '@/src/api/CampaignService';
import type { ReadStep } from '@/src/api/BrandIntelService';

export interface Competitor {
  id: string;
  name: string;
  website: string;
  instagram: string;
  kind: 'direct' | 'similar';
  location: string;
  what_they_sell: string;
  why: string;
  source_url: string;
  description: string;
  status: 'suggested' | 'active' | 'removed';
  source: 'discovered' | 'added' | '';
  removed_reason: string;
}

export interface JobView {
  job_id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  steps: ReadStep[];
  found: string[];
  error?: { code: string; message: string };
  poll_after_ms?: number;
}

export interface CompetitorList {
  suggested: Competitor[];
  active: Competitor[];
  removed_count: number;
  discovery: JobView | null;
  reasons: { value: string; label: string }[];
}

export interface AdAnalysis {
  headline: string;
  angle: string;
  hook: string;
  offer: string;
  cta: string;
  customer_problem: string;
  format: string;
  layout: string;
  why_it_works: string;
}

export interface CompetitorAd {
  id: string;
  image_url: string;
  /** A small copy for grids (falls back to image_url). */
  thumb_url?: string;
  competitor_id: string;
  competitor_name: string;
  platform: string;
  link: string;
  note: string;
  status: 'analyzing' | 'ready' | 'failed';
  analysis: AdAnalysis | Record<string, never>;
  angle_label: string;
  error: string;
  created_at: string;
}

export interface AdList {
  ads: CompetitorAd[];
  next_before: string | null;
  angles: { value: string; label: string }[];
}

export interface Recreation {
  id: string;
  ad_id: string;
  product: string;
  count: number;
  status: 'running' | 'done' | 'failed';
  results: { image_url: string; headline: string; primary_text: string; angle: string; draft_id?: string; redoing?: boolean }[];
  error: string;
  reference: { image_url: string; competitor_name: string; analysis: AdAnalysis };
  poll_after_ms?: number;
}

const BASE = '/competitors';

/** Competitors (PRD WS2), their ads (WS3) and "Make one like this" (WS4). */
export class CompetitorService {
  static async list(): Promise<CompetitorList> {
    return (await UriHttpClient.getClient().get<CompetitorList>(BASE)).data;
  }

  static async discover(force = false): Promise<JobView> {
    return (await UriHttpClient.getClient().post<JobView>(`${BASE}/discover`, { force })).data;
  }

  static async discovery(jobId: string): Promise<JobView> {
    return (await UriHttpClient.getClient().get<JobView>(`${BASE}/discover/${jobId}`)).data;
  }

  static async add(body: { name: string; website?: string; instagram?: string }): Promise<Competitor> {
    return (await UriHttpClient.getClient().post<Competitor>(BASE, body, { timeout: 30000 })).data;
  }

  static async keep(id: string): Promise<Competitor> {
    return (await UriHttpClient.getClient().post<Competitor>(`${BASE}/${id}/keep`)).data;
  }

  static async remove(id: string, reason: string): Promise<Competitor> {
    return (await UriHttpClient.getClient().post<Competitor>(`${BASE}/${id}/remove`, { reason })).data;
  }

  static async setKind(id: string, kind: 'direct' | 'similar'): Promise<Competitor> {
    return (await UriHttpClient.getClient().patch<Competitor>(`${BASE}/${id}`, { kind })).data;
  }

  static async ads(params: { competitor_id?: string; angle?: string; platform?: string; before?: string } = {}): Promise<AdList> {
    return (await UriHttpClient.getClient().get<AdList>(`${BASE}/ads`, { params })).data;
  }

  static async saveAd(body: {
    image_url: string;
    competitor_id?: string;
    platform?: string;
    link?: string;
    note?: string;
  }): Promise<CompetitorAd> {
    return (await UriHttpClient.getClient().post<CompetitorAd>(`${BASE}/ads`, body)).data;
  }

  static async deleteAd(id: string): Promise<void> {
    await UriHttpClient.getClient().delete(`${BASE}/ads/${id}`);
  }

  static async recreate(adId: string, product: string, count: number): Promise<Recreation> {
    return (await UriHttpClient.getClient().post<Recreation>(`${BASE}/ads/${adId}/recreate`, { product, count })).data;
  }

  static async recreation(id: string): Promise<Recreation> {
    return (await UriHttpClient.getClient().get<Recreation>(`${BASE}/recreations/${id}`)).data;
  }

  static async editVersion(id: string, index: number, headline: string, primary_text: string) {
    return (await UriHttpClient.getClient().patch(`${BASE}/recreations/${id}/versions/${index}`, { headline, primary_text })).data;
  }

  static async removeVersion(id: string, index: number): Promise<Recreation> {
    return (await UriHttpClient.getClient().delete<Recreation>(`${BASE}/recreations/${id}/versions/${index}`)).data;
  }

  static async redoVersion(id: string, index: number): Promise<Recreation> {
    return (await UriHttpClient.getClient().post<Recreation>(`${BASE}/recreations/${id}/versions/${index}/redo`)).data;
  }

  static async keepVersion(id: string, index: number): Promise<DraftSummary> {
    return (await UriHttpClient.getClient().post<DraftSummary>(`${BASE}/recreations/${id}/use`, { index })).data;
  }
}
