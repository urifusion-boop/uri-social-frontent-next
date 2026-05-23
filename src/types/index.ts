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
