export interface ITokenDetails {
  accessToken: string;
  refreshToken: string;
}

export interface UserDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  userType?: string;
  emailVerified?: boolean; // Email verification status
  // Whether this account can log in with email+password — Google-only signups start
  // without one and only gain it via the Forgot Password flow (Settings surfaces a
  // "Set a Password" prompt instead of "Change Password" until this is true).
  hasPassword?: boolean;
  // PRD 7.1: Credit Balance (added for billing system)
  creditBalance?: number;
  creditsRemaining?: number;
  subscriptionTier?: string | null;
  lowCreditWarning?: boolean; // PRD 7.3: True when credits ≤ 3
  // Free Trial fields
  isTrial?: boolean;
  trialActive?: boolean;
  trialCreditsRemaining?: number;
  trialDaysRemaining?: number;
  trialHoursRemaining?: number;
  trialExpired?: boolean;
  trialEndDate?: string;
}
