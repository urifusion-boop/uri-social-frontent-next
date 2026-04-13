/**
 * Billing & Credit System API Service
 * Strictly aligned with PRICING PRD V1
 *
 * Handles:
 * - Credit balance queries (PRD 7.1)
 * - Payment initialization (PRD 6.3)
 * - Subscription management (PRD 5 & 6.1)
 * - Transaction history (PRD 11)
 */
import { UriHttpClient } from '@/src/configs/http.config';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { AxiosResponse } from 'axios';

// ==================== PRD 7.1: Credit Balance ====================

export interface CreditBalanceResponse {
  total_credits: number;
  credits_used: number;
  credits_remaining: number;
  subscription_tier: string | null;
  next_renewal: string | null;
  low_credit_warning: boolean; // PRD 7.3: True when credits ≤ 3
}

export interface CreditTransaction {
  _id: string;
  user_id: string;
  type: 'allocation' | 'deduction' | 'bonus' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  reason: 'subscription' | 'retry' | 'campaign_generation' | 'refund' | 'bonus';
  campaign_id?: string;
  retry_count?: number;
  created_at: string;
}

// ==================== PRD 5: Subscription Tiers ====================

export interface SubscriptionTier {
  tier_id: string;
  name: string;
  price_ngn: number;
  credits: number;
  price_per_credit: number;
  features: string[];
  is_active: boolean;
}

export interface SubscriptionResponse {
  tier_id: string;
  name: string;
  price_ngn: number;
  credits: number;
  credits_remaining: number;
  next_renewal: string | null;
}

// ==================== PRD 6.3: Payment Flow ====================

export interface InitializePaymentRequest {
  tier_id: string;
}

export interface InitializePaymentResponse {
  payment_url: string;
  transaction_ref: string;
  amount: number;
  email: string;
  currency: string;
  public_key: string;
}

export interface VerifyPaymentRequest {
  transaction_ref: string;
}

export interface PaymentTransaction {
  _id: string;
  user_id: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string | null;
  gateway: string;
  subscription_tier: string;
  created_at: string;
  completed_at: string | null;
}

// ==================== PRD 8: Credit Exhaustion Check ====================

export interface CanGenerateResponse {
  can_generate: boolean;
  blocked: boolean;
  credits_remaining?: number;
}

// ==================== Billing Service Class ====================

export class BillingService {
  /**
   * Get user's current credit balance
   * PRD 7.1: User Wallet (total_credits, credits_used, credits_remaining)
   * PRD 7.3: Low Credit Warning when credits ≤ 3
   */
  static async getCreditBalance(): Promise<CreditBalanceResponse> {
    const response: AxiosResponse<CreditBalanceResponse> = await UriHttpClient.getClient().get(
      '/social-media/billing/credits/balance'
    );

    return response.data;
  }

  /**
   * Get user's credit transaction history
   * PRD 11: Must log all credit usage events
   */
  static async getTransactionHistory(limit: number = 50): Promise<CreditTransaction[]> {
    const response: AxiosResponse<UriResponse<CreditTransaction[]>> = await UriHttpClient.getClient().get(
      `/social-media/billing/credits/transactions?limit=${limit}`
    );

    if (!response.data.status) {
      throw new Error(response.data.responseMessage || 'Failed to fetch transaction history');
    }

    return response.data.responseData!;
  }

  /**
   * Get all available subscription tiers
   * PRD Section 5: Plan Structure
   */
  static async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    const response: AxiosResponse<SubscriptionTier[]> = await UriHttpClient.getClient().get(
      '/social-media/billing/subscription/tiers'
    );

    return response.data;
  }

  /**
   * Get user's current active subscription
   * PRD 6.1: Subscription details
   */
  static async getCurrentSubscription(): Promise<SubscriptionResponse | null> {
    try {
      const response: AxiosResponse<SubscriptionResponse> = await UriHttpClient.getClient().get(
        '/social-media/billing/subscription/current'
      );

      return response.data;
    } catch (error: unknown) {
      // Return null if no subscription found (404)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Initialize SQUAD payment checkout
   * PRD 6.3: Payment Flow - Step 2
   */
  static async initializePayment(tierId: string): Promise<InitializePaymentResponse> {
    const response: AxiosResponse<InitializePaymentResponse> = await UriHttpClient.getClient().post(
      '/social-media/billing/initialize-payment',
      { tier_id: tierId }
    );

    return response.data;
  }

  /**
   * Verify payment status with backend
   * PRD 6.3: Payment Flow - Step 8
   */
  static async verifyPayment(transactionRef: string): Promise<boolean> {
    const response: AxiosResponse<UriResponse<{ verified: boolean }>> = await UriHttpClient.getClient().post(
      '/social-media/billing/verify-payment',
      { transaction_ref: transactionRef }
    );

    return response.data.responseData?.verified || false;
  }

  /**
   * Get user's payment history
   */
  static async getPaymentHistory(limit: number = 20): Promise<PaymentTransaction[]> {
    const response: AxiosResponse<UriResponse<PaymentTransaction[]>> = await UriHttpClient.getClient().get(
      `/social-media/billing/payments/history?limit=${limit}`
    );

    if (!response.data.status) {
      throw new Error(response.data.responseMessage || 'Failed to fetch payment history');
    }

    return response.data.responseData!;
  }

  /**
   * Cancel user's subscription
   * PRD 13: MVP Scope allows cancellation
   */
  static async cancelSubscription(): Promise<void> {
    const response: AxiosResponse<UriResponse<Record<string, never>>> = await UriHttpClient.getClient().post(
      '/social-media/billing/subscription/cancel'
    );

    if (!response.data.status) {
      throw new Error(response.data.responseMessage || 'Failed to cancel subscription');
    }
  }

  /**
   * Check if user can generate content (has credits)
   * PRD 8: When credits = 0, block new campaign generation
   */
  static async canGenerateContent(): Promise<CanGenerateResponse> {
    try {
      const response: AxiosResponse<UriResponse<CanGenerateResponse>> = await UriHttpClient.getClient().get(
        '/social-media/billing/credits/can-generate'
      );

      return response.data.responseData!;
    } catch (error: unknown) {
      // If 402 Payment Required, user is blocked
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 402) {
          return {
            can_generate: false,
            blocked: true,
            credits_remaining: 0,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Format Nigerian Naira currency
   */
  static formatNGN(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date to readable string
   */
  static formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Get days until renewal
   */
  static getDaysUntilRenewal(renewalDate: string | null): number | null {
    if (!renewalDate) return null;

    const now = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get current Squad payment mode (sandbox or live)
   */
  static async getSquadMode(): Promise<{ current_mode: string; available_modes: { sandbox: boolean; live: boolean } }> {
    const response: AxiosResponse<
      UriResponse<{ current_mode: string; available_modes: { sandbox: boolean; live: boolean } }>
    > = await UriHttpClient.getClient().get('/social-media/billing/squad/mode');

    if (!response.data.status) {
      throw new Error(response.data.responseMessage || 'Failed to get Squad mode');
    }

    return response.data.responseData!;
  }

  /**
   * Set Squad payment mode (requires server restart)
   */
  static async setSquadMode(mode: 'sandbox' | 'live'): Promise<{ instructions: string[] }> {
    const response: AxiosResponse<
      UriResponse<{ requested_mode: string; current_mode: string; requires_restart: boolean; instructions: string[] }>
    > = await UriHttpClient.getClient().post('/social-media/billing/squad/mode', { mode });

    if (!response.data.status) {
      throw new Error(response.data.responseMessage || 'Failed to set Squad mode');
    }

    return { instructions: response.data.responseData!.instructions };
  }
}
