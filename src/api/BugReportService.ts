import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface BugReportRequest {
  category: string;
  title: string;
  description: string;
  steps_to_reproduce?: string;
  page_url?: string;
  browser_info?: string;
}

export interface BugReportData {
  report_id: string;
}

export class BugReportService {
  static async submitReport(data: BugReportRequest): Promise<UriResponse<BugReportData>> {
    const response: AxiosResponse<UriResponse<BugReportData>> = await UriHttpClient.getClient().post(
      '/social-media/bug-reports/report',
      data
    );
    return response.data;
  }
}
