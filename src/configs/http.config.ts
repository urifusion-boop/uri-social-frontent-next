import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { STORE_KEYS } from './store.config';

class UriHttpClient {
  private static client: AxiosInstance;

  private static getApiBaseUrl(): string {
    // Check if we're in production or development/staging
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Use DEV variable for development/staging, regular variable for production
    const baseUrl = isDevelopment
      ? process.env.NEXT_PUBLIC_URI_API_BASE_URL_DEV
      : process.env.NEXT_PUBLIC_URI_API_BASE_URL;

    // Fallback to localhost for local development
    const apiUrl = baseUrl || 'http://localhost:9003';

    console.log(`[HTTP] Initializing with API base URL: ${apiUrl} (Environment: ${process.env.NODE_ENV})`);
    return apiUrl;
  }

  static initialize() {
    this.client = axios.create({
      baseURL: this.getApiBaseUrl(),
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 300,
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 [HTTP Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          console.log(`🔑 [HTTP] Auth token added for ${config.url}`);
        } else {
          console.warn(`⚠️ [HTTP] No access token found for ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('❌ [HTTP Request Error]', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ [HTTP Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        console.log(`📦 [HTTP Response Data]`, response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ [HTTP Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.status, error.response?.data);
        return this.handleErrorResponse(error);
      }
    );
  }

  static getClient(): AxiosInstance {
    if (!this.client) {
      this.initialize();
    }
    return this.client;
  }

  private static getStoredTokens() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEYS.USER_TOKENS) || '{}');
    } catch {
      return {};
    }
  }

  private static async handleErrorResponse(error: AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Only clear on auth endpoints, not on resource not found
          if (error.config?.url?.includes('/auth/')) {
            this.clearUserData();
            window.dispatchEvent(new CustomEvent('unauthorized'));
          }
          return Promise.reject(error.response);
        case 403:
          // Only clear tokens if it's an authentication issue, not authorization
          // Don't clear on brand-profile 403 as user might not have completed onboarding
          // Don't clear on connect endpoints as these might have other authorization issues
          // Don't clear on notification endpoints as expired tokens are handled by polling
          const isBrandProfile = error.config?.url?.includes('/brand-profile');
          const isConnectEndpoint = error.config?.url?.includes('/connect');
          const isNotificationEndpoint = error.config?.url?.includes('/notifications');
          if (!isBrandProfile && !isConnectEndpoint && !isNotificationEndpoint) {
            this.clearUserData();
            window.dispatchEvent(new CustomEvent('unauthorized'));
          }
          return Promise.reject(error.response);
        case 404:
          // 404 means resource not found, not authentication failure - don't clear tokens
          // This can happen if Azure Functions proxy isn't deployed properly
          console.warn(`[HTTP] 404 error for ${error.config?.url} - keeping tokens`);
          return Promise.reject(error.response);
        default:
          // Reject all other errors (including 409 Conflict) so they can be caught by try-catch
          return Promise.reject(error.response);
      }
    }
    return Promise.reject(error);
  }

  private static clearUserData() {
    localStorage.removeItem(STORE_KEYS.USER_DETAILS);
    localStorage.removeItem(STORE_KEYS.USER_TOKENS);
  }

  static readonly instantiate = () => new UriHttpClient();
}

export { UriHttpClient };
