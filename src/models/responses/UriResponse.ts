export class UriResponse<T> {
  status!: boolean | false;
  responseCode!: number;
  responseMessage!: string | '';
  responseData?: T | null;
}
