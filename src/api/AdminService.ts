/**
 * Admin Service
 * API calls for admin-only user management
 */

import { UriHttpClient } from '@/src/configs/http.config';

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  createdAt: string;
  subscription_tier?: string;
  trial_start?: string;
  trial_end?: string;
  credits_balance?: number;
  is_admin?: boolean;
}

export interface AdminUserDetails extends AdminUser {
  brand_profiles: BrandProfile[];
  content_count: number;
  workspaces: Workspace[];
}

export interface BrandProfile {
  id: string;
  brand_name?: string;
  industry?: string;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name?: string;
  created_at?: string;
}

export interface UsersPaginationResponse {
  users: AdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface RecentUsersResponse {
  users: AdminUser[];
  count: number;
  days: number;
}

export interface AdminStats {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  subscription_stats: Record<string, number>;
  total_content: number;
  total_brands: number;
  total_workspaces: number;
}

export interface EmailExport {
  email: string;
  name: string;
  registered_at: string;
}

export interface CreditAdjustResponse {
  user_id: string;
  credits_balance: number;
  bonus_credits: number;
  total_credits: number;
}

export interface TrialAdjustResponse {
  is_trial: boolean;
  trial_active: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_credits?: number;
  credits_remaining: number;
  days_remaining?: number;
  hours_remaining?: number;
  trial_expired: boolean;
  trial_already_used: boolean;
  low_credit_warning?: boolean;
}

export class AdminService {
  /**
   * Get all users with pagination, search, and sorting
   */
  static async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: 'createdAt' | 'email' | 'name';
    sort_order?: 'asc' | 'desc';
  }): Promise<UsersPaginationResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const response = await UriHttpClient.getClient().get(`/api/admin/users?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get recently signed up users
   */
  static async getRecentUsers(days: number = 7): Promise<RecentUsersResponse> {
    const response = await UriHttpClient.getClient().get(`/api/admin/users/recent?days=${days}`);
    return response.data;
  }

  /**
   * Get detailed information about a specific user
   */
  static async getUserDetails(userId: string): Promise<AdminUserDetails> {
    const response = await UriHttpClient.getClient().get(`/api/admin/users/${userId}`);
    return response.data;
  }

  /**
   * Get platform statistics
   */
  static async getStats(): Promise<AdminStats> {
    const response = await UriHttpClient.getClient().get('/api/admin/stats');
    return response.data;
  }

  /**
   * Export all user emails
   */
  static async exportEmails(): Promise<EmailExport[]> {
    const response = await UriHttpClient.getClient().get('/api/admin/users/export/emails');
    return response.data.emails;
  }

  /**
   * Adjust a user's credit balance by a signed amount (positive grants,
   * negative claws back). Floored at 0 server-side.
   */
  static async adjustUserCredits(userId: string, amount: number, reason?: string): Promise<CreditAdjustResponse> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/credits/adjust`, {
      amount,
      reason,
    });
    return response.data;
  }

  /**
   * Adjust a user's remaining trial credits by a signed amount. Floored at 0 server-side.
   */
  static async adjustUserTrialCredits(userId: string, amount: number, reason?: string): Promise<TrialAdjustResponse> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/trial/adjust`, {
      amount,
      reason,
    });
    return response.data;
  }

  /**
   * Force-expire a user's trial (credits_remaining=0, trial_used=true).
   */
  static async expireUserTrial(userId: string): Promise<TrialAdjustResponse> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/trial/expire`);
    return response.data;
  }

  /**
   * Grant admin access to a user. Caller must already be an admin — enforced
   * server-side, not just by hiding the button.
   */
  static async grantAdmin(userId: string): Promise<{ user_id: string; is_admin: boolean }> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/admin/grant`);
    return response.data;
  }

  /**
   * Revoke a user's admin access. The backend rejects revoking your own
   * access (self-lockout guard), regardless of what the UI allows.
   */
  static async revokeAdmin(userId: string): Promise<{ user_id: string; is_admin: boolean }> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/admin/revoke`);
    return response.data;
  }

  /**
   * Ask the backend whether the CURRENT logged-in user is an admin and/or has
   * support access — the source of truth for nav visibility for both. Both are
   * DB-driven (grantable via grantAdmin/revokeAdmin and grantSupport/
   * revokeSupport) plus the env-configured bootstrap admin allowlist, neither
   * of which the frontend can determine on its own — not a synchronous
   * client-side check. One call covers both flags (the backend returns both
   * from the same /api/admin/me response) rather than a second round-trip for
   * support status alone.
   */
  static async checkAdminStatus(): Promise<{ isAdmin: boolean; isSupport: boolean }> {
    try {
      const response = await UriHttpClient.getClient().get('/api/admin/me');
      return {
        isAdmin: !!response.data?.is_admin,
        isSupport: !!response.data?.is_support,
      };
    } catch {
      return { isAdmin: false, isSupport: false };
    }
  }

  /**
   * Grant support access (jane-whatsapp-reply escalation replies) to a user.
   * Admin-only — enforced server-side.
   */
  static async grantSupport(userId: string): Promise<{ user_id: string; is_support: boolean }> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/support/grant`);
    return response.data;
  }

  /**
   * Revoke a user's support access.
   */
  static async revokeSupport(userId: string): Promise<{ user_id: string; is_support: boolean }> {
    const response = await UriHttpClient.getClient().post(`/api/admin/users/${userId}/support/revoke`);
    return response.data;
  }
}
