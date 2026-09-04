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

    // Always use the Edge Function path for checkout.
    // The Illumine gateway path is available for users who log in fresh
    // (Illumine token is set via dual-auth). The Edge Function handles both:
    //   - asaas_payment_id provided → record-only (Illumine already created the payment)
    //   - cpf_cnpj provided → create payment via Asaas directly (legacy fallback)
    const illumineToken = (await import('../lib/illumine')).illumineAuth.getAccessToken();

    if (illumineToken) {
      try {
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
        if (illumineRes.ok) {
          const payload = await illumineRes.json();
          const checkoutUrl: string = payload.checkoutUrl;
          const providerRef: string = payload.asaasPaymentId || payload.asaasSubscriptionId;
          if (checkoutUrl) {
            const { data } = await supabase.functions.invoke('asaas-create-checkout', {
              body: { asaas_payment_id: providerRef, amount_cents: amountCents, frequency },
            });
            return { checkoutUrl, contributionId: data?.contributionId || '', providerReference: providerRef };
          }
        }
      } catch (e) {
        console.warn('[Mission] Illumine checkout failed, falling back to legacy:', e)
      }
    }

    // Legacy path: Edge Function calls Asaas directly
    const { data, error } = await supabase.functions.invoke('asaas-create-checkout', {
      body: { amount_cents: amountCents, cpf_cnpj: cpfCnpj, frequency, payment_method: paymentMethod },
    });

    if (error) {
      let message = error.message || 'Erro ao criar o checkout.';
      try { const b = await (error as any).context?.json(); if (b?.error) message = b.error; } catch { /* noop */ }
      throw new Error(message);
    }
    if (!data?.checkoutUrl) throw new Error(data?.error || 'Erro ao criar o checkout.');
    return data;
  },

  async createOneTimePixCheckout(amountCents: number, cpfCnpj: string): Promise<{ checkoutUrl: string; contributionId: string }> {
    return this.createCheckout(amountCents, cpfCnpj, 'one_time');
  }
};
