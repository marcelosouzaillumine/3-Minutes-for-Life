import { supabase } from '../lib/supabase';

export interface Supporter {
  id: string;
  user_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'draft';
  starts_at?: string;
  ends_at?: string;
}

export interface Contribution {
  id: string;
  supporter_id: string;
  campaign_id?: string;
  amount: number;
  currency: string;
  frequency: 'one_time' | 'recurring';
  status: 'pending' | 'completed' | 'active' | 'canceled' | 'failed';
  provider: string;
  provider_reference: string;
  started_at: string;
  ended_at?: string;
}

export const MissionService = {
  async getSupporterStatus(userId: string): Promise<Supporter | null> {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching supporter status:', error);
      return null;
    }
    return data;
  },

  async getDailyImpact(): Promise<number> {
    try {
      // Chama a função RPC que ignora o RLS para obter a contagem total
      const { data: count, error } = await supabase.rpc('get_total_profiles_count');
      
      if (error) {
        console.error('Erro ao buscar total de usuários:', error);
        return 1247; // fallback temporário
      }
      
      return count || 0;
    } catch (err) {
      console.error('Error fetching real user count:', err);
      return 1247;
    }
  },

  async getContributions(): Promise<Contribution[]> {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching contributions:', error);
      return [];
    }
    return data || [];
  },

  async getActiveCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
    return data || [];
  },

  async createCheckout(
    amountCents: number,
    cpfCnpj: string,
    frequency: 'one_time' | 'monthly' | 'yearly' = 'one_time',
    paymentMethod: 'pix' | 'credit_card' | 'undefined' = 'undefined'
  ): Promise<{ checkoutUrl: string; contributionId: string; providerReference?: string }> {
    const { illumineFetch } = await import('../lib/illumine');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('Autenticação necessária.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const customerName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];

    const isRecurring = frequency === 'monthly' || frequency === 'yearly';
    const billingType =
      paymentMethod === 'pix' ? 'PIX'
      : paymentMethod === 'credit_card' ? 'CREDIT_CARD'
      : 'UNDEFINED';

    // 1. Create Asaas payment/subscription via Illumine gateway
    const illumineRes = await illumineFetch('/asaas/checkout', {
      method: 'POST',
      body: JSON.stringify({
        billingType,
        amountCents,
        customer: { name: customerName, email: user.email, cpfCnpj: cpfCnpj.replace(/\D/g, '') },
        isRecurring,
        cycle: frequency === 'yearly' ? 'YEARLY' : 'MONTHLY',
        description: 'Apoio à Missão 3 Minutes for Life',
      }),
    });

    if (!illumineRes.ok) {
      const err = await illumineRes.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar o pagamento.');
    }

    const payload = await illumineRes.json();
    const checkoutUrl: string = payload.checkoutUrl;
    const providerRef: string = payload.asaasPaymentId || payload.asaasSubscriptionId;
    if (!checkoutUrl) throw new Error('Checkout URL não retornado pelo gateway.');

    // 2. Record contribution in Supabase (service-level write via edge function)
    const { data, error } = await supabase.functions.invoke('asaas-create-checkout', {
      body: { asaas_payment_id: providerRef, amount_cents: amountCents, frequency },
    });

    if (error || !data?.contributionId) {
      console.error('Failed to record contribution:', error || data);
    }

    return {
      checkoutUrl,
      contributionId: data?.contributionId || '',
      providerReference: providerRef,
    };
  },

  async createOneTimePixCheckout(amountCents: number, cpfCnpj: string): Promise<{ checkoutUrl: string; contributionId: string }> {
    return this.createCheckout(amountCents, cpfCnpj, 'one_time');
  }
};
