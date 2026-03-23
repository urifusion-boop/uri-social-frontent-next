import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { STORE_KEYS } from './store.config';

class UriHttpClient {
  private static client: AxiosInstance;

  static initialize() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_URI_API_BASE_URL || 'http://localhost:9003',
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 300,
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config) => {
        const tokens = this.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this.handleErrorResponse(error)
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
          this.clearUserData();
          window.dispatchEvent(new CustomEvent('unauthorized'));
          return Promise.reject(error.response);
        case 403:
          this.clearUserData();
          window.dispatchEvent(new CustomEvent('unauthorized'));
          return Promise.reject(error.response);
        case 404:
          return Promise.resolve(error.response);
        default:
          return Promise.resolve(error.response);
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
