import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponseData {
  accessToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  static async loginApi(data: LoginRequest): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post('/social-media/auth/login', data);
    return response.data;
  }

  static async signupApi(data: SignupRequest): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post('/social-media/auth/signup', data);
    return response.data;
  }

  static async googleAuth(code: string, redirectUri: string): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post('/social-media/auth/google', { code, redirect_uri: redirectUri });
    return response.data;
  }
}
