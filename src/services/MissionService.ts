import { supabase } from '../lib/supabase';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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
  async getSupporterStatus(_userId: string): Promise<Supporter | null> {
    // Illumine-first — usa o userId do token do gateway
    try {
      const res = await illumineFetch('/supporters/me');
      if (res.ok) {
        const d = await res.json();
        return { id: d.id, user_id: d.userId ?? _userId, status: d.status, created_at: d.firstDonationAt ?? new Date().toISOString() };
      }
      if (res.status === 404) return null;
    } catch {
      // fallthrough
    }

    // Supabase fallback
    if (!_userId) return null;
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .eq('user_id', _userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching supporter status:', error);
      return null;
    }
    return data;
  },

  async getDailyImpact(): Promise<number> {
    // Illumine-first: get total user count
    try {
      const res = await illumineFetch('/users?perPage=1');
      if (res.ok) {
        const body = await res.json();
        if (typeof body.total === 'number' && body.total > 0) return body.total;
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    try {
      const { data: count, error } = await supabase.rpc('get_total_profiles_count');
      if (error) {
        console.error('Erro ao buscar total de usuários:', error);
        return 1247;
      }
      return count || 0;
    } catch (err) {
      console.error('Error fetching real user count:', err);
      return 1247;
    }
  },

  async getContributions(): Promise<Contribution[]> {
    // Illumine-first — donations do perfil do usuário
    try {
      const res = await illumineFetch('/supporters/me');
      if (res.ok) {
        const d = await res.json();
        return (d.donations ?? []).map((don: any) => ({
          id: don.id,
          supporter_id: d.id,
          campaign_id: don.campaignId ?? null,
          amount: (don.amountCents ?? 0) / 100,
          currency: 'BRL',
          frequency: don.modality === 'recurring' ? 'recurring' : 'one_time',
          status: don.status,
          provider: don.metadata?.provider ?? 'asaas',
          provider_reference: don.metadata?.asaasId ?? don.id,
          started_at: don.createdAt,
          ended_at: don.metadata?.endedAt ?? null,
        })) as Contribution[];
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
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
    // Sem endpoint Illumine para campanhas de arrecadação ainda — Supabase
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
    const isRecurring = frequency === 'monthly' || frequency === 'yearly';
    const billingType =
      paymentMethod === 'pix' ? 'PIX'
      : paymentMethod === 'credit_card' ? 'CREDIT_CARD'
      : 'UNDEFINED';

    // Prefer Illumine user; fall back to Supabase auth
    const illumineUser = illumineAuth.getUser();
    let userEmail: string | null = illumineUser?.email ?? null;
    let customerName: string = illumineUser?.name ?? illumineUser?.email?.split('@')[0] ?? '';

    if (!userEmail) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Autenticação necessária.');
      userEmail = user.email;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      customerName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
    }

    if (illumineAuth.isAuthenticated()) {
      try {
        const illumineRes = await illumineFetch('/asaas/checkout', {
          method: 'POST',
          body: JSON.stringify({
            billingType,
            amountCents,
            customer: { name: customerName, email: userEmail, cpfCnpj: cpfCnpj.replace(/\D/g, '') },
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
            return { checkoutUrl, contributionId: payload.donationId ?? providerRef ?? '', providerReference: providerRef };
          }
        }
      } catch (e) {
        console.warn('[Mission] Illumine checkout failed, falling back to legacy:', e);
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
  },
};
