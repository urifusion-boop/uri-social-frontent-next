import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface ContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot — hidden from people, so anything in it means a bot. */
  website?: string;
}

export interface ApiWaitlistRequest {
  email: string;
  name?: string;
  website?: string;
}

/** Marketing-site forms that work without being logged in. */
export class PublicFormsService {
  static async sendContactMessage(data: ContactMessageRequest): Promise<UriResponse<null>> {
    const response: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().post('/public/contact', data);
    return response.data;
  }

  static async joinApiWaitlist(data: ApiWaitlistRequest): Promise<UriResponse<null>> {
    const response: AxiosResponse<UriResponse<null>> = await UriHttpClient.getClient().post(
      '/public/api-waitlist',
      data
    );
    return response.data;
  }

  /**
   * The HTTP client rejects with the response itself, so the server's message is at
   * err.data.detail — a string for 429, a list of field errors for a 422.
   */
  static errorMessage(err: unknown, fallback: string): string {
    const detail = (err as { data?: { detail?: unknown } })?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const field = (detail[0] as { loc?: unknown[] } | undefined)?.loc?.slice(-1)[0];
      if (field === 'email') return 'Please enter a valid email address.';
      return 'Please check the form and try again.';
    }
    return fallback;
  }
}
