export class UriResponse<T> {
  status!: boolean | false;
  responseCode!: number | string; // Allow both number (HTTP codes) and string (semantic codes like 'INCOMPLETE_PROFILE')
  responseMessage!: string | '';
  responseData?: T | null;
}
