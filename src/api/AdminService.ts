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
   * Check if current user is admin
   */
  static isAdmin(userEmail?: string | null): boolean {
    return userEmail === 'urisocialingsight@gmail.com';
  }
}
