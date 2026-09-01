import { UriHttpClient } from '@/src/configs/http.config';
import { socialMediaAgentRoutes } from '@/src/constants/routes/socialMediaAgentRoutes';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Agency {
  agency_id: string;
  name: string;
  owner_user_id: string;
  wallet_credits: number;
  per_brand_caps_enabled: boolean;
  plan_tier: string;
  max_brands: number | null;
  status: string;
  created_at: string;
}

export interface BrandAccount {
  brand_id: string;
  agency_id: string | null;
  owner_user_id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  monthly_credit_cap: number | null;
  status: string;
  created_at: string;
}

export interface RosterBrand extends BrandAccount {
  pending_approvals: number;
  scheduled_today: number;
  credits_consumed_this_month: number;
  last_activity: string | null;
}

export interface AgencyMember {
  agency_member_id: string;
  agency_id: string;
  user_id: string | null;
  email: string | null;
  role: 'admin' | 'agent';
  status: string;
  joined_at: string | null;
  assigned_brand_ids?: string[];
}

export interface PortfolioReport {
  agency_id: string;
  wallet_credits: number;
  total_credits_consumed_this_month: number;
  total_posts_published: number;
  brand_count: number;
  per_brand: Array<{
    brand_id: string;
    name: string;
    credits_consumed_this_month: number;
    posts_published: number;
    pending_approvals: number;
    needs_attention: boolean;
  }>;
}

export interface BrandReport {
  brand_id: string;
  name: string | null;
  posts_published: number;
  credits_consumed_this_month: number;
  top_posts: Array<{ generated_title?: string; primary_keyword?: string }>;
}

// ── Active-brand helpers (drives the X-Brand-Id header in http.config) ───────

const ACTIVE_BRAND_KEY = '@URI@ACTIVE_BRAND_ID';

export function getActiveBrandId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BRAND_KEY);
  } catch {
    return null;
  }
}

