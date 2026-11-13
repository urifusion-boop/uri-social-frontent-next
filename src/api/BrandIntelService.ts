import { UriHttpClient } from '@/src/configs/http.config';
import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import type { BrandProfileData } from '@/src/api/BrandProfileService';

const BASE = `${BackendUrlEnum.INSIGHTS}/brand-intel/website-reads`;

export type ReadStatus = 'queued' | 'running' | 'done' | 'failed' | 'none';

export interface ReadStep {
  id: string;
  label: string;
  status: 'running' | 'done';
  detail: string;
  order: number;
}

export type FindingValue = string | string[] | Record<string, string>;

export interface Finding {
  key: string;
  label: string;
  section: string;
  found: FindingValue;
  current: FindingValue | null;
  basis: 'stated' | 'inferred';
  page: string;
  status: 'new' | 'same' | 'different';
  selected: boolean;
  merge: boolean; // lists and links are added to what's there, never replacing it
}

export interface WebsiteRead {
  job_id?: string;
  status: ReadStatus;
  url?: string;
  steps?: ReadStep[];
  found?: string[];
  poll_after_ms?: number;
  error?: { code: string; message: string };
  site?: string;
  read_at?: string;
  pages?: { kind: string; url: string; title: string }[];
  findings?: Finding[];
  applied?: string[];
}

/** Reads a business's website and turns it into Brand Playbook suggestions. The read runs in the
 * background on the server, so the page can be left and the read picked up again later. */
export class BrandIntelService {
  static async start(url: string, force = false): Promise<WebsiteRead> {
    const res = await UriHttpClient.getClient().post<WebsiteRead>(BASE, { url, force });
    return res.data;
  }

  static async get(readId: string): Promise<WebsiteRead> {
    const res = await UriHttpClient.getClient().get<WebsiteRead>(`${BASE}/${readId}`);
    return res.data;
  }

  static async latest(): Promise<WebsiteRead> {
    const res = await UriHttpClient.getClient().get<WebsiteRead>(`${BASE}/latest`);
    return res.data;
  }

  static async apply(
    readId: string,
    fields: string[],
    edits: Record<string, FindingValue> = {}
  ): Promise<{ applied: string[]; profile_updates: Partial<BrandProfileData> }> {
    const res = await UriHttpClient.getClient().post(`${BASE}/${readId}/apply`, { fields, edits });
    return res.data;
  }
}
