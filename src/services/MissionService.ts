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
  status: 'active' | 'completed' | 'draft' | 'paused' | 'cancelled';
  goal?: number;
  raised?: number;
  starts_at?: string;
  ends_at?: string;
}

export interface RecurringSubscription {
  asaasSubscriptionId: string;
  amountCents: number;
  currency: string;
  status: string;
  cycle?: 'MONTHLY' | 'YEARLY';
  createdAt: string;
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
    const res = await illumineFetch('/supporters/me');
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch supporter status');
    const d = await res.json();
    return { id: d.id, user_id: d.userId ?? _userId, status: d.status, created_at: d.firstDonationAt ?? new Date().toISOString() };
  },

  async getDailyImpact(): Promise<number> {
    const res = await illumineFetch('/users?perPage=1');
    if (!res.ok) return 0;
    const body = await res.json();
    return typeof body.total === 'number' ? body.total : 0;
  },

  async getContributions(): Promise<Contribution[]> {
    const res = await illumineFetch('/supporters/me');
    if (!res.ok) return [];
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
  },

  async getActiveCampaigns(): Promise<Campaign[]> {
    // Campanhas de doação vivem no módulo `crm` do Illumine OS (GET /crm/campaigns),
    // não em /campaigns. Requer o módulo `crm` ativado no tenant — se não estiver
    // ativado, o gateway responde 403 e tratamos como "nenhuma campanha".
    const res = await illumineFetch('/crm/campaigns?status=active');
    if (!res.ok) {
      if (res.status !== 403) {
        console.warn(`[MissionService] getActiveCampaigns: GET /crm/campaigns falhou com status ${res.status}`);
      }
      return [];
    }
    const body = await res.json();
    const campaigns: any[] = body.campaigns ?? body.data ?? [];
    return campaigns.map((c): Campaign => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      status: c.status,
      goal: c.goal ?? undefined,
      raised: c.raised ?? undefined,
      starts_at: c.startsAt ?? undefined,
      ends_at: c.endsAt ?? undefined,
    }));
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

    const illumineUser = illumineAuth.getUser();
    if (!illumineUser?.email) throw new Error('Autenticação necessária.');

    const customerName = illumineUser.name ?? illumineUser.email.split('@')[0];

    const res = await illumineFetch('/asaas/checkout', {
      method: 'POST',
      body: JSON.stringify({
        billingType,
        amountCents,
        customer: { name: customerName, email: illumineUser.email, cpfCnpj: cpfCnpj.replace(/\D/g, '') },
        isRecurring,
        cycle: frequency === 'yearly' ? 'YEARLY' : 'MONTHLY',
        description: 'Apoio à Missão 3 Minutes for Life',
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Erro ao criar o checkout.');
    }

    const payload = await res.json();
    if (!payload.checkoutUrl) throw new Error(payload?.error || 'Erro ao criar o checkout.');

    return {
      checkoutUrl: payload.checkoutUrl,
      contributionId: payload.donationId ?? payload.asaasPaymentId ?? payload.asaasSubscriptionId ?? '',
      providerReference: payload.asaasPaymentId || payload.asaasSubscriptionId,
    };
  },

  async createOneTimePixCheckout(amountCents: number, cpfCnpj: string): Promise<{ checkoutUrl: string; contributionId: string }> {
    return this.createCheckout(amountCents, cpfCnpj, 'one_time');
  },

  async getMySubscriptions(): Promise<RecurringSubscription[]> {
    const res = await illumineFetch('/asaas/subscriptions/mine');
    if (!res.ok) return [];
    const body = await res.json();
    const subscriptions: any[] = body.subscriptions ?? [];
    return subscriptions.map((s): RecurringSubscription => ({
      asaasSubscriptionId: s.asaasSubscriptionId,
      amountCents: s.amount,
      currency: s.currency ?? 'BRL',
      status: s.status,
      cycle: s.cycle,
      createdAt: s.createdAt,
    }));
  },

  async cancelSubscription(asaasSubscriptionId: string): Promise<void> {
    const res = await illumineFetch(`/asaas/subscriptions/${encodeURIComponent(asaasSubscriptionId)}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Erro ao cancelar a assinatura.');
    }
  },
};
