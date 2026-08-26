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

  /**
   * Creates a real Asaas PIX charge tied to a `contribution` row, so the
   * webhook can later match and activate the supporter. Requires a signed-in
   * user — the edge function rejects anonymous calls.
   */
  async createOneTimePixCheckout(amountCents: number, cpfCnpj: string): Promise<{ checkoutUrl: string; contributionId: string }> {
    const { data, error } = await supabase.functions.invoke('asaas-create-checkout', {
      body: { amount_cents: amountCents, cpf_cnpj: cpfCnpj },
    });

    if (error) {
      const message = (data as any)?.error || error.message || 'Erro ao criar o checkout.';
      throw new Error(message);
    }

    if (!data?.checkoutUrl) {
      throw new Error(data?.error || 'Erro ao criar o checkout.');
    }

    return data;
  }
};
