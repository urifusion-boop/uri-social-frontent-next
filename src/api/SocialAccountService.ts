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
  static async initiateConnection(platforms: string[]): Promise<UriResponse<{ auth_urls: Record<string, string> }>> {
    const response: AxiosResponse<UriResponse<{ auth_urls: Record<string, string> }>> = await UriHttpClient.getClient().post(socialMediaAgentRoutes.initiateConnection, { platforms });
    return response.data;
  }

  static async getPendingConnection(sessionToken: string): Promise<UriResponse<PendingConnection>> {
    const response: AxiosResponse<UriResponse<PendingConnection>> = await UriHttpClient.getClient().get(`${socialMediaAgentRoutes.pendingConnection}/${sessionToken}`);
    return response.data;
  }

  static async finalizeConnection(sessionToken: string, selectedPageIds: string[]): Promise<UriResponse<{ accounts_connected: ConnectedAccount[] }>> {
    const response: AxiosResponse<UriResponse<{ accounts_connected: ConnectedAccount[] }>> = await UriHttpClient.getClient().post(socialMediaAgentRoutes.finalizeConnection, {
      session_token: sessionToken,
      selected_page_ids: selectedPageIds,
    });
    return response.data;
  }
}
