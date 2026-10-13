import { UriHttpClient } from '@/src/configs/http.config';
import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

const BASE = `${BackendUrlEnum.INSIGHTS}/social-media/notification-channels`;

export type ChannelKey = 'email' | 'dashboard' | 'whatsapp' | 'sms' | 'slack' | 'telegram' | 'push';

/** available = the server can send on it; connected = this brand/user can receive on it. */
export type ChannelStatus = Record<ChannelKey, { available: boolean; connected: boolean; detail: string }>;

export class NotificationChannelsService {
  static async status(): Promise<ChannelStatus | null> {
    try {
      const res: AxiosResponse<UriResponse<ChannelStatus>> = await UriHttpClient.getClient().get(`${BASE}/status`);
      return res.data?.responseData ?? null;
    } catch {
      return null;
    }
  }

  static async sendTest(): Promise<UriResponse<Record<string, { sent: boolean; error: string | null }>>> {
    const res: AxiosResponse<UriResponse<Record<string, { sent: boolean; error: string | null }>>> =
      await UriHttpClient.getClient().post(`${BASE}/test`, {});
    return res.data;
  }

  static async telegramLink(): Promise<string | null> {
    const res: AxiosResponse<UriResponse<{ url: string }>> = await UriHttpClient.getClient().post(
      `${BASE}/telegram/link`
    );
    return res.data?.responseData?.url ?? null;
  }

  static async telegramDisconnect(): Promise<void> {
    await UriHttpClient.getClient().post(`${BASE}/telegram/disconnect`);
  }

  static async pushPublicKey(): Promise<string | null> {
    try {
      const res: AxiosResponse<UriResponse<{ public_key: string }>> = await UriHttpClient.getClient().get(
        `${BASE}/push/public-key`
      );
      return res.data?.responseData?.public_key ?? null;
    } catch {
      return null;
    }
  }

  static async pushSubscribe(sub: PushSubscriptionJSON): Promise<void> {
    await UriHttpClient.getClient().post(`${BASE}/push/subscribe`, { endpoint: sub.endpoint, keys: sub.keys });
  }

  static async pushUnsubscribe(endpoint: string): Promise<void> {
    await UriHttpClient.getClient().post(`${BASE}/push/unsubscribe`, { endpoint });
  }
}

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/**
 * Turn on browser push for this device: register the service worker, ask the
 * browser for permission, and save the subscription. Returns a user-facing
 * error message, or null on success.
 */
export async function enableBrowserPush(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return "This browser doesn't support push notifications.";
  }
  const key = await NotificationChannelsService.pushPublicKey();
  if (!key) return "Push notifications aren't set up on the server yet.";
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'Notifications are blocked for this site in your browser settings.';
  const reg = await navigator.serviceWorker.register('/push-sw.js');
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }));
  await NotificationChannelsService.pushSubscribe(sub.toJSON());
  return null;
}
