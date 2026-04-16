/**
 * Notification System API Service
 * Aligned with Notification System PRD V1
 */
import { UriHttpClient } from '@/src/configs/http.config';
import { AxiosResponse } from 'axios';

export interface Notification {
  notification_id: string;
  user_id: string;
  type:
    | 'signup'
    | 'content_created'
    | 'content_posted'
    | 'daily_suggestion'
    | 'inactivity'
    | 'trial_start'
    | 'trial_ending'
    | 'trial_expired';
  channel: 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed' | 'rate_limited';
  subject: string;
  metadata: Record<string, unknown>;
  read?: boolean;
  read_at?: string;
  created_at: string;
  sent_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  page_size: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

interface ApiResponse<T> {
  status: boolean;
  responseCode: number;
  responseMessage: string;
  responseData: T;
}

export class NotificationService {
  static async getNotifications(
    page: number = 1,
    pageSize: number = 20,
    notificationType?: string
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (notificationType) params.set('notification_type', notificationType);

    const response: AxiosResponse<ApiResponse<NotificationListResponse>> = await UriHttpClient.getClient().get(
      `/social-media/notifications/?${params.toString()}`
    );

    return response.data.responseData;
  }

  static async getUnreadCount(): Promise<number> {
    const response: AxiosResponse<ApiResponse<UnreadCountResponse>> = await UriHttpClient.getClient().get(
      '/social-media/notifications/unread-count'
    );

    return response.data.responseData.unread_count;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await UriHttpClient.getClient().put(`/social-media/notifications/${notificationId}/read`);
  }

  static async updatePreferences(preferences: { opt_out?: boolean; email_notifications?: boolean }): Promise<void> {
    await UriHttpClient.getClient().put('/social-media/notifications/preferences', preferences);
  }
}
