import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';
import { loadConnections } from '@/src/hooks/useConnectedAccounts';

// One connected page/account for a platform that can have more than one
// (Facebook, Instagram, TikTok). Keyed on the connection's own `id`.
export interface ConnectedAccountEntry {
  id?: string;
  username?: string;
  account_name?: string;
  connected_via?: string;
  profile_picture_url?: string;
  // False when the account can't publish until it is reconnected (see needs_reconnect).
  is_active?: boolean | null;
  // Set by the backend when a publish showed the login has lapsed, or the account was
  // connected the old way and must be connected again; reconnect_reason says why.
  needs_reconnect?: boolean;
  reconnect_reason?: string;
}

export interface PlatformStatus {
  linked: boolean;
  username?: string;
  account_name?: string;
  connected_at?: string;
  phone?: string;
  linked_at?: string;
  ig_user_id?: string;
  connected_via?: string;
  active_author_urn?: string;
  pages?: LinkedInPage[];
  // Every connected page/account for this platform — the single fields above
  // (account_name, etc.) mirror accounts[0] for anything
  // that hasn't been updated to render the full list yet. Empty/absent when
  // the platform doesn't support multiple accounts.
  accounts?: ConnectedAccountEntry[];
  // facebook_ads only — the Per-Brand Page Connection plan's six-state gate
  // (none/content_only/ads_no_whatsapp/ready/expired/no_page), so Connected
  // Accounts can show a state-specific reason instead of just linked/not.
  meta_connection_state?: string;
  // facebook_ads only — whether META says the Page has WhatsApp connected, which is
  // NOT the same as us having an ads number on file. Saving a number records where
  // leads land; linking it to the Page is a manual OTP step in Meta with no API, and
  // without it an ad can't receive messages or report a conversation. undefined/null
  // means Meta couldn't tell us, and must not be shown as a problem.
  whatsapp_linked_to_page?: boolean | null;
  // Deep link to that Page's WhatsApp settings, so linking is one click.
  whatsapp_link_url?: string;
  // google_ads only — mirrors meta_connection_state's role, but Google's state
  // machine has an extra step Meta's doesn't (needs_account_selection).
  google_connection_state?: string;
  google_customer_id?: string;
  google_whatsapp_number?: string;
  // google_ads only — whether URI's Manager Account is currently eligible to mint
  // brand-new client accounts (Google requires it to have at least one linked
  // account with real spend + clean policy history first). undefined/null means
  // never checked yet; gates whether "Create one for me" should be offered.
  google_can_create_account?: boolean | null;
  google_manager_id?: string;
  google_link_detail?: string;
  google_created_by_uri?: boolean;
  google_currency?: string;
  google_signin_verified?: boolean;
  google_finishing?: boolean;
  google_mode?: 'uri' | 'own';
  google_uri_managed?: boolean;
}

export interface LinkedInPage {
  id: string;
  name: string;
  urn: string;
}

export interface LinkedInPagesData {
  personal_profile: { urn: string; name: string; type: string };
  pages: LinkedInPage[];
  active_author_urn: string;
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

  static async linkedinPages(): Promise<UriResponse<LinkedInPagesData>> {
    const res: AxiosResponse<UriResponse<LinkedInPagesData>> = await UriHttpClient.getClient().get('/linkedin/pages');
    return res.data;
  }

  static async linkedinSelectPage(authorUrn: string): Promise<UriResponse<{ active_author_urn: string }>> {
    const res: AxiosResponse<UriResponse<{ active_author_urn: string }>> = await UriHttpClient.getClient().post(
      '/linkedin/pages/select',
      { author_urn: authorUrn }
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
  // Routed to whatsapp-agent (its own service, own real Twilio WhatsApp Business
  // number) instead of the main backend — see http.config.ts's getWhatsAppAgentClient.

  static async whatsappConnect(phone: string): Promise<UriResponse<{ phone: string }>> {
    const res: AxiosResponse<UriResponse<{ phone: string }>> = await UriHttpClient.getWhatsAppAgentClient().post(
      '/api/v1/whatsapp/connect',
      { phone }
    );
    return res.data;
  }

  static async whatsappStatus(): Promise<UriResponse<PlatformStatus>> {
    const res: AxiosResponse<UriResponse<PlatformStatus>> =
      await UriHttpClient.getWhatsAppAgentClient().get('/api/v1/whatsapp/status');
    return res.data;
  }

  static async whatsappDisconnect(): Promise<UriResponse<string>> {
    const res: AxiosResponse<UriResponse<string>> =
      await UriHttpClient.getWhatsAppAgentClient().delete('/api/v1/whatsapp/connect');
    return res.data;
  }

  // ── Connection Status (All Platforms) ────────────────────────────────────

  static async getConnectionStatus(): Promise<{
    facebook?: { linked: boolean };
    instagram?: { linked: boolean };
    linkedin?: { linked: boolean };
    tiktok?: { linked: boolean };
  }> {
    try {
      // The brand's connected accounts, as every other screen reads them (no longer a debug endpoint).
      const res = await loadConnections();
      if (!res.status || !res.responseData) {
        return {};
      }

      const status: {
        facebook?: { linked: boolean };
        instagram?: { linked: boolean };
        linkedin?: { linked: boolean };
        tiktok?: { linked: boolean };
      } = {};

      for (const p of res.responseData.connected_platforms ?? []) {
        const platform = p?.toLowerCase();
        if (platform === 'facebook' || platform === 'instagram' || platform === 'linkedin' || platform === 'tiktok') {
          status[platform] = { linked: true };
        }
      }

      return status;
    } catch {
      return {};
    }
  }
}
