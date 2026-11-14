import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export class SocialAccountService {
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

  // Direct TikTok OAuth (FILE_UPLOAD posting) — same
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
