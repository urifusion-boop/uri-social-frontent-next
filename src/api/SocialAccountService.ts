import { UriHttpClient } from '@/src/configs/http.config';
import { socialMediaAgentRoutes } from '@/src/constants/routes/socialMediaAgentRoutes';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface AvailablePage {
  id: string;
  type: string;
  name: string;
  username?: string;
  profilePictureUrl?: string;
  network?: string;
  auto_connect?: boolean;
  linked_page_id?: string;
}

export interface PendingConnection {
  session_token: string;
  network: string;
  expires_at: string;
  available_pages: AvailablePage[];
}

export interface ConnectedAccount {
  outstand_account_id: string;
  platform: string;
  username: string;
  account_name: string;
}

export class SocialAccountService {
  static async initiateConnection(
    platforms: string[],
    source: 'onboarding' | 'settings' = 'onboarding'
  ): Promise<UriResponse<{ auth_urls: Record<string, string> }>> {
    const response: AxiosResponse<UriResponse<{ auth_urls: Record<string, string> }>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.initiateConnection, { platforms, source });
    return response.data;
  }

  static async getPendingConnection(sessionToken: string): Promise<UriResponse<PendingConnection>> {
    const response: AxiosResponse<UriResponse<PendingConnection>> = await UriHttpClient.getClient().get(
      `${socialMediaAgentRoutes.pendingConnection}/${sessionToken}`
    );
    return response.data;
  }

  static async finalizeConnection(
    sessionToken: string,
    selectedPageIds: string[]
  ): Promise<UriResponse<{ accounts_connected: ConnectedAccount[] }>> {
    const response: AxiosResponse<UriResponse<{ accounts_connected: ConnectedAccount[] }>> =
      await UriHttpClient.getClient().post(socialMediaAgentRoutes.finalizeConnection, {
        session_token: sessionToken,
        selected_page_ids: selectedPageIds,
      });
    return response.data;
  }

  // Outstand's "direct" callback shape (account_id returned immediately —
  // TikTok, X) skips the session-token/page-selection step entirely, so
  // this is the only thing that actually persists the connection locally.
  static async finalizeOutstandDirect(
    accountId: string,
    network: string,
    username?: string,
    networkUniqueId?: string
  ): Promise<UriResponse<{ outstand_account_id: string; platform: string; username?: string }>> {
    const response: AxiosResponse<UriResponse<{ outstand_account_id: string; platform: string; username?: string }>> =
      await UriHttpClient.getClient().post('/social-media/connect/finalize-outstand-direct', null, {
        params: { account_id: accountId, network, username, network_unique_id: networkUniqueId },
      });
    return response.data;
  }

  static async finalizeInstagramDirect(igUserId: string): Promise<UriResponse<{ ig_user_id: string }>> {
    const response: AxiosResponse<UriResponse<{ ig_user_id: string }>> = await UriHttpClient.getClient().post(
      '/social-media/connect/instagram-direct/finalize',
      null,
      { params: { ig_user_id: igUserId } }
    );
    return response.data;
  }

  static async finalizeFacebookDirect(fbPageId: string): Promise<UriResponse<{ page_id: string }>> {
    const response: AxiosResponse<UriResponse<{ page_id: string }>> = await UriHttpClient.getClient().post(
      '/social-media/connect/facebook-direct/finalize',
      null,
      { params: { fb_page_id: fbPageId } }
    );
    return response.data;
  }

  // Ads-scoped Facebook connection (Per-Brand Page Connection plan) — separate grant
  // from finalizeFacebookDirect above (publishing-only scopes); this one carries
  // ads_management/pages_manage_ads, required for Jane's campaigns to launch.
  static async finalizeFacebookAds(fbPageId: string): Promise<UriResponse<{ fb_page_id: string }>> {
    const response: AxiosResponse<UriResponse<{ fb_page_id: string }>> = await UriHttpClient.getClient().post(
      '/social-media/connect/facebook-ads/finalize',
      null,
      { params: { fb_page_id: fbPageId } }
    );
    return response.data;
  }

  // Direct TikTok OAuth (FILE_UPLOAD posting, bypasses Outstand) — same
  // pending-then-finalize shape as finalizeFacebookDirect above.
  static async finalizeTikTokDirect(ttOpenId: string): Promise<UriResponse<{ tt_open_id: string }>> {
    const response: AxiosResponse<UriResponse<{ tt_open_id: string }>> = await UriHttpClient.getClient().post(
      '/social-media/connect/tiktok-direct/finalize',
      null,
      { params: { tt_open_id: ttOpenId } }
    );
    return response.data;
  }
}
