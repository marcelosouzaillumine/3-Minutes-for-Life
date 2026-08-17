import { subscriptionService } from './subscriptionService';

export interface Entitlements {
  canAccessDailyPrinciples: boolean;
  canSaveFavorites: boolean;
  canAccessHistory: boolean;
  canAccessPremiumContent: boolean;
}

export const entitlementService = {
  async getUserEntitlements(userId: string | undefined): Promise<Entitlements> {
    if (!userId) {
      return {
        canAccessDailyPrinciples: false,
        canSaveFavorites: false,
        canAccessHistory: false,
        canAccessPremiumContent: false,
      };
    }

    const subscription = await subscriptionService.getCurrentSubscription(userId);
    const planCode = subscription?.planCode || 'free'; // Resolve to free if no subscription

    switch (planCode) {
      case 'premium':
        return {
          canAccessDailyPrinciples: true,
          canSaveFavorites: true,
          canAccessHistory: true,
          canAccessPremiumContent: true,
        };
      case 'plus':
        return {
          canAccessDailyPrinciples: true,
          canSaveFavorites: true,
          canAccessHistory: true,
          canAccessPremiumContent: false,
        };
      case 'free':
      default:
        return {
          canAccessDailyPrinciples: true,
          canSaveFavorites: true,
          canAccessHistory: false,
          canAccessPremiumContent: false,
        };
    }
  }
};
