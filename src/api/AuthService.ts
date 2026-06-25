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
  requiresVerification?: boolean;
  emailVerified?: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export class AuthService {
  static async loginApi(data: LoginRequest): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post(
      '/social-media/auth/login',
      data
    );
    return response.data;
  }

  static async signupApi(data: SignupRequest): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post(
      '/social-media/auth/signup',
      data
    );
    return response.data;
  }

  static async googleAuth(code: string, redirectUri: string): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post(
      '/social-media/auth/google',
      { code, redirect_uri: redirectUri }
    );
    return response.data;
  }

  static async verifyEmail(data: VerifyEmailRequest): Promise<UriResponse<AuthResponseData>> {
    const response: AxiosResponse<UriResponse<AuthResponseData>> = await UriHttpClient.getClient().post(
      '/social-media/auth/verify-email',
      data
    );
    return response.data;
  }

  static async resendVerification(data: ResendVerificationRequest): Promise<UriResponse<{ email: string }>> {
    const response: AxiosResponse<UriResponse<{ email: string }>> = await UriHttpClient.getClient().post(
      '/social-media/auth/resend-verification',
      data
    );
    return response.data;
  }

  static async forgotPassword(data: ForgotPasswordRequest): Promise<UriResponse<object>> {
    const response: AxiosResponse<UriResponse<object>> = await UriHttpClient.getClient().post(
      '/social-media/auth/forgot-password',
      data
    );
    return response.data;
  }

  static async resetPassword(data: ResetPasswordRequest): Promise<UriResponse<object>> {
    const response: AxiosResponse<UriResponse<object>> = await UriHttpClient.getClient().post(
      '/social-media/auth/reset-password',
      data
    );
    return response.data;
  }

  static async changePassword(data: ChangePasswordRequest): Promise<UriResponse<object>> {
    const response: AxiosResponse<UriResponse<object>> = await UriHttpClient.getClient().post(
      '/social-media/auth/change-password',
      data
    );
    return response.data;
  }

  static async verifyMagicLink(token: string): Promise<UriResponse<AuthResponseData & { redirect_url?: string }>> {
    const response: AxiosResponse<UriResponse<AuthResponseData & { redirect_url?: string }>> =
      await UriHttpClient.getClient().get(`/social-media/auth/magic-link/verify?token=${token}`);
    return response.data;
  }
}
