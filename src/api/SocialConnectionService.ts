import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface PlatformStatus {
  linked: boolean;
  username?: string;
  account_name?: string;
  connected_at?: string;
  phone?: string;
  linked_at?: string;
  outstand_account_id?: string;
  ig_user_id?: string;
  connected_via?: string;
}

export interface PublishPayload {
  content: string;
  tweets?: string[];
}

export interface PublishResult {
  post_id?: string;
  tweet_id?: string;
  content: string;
}

export class SocialConnectionService {
  // ── LinkedIn ──────────────────────────────────────────────────────────────

  static async linkedinConnect(): Promise<UriResponse<{ auth_url: string }>> {
    const res: AxiosResponse<UriResponse<{ auth_url: string }>> =
      await UriHttpClient.getClient().post('/linkedin/connect');
    return res.data;
  }

  static async linkedinStatus(): Promise<UriResponse<PlatformStatus>> {
    const res: AxiosResponse<UriResponse<PlatformStatus>> = await UriHttpClient.getClient().get('/linkedin/status');
    return res.data;
  }

  static async linkedinDisconnect(): Promise<UriResponse<string>> {
    const res: AxiosResponse<UriResponse<string>> = await UriHttpClient.getClient().delete('/linkedin/connect');
    return res.data;
  }

  static async linkedinPublish(payload: PublishPayload): Promise<UriResponse<PublishResult>> {
    const res: AxiosResponse<UriResponse<PublishResult>> = await UriHttpClient.getClient().post(
      '/linkedin/publish',
      payload
    );
    return res.data;
  }

  // ── X (Twitter) ───────────────────────────────────────────────────────────

  static async xConnect(): Promise<UriResponse<{ auth_url: string }>> {
    const res: AxiosResponse<UriResponse<{ auth_url: string }>> = await UriHttpClient.getClient().post('/x/connect');
    return res.data;
  }

  static async xStatus(): Promise<UriResponse<PlatformStatus>> {
    const res: AxiosResponse<UriResponse<PlatformStatus>> = await UriHttpClient.getClient().get('/x/status');
    return res.data;
  }

  static async xDisconnect(): Promise<UriResponse<string>> {
    const res: AxiosResponse<UriResponse<string>> = await UriHttpClient.getClient().delete('/x/connect');
    return res.data;
  }

  static async xPublish(payload: PublishPayload): Promise<UriResponse<PublishResult>> {
    const res: AxiosResponse<UriResponse<PublishResult>> = await UriHttpClient.getClient().post('/x/publish', payload);
    return res.data;
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  static async whatsappConnect(phone: string): Promise<UriResponse<{ phone: string }>> {
    const res: AxiosResponse<UriResponse<{ phone: string }>> = await UriHttpClient.getClient().post(
      '/whatsapp/connect',
      { phone }
    );
    return res.data;
  }

  static async whatsappStatus(): Promise<UriResponse<PlatformStatus>> {
    const res: AxiosResponse<UriResponse<PlatformStatus>> = await UriHttpClient.getClient().get('/whatsapp/status');
    return res.data;
  }

  static async whatsappDisconnect(): Promise<UriResponse<string>> {
    const res: AxiosResponse<UriResponse<string>> = await UriHttpClient.getClient().delete('/whatsapp/connect');
    return res.data;
  }
}
