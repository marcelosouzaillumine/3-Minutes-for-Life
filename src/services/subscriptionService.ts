import { supabase } from '../lib/supabase';

export interface Subscription {
  userId: string;
  planId: string;
  status: string;
  provider: string;
  startedAt: string;
  expiresAt?: string;
  planCode: string;
}

export const subscriptionService = {
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans ( code )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    if (!data) {
      return null; // Indicates no active subscription, will resolve to 'free' in entitlements
    }

    return {
      userId: data.user_id,
      planId: data.plan_id,
      status: data.status,
      provider: data.provider,
      startedAt: data.started_at,
      expiresAt: data.expires_at,
      planCode: data.plans.code,
    };
  }
};