export function setActiveBrandId(brandId: string | null) {
  try {
    if (brandId) localStorage.setItem(ACTIVE_BRAND_KEY, brandId);
    else localStorage.removeItem(ACTIVE_BRAND_KEY);
    window.dispatchEvent(new CustomEvent('active-brand-changed', { detail: brandId }));
  } catch {
    /* no-op */
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

const R = socialMediaAgentRoutes;

export class AgencyService {
  static async getAgency(): Promise<UriResponse<Agency | null>> {
    const res: AxiosResponse<UriResponse<Agency | null>> = await UriHttpClient.getClient().get(R.agency);
    return res.data;
  }

  static async createAgency(name: string, planTier?: string): Promise<UriResponse<Agency>> {
    const res: AxiosResponse<UriResponse<Agency>> = await UriHttpClient.getClient().post(R.agency, {
      name,
      plan_tier: planTier ?? 'agency_starter',
    });
    return res.data;
  }

  static async updateAgency(name: string): Promise<UriResponse<Agency>> {
    const res: AxiosResponse<UriResponse<Agency>> = await UriHttpClient.getClient().patch(R.agency, { name });
    return res.data;
  }

  static async getRoster(): Promise<UriResponse<RosterBrand[]>> {
    const res: AxiosResponse<UriResponse<RosterBrand[]>> = await UriHttpClient.getClient().get(R.agencyRoster);
    return res.data;
  }

  static async listBrands(): Promise<UriResponse<BrandAccount[]>> {
    const res: AxiosResponse<UriResponse<BrandAccount[]>> = await UriHttpClient.getClient().get(R.agencyBrands);
    return res.data;
  }

  static async addBrand(payload: {
    name: string;
    industry?: string;
    logo_url?: string;
    monthly_credit_cap?: number;
  }): Promise<UriResponse<BrandAccount>> {
    const res: AxiosResponse<UriResponse<BrandAccount>> = await UriHttpClient.getClient().post(R.agencyBrands, payload);
    return res.data;
  }

  static async duplicateBrand(payload: {
    template_brand_id: string;
    name: string;
    industry?: string;
  }): Promise<UriResponse<BrandAccount>> {
    const res: AxiosResponse<UriResponse<BrandAccount>> = await UriHttpClient.getClient().post(
      R.agencyBrandsDuplicate,
      payload
    );
    return res.data;
  }

  static async updateBrand(
    brandId: string,
    payload: Partial<{ name: string; industry: string; logo_url: string; monthly_credit_cap: number }>
  ): Promise<UriResponse<BrandAccount>> {
    const res: AxiosResponse<UriResponse<BrandAccount>> = await UriHttpClient.getClient().patch(
      R.agencyBrandById.replace('{brand_id}', brandId),
      payload
    );
    return res.data;
  }

  static async archiveBrand(brandId: string): Promise<UriResponse<{ brand_id: string; archived: boolean }>> {
    const res = await UriHttpClient.getClient().delete(R.agencyBrandById.replace('{brand_id}', brandId));
    return res.data;
  }

  /** IRREVERSIBLE — removes the brand and all its data. The backend requires
   * the brand to already be archived (see archiveBrand) before this succeeds. */
  static async deleteBrandPermanently(
    brandId: string
  ): Promise<UriResponse<{ brand_id: string; permanently_deleted: boolean; deleted_counts: Record<string, number> }>> {
    const res = await UriHttpClient.getClient().delete(
      R.agencyBrandDeletePermanent.replace('{brand_id}', brandId)
    );
    return res.data;
  }

  static async listMembers(): Promise<UriResponse<AgencyMember[]>> {
    const res: AxiosResponse<UriResponse<AgencyMember[]>> = await UriHttpClient.getClient().get(R.agencyMembers);
    return res.data;
  }

  static async inviteMember(email: string, role: 'admin' | 'agent'): Promise<UriResponse<AgencyMember>> {
    const res: AxiosResponse<UriResponse<AgencyMember>> = await UriHttpClient.getClient().post(R.agencyMembers, {
      email,
      role,
    });
    return res.data;
  }

  static async removeMember(memberId: string): Promise<UriResponse<unknown>> {
    const res = await UriHttpClient.getClient().delete(R.agencyMemberById.replace('{member_id}', memberId));
    return res.data;
  }

  static async assignBrand(memberId: string, brandId: string): Promise<UriResponse<unknown>> {
    const url = R.agencyMemberBrand.replace('{member_id}', memberId).replace('{brand_id}', brandId);
    const res = await UriHttpClient.getClient().post(url);
    return res.data;
  }

  static async unassignBrand(memberId: string, brandId: string): Promise<UriResponse<unknown>> {
    const url = R.agencyMemberBrand.replace('{member_id}', memberId).replace('{brand_id}', brandId);
    const res = await UriHttpClient.getClient().delete(url);
    return res.data;
  }

  static async topUpWallet(credits: number): Promise<UriResponse<{ wallet_credits: number }>> {
    const res = await UriHttpClient.getClient().post(R.agencyWalletTopup, { credits });
    return res.data;
  }

  static async setPerBrandCaps(enabled: boolean): Promise<UriResponse<unknown>> {
    const res = await UriHttpClient.getClient().patch(`${R.agencySettings}?per_brand_caps_enabled=${enabled}`);
    return res.data;
  }

  static async getPortfolioReport(): Promise<UriResponse<PortfolioReport>> {
    const res: AxiosResponse<UriResponse<PortfolioReport>> = await UriHttpClient.getClient().get(
      R.agencyReportPortfolio
    );
    return res.data;
  }

  static async getBrandReport(brandId: string): Promise<UriResponse<BrandReport>> {
    const res: AxiosResponse<UriResponse<BrandReport>> = await UriHttpClient.getClient().get(
      R.agencyReportBrand.replace('{brand_id}', brandId)
    );
    return res.data;
  }
}
