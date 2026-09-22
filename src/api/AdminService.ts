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

export interface AccessCode {
  code: string;
  plan_tier_id: string;
  duration_days: number;
  max_redemptions: number | null;
  redemption_count: number;
  is_active: boolean;
  expires_at: string | null;
  label: string;
  created_by: string;
  created_at: string;
  // Personal-invite roster: non-empty means ONLY these emails can ever
  // redeem this code (enforced server-side, checked against the redeeming
  // account's own email) — a code can be assigned to one person or many
  // (e.g. 20 partner-firm signups sharing the same code string). Empty =
  // a shared/open code, anyone who has the string can redeem it.
  assigned_emails: string[];
  assigned_count?: number;
  redeemed_count?: number;
  // 'unassigned' (open code), 'pending' (assigned, nobody on the roster has
  // redeemed yet), 'partially_redeemed' (some but not all of the roster),
  // or 'fully_redeemed' (everyone on the roster has redeemed).
  status: 'unassigned' | 'pending' | 'partially_redeemed' | 'fully_redeemed';
  // Only present in the response right after creating an assigned code —
  // how many of the roster's invite emails were actually queued (0 if
  // send_email: false was passed, or the code has no roster).
  emails_sent?: number;
  // Only meaningful on the response to a revoke (is_active: false) — how
  // many people currently redeeming this code just had their access cut
  // off immediately, not just blocked from future redemptions.
  revoked_active_users?: number;
}

export interface AccessCodeRedemption {
  code: string;
  user_id: string | null;
  email: string | null;
  plan_tier_id: string;
  access_start: string | null;
  access_end: string | null;
  previous_subscription_tier: string | null;
  redeemed_at: string | null;
  // Set the moment their credits run out — a comp grant ends whichever
  // comes first, end_date or exhausting its one-time credit allocation
  // (it never refills mid-window like a real subscription does).
  revoked_at: string | null;
  revocation_reason: string | null;
  // The one field that tells the truth about THIS redemption regardless of
  // revoked_at alone: 'active' (this is still the user's current grant),
  // 'lapsed' (access_end passed), 'revoked' (revoked_at is set),
  // 'superseded' (not revoked, not lapsed, but the wallet has since moved
  // on to something else without going through a tracked revoke — e.g. a
  // code redeemed before the no-double-redeeming guard existed), or
  // 'not_redeemed' — a synthetic row for an assigned roster member who
  // hasn't redeemed yet (no user_id, nothing to revoke/restore).
  effective_status?: 'active' | 'lapsed' | 'revoked' | 'superseded' | 'not_redeemed';
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

  /**
   * Create a new redeemable access code (e.g. a partner comp like "ASA26").
   * Omit `code` to have the server auto-generate one.
   */
  static async createAccessCode(params: {
    code?: string;
    plan_tier_id: string;
    duration_days: number;
    max_redemptions?: number;
    expires_at?: string;
    label?: string;
    /** Reserve this code for these specific people — omit/empty for a shared code anyone can redeem. */
    assigned_emails?: string[];
    /** When assigned_emails is set, email each of them the code immediately. Defaults to true server-side. */
    send_email?: boolean;
  }): Promise<AccessCode> {
    const response = await UriHttpClient.getClient().post('/api/admin/access-codes', params);
    return response.data;
  }

  /** (Re)send an already-assigned code to its roster — e.g. it was created
   * with the email skipped, or someone never got/lost it. Pass `email` to
   * resend to just that one roster member; omit it to resend to everyone
   * on the roster at once. */
  static async sendAccessCodeEmail(code: string, email?: string): Promise<{ sent: boolean; to: string[] }> {
    const response = await UriHttpClient.getClient().post(`/api/admin/access-codes/${code}/send-email`, null, {
      params: email ? { email } : undefined,
    });
    return response.data;
  }

  /** Permanently remove a code — distinct from revoking (is_active: false),
   * which keeps it around for its audit trail. Use this to clean up a
   * mistake or a test code; anyone currently redeeming it is cut off first. */
  static async deleteAccessCode(
    code: string
  ): Promise<{ deleted: boolean; code: string; revoked_active_users: number }> {
    const response = await UriHttpClient.getClient().delete(`/api/admin/access-codes/${code}`);
    return response.data;
  }

  /** Undo an earlier revoke/exhaustion for ONE specific redeemer — grants a
   * fresh full-duration window of the code's plan and clears their
   * redemption's revoked_at, without needing a whole new code. */
  static async restoreAccessCodeRedemption(
    code: string,
    userId: string
  ): Promise<{ restored: boolean; user_id: string; access_end: string }> {
    const response = await UriHttpClient.getClient().post(
      `/api/admin/access-codes/${code}/redemptions/${userId}/restore`
    );
    return response.data;
  }

  /** Revoke ONE redeemer's access without touching the code itself or
   * anyone else redeemed on it — for a shared code's abuse case or an
   * assigned roster where one person needs to be pulled without disturbing
   * the rest. */
  static async revokeAccessCodeRedemption(
    code: string,
    userId: string
  ): Promise<{ revoked: boolean; user_id: string }> {
    const response = await UriHttpClient.getClient().post(
      `/api/admin/access-codes/${code}/redemptions/${userId}/revoke`
    );
    return response.data;
  }

  static async listAccessCodes(): Promise<{ codes: AccessCode[]; count: number }> {
    const response = await UriHttpClient.getClient().get('/api/admin/access-codes');
    return response.data;
  }

  static async listAccessCodeRedemptions(
    code: string
  ): Promise<{ code: string; redemptions: AccessCodeRedemption[]; count: number }> {
    const response = await UriHttpClient.getClient().get(`/api/admin/access-codes/${code}/redemptions`);
    return response.data;
  }

  /** Revoke a code early (is_active: false), edit its label, or replace its
   * whole assigned roster. Pass assigned_emails: [] to clear an existing
   * roster back to a shared/open code — distinct from omitting it, which
   * leaves the roster untouched. Removing someone from the roster only
   * blocks their FUTURE redemption — it doesn't revoke access they've
   * already redeemed; use revokeAccessCodeRedemption for that. */
  static async updateAccessCode(
    code: string,
    updates: { is_active?: boolean; label?: string; assigned_emails?: string[] }
  ): Promise<AccessCode> {
    const response = await UriHttpClient.getClient().patch(`/api/admin/access-codes/${code}`, updates);
    return response.data;
  }
}
