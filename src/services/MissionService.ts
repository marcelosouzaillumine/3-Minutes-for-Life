import { illumineFetch } from '../lib/illumine';

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
  subscriptionId: string;
  provider: 'asaas' | 'pay';
  amountCents: number;
  currency: string;
  status: string;
  cycle?: 'MONTHLY' | 'YEARLY' | 'month' | 'year';
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

const HOSTED_CHECKOUT_ERRORS: Record<string, string> = {
  CPF_CNPJ_INVALID: 'Informe um CPF ou CNPJ válido.',
  AMOUNT_TOO_LOW: 'O valor informado é menor que o mínimo.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
};

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

  /** Cria a sessão na página de pagamento do OS (PIX e cartão). O CPF/CNPJ é pedido lá, não aqui. */
  async createCheckout(
    amountCents: number,
    frequency: 'one_time' | 'monthly' | 'yearly' = 'one_time'
  ): Promise<{ checkoutUrl: string }> {
    const cycle = frequency === 'yearly' ? 'YEARLY' : frequency === 'monthly' ? 'MONTHLY' : 'ONE_TIME';
    const res = await illumineFetch('/3minutes/checkout', {
      method: 'POST',
      body: JSON.stringify({ amountCents, cycle }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(HOSTED_CHECKOUT_ERRORS[body?.error as string] ?? 'Não foi possível abrir o pagamento. Tente novamente.');
    if (!body.paymentUrl) throw new Error('Não foi possível abrir o pagamento. Tente novamente.');
    return { checkoutUrl: body.paymentUrl };
  },

  async getMySubscriptions(): Promise<RecurringSubscription[]> {
    const [asaasRes, payRes] = await Promise.all([
      illumineFetch('/asaas/subscriptions/mine'),
      illumineFetch('/3minutes/subscriptions/mine'),
    ]);

    const pay: RecurringSubscription[] = payRes.ok
      ? ((await payRes.json()).subscriptions ?? []).map((s: any): RecurringSubscription => ({
          subscriptionId: s.reference,
          provider: 'pay',
          amountCents: s.amountCents,
          currency: 'BRL',
          status: s.status,
          cycle: s.cycle,
          createdAt: s.createdAt,
        }))
      : [];

    const asaas: RecurringSubscription[] = asaasRes.ok
      ? ((await asaasRes.json()).subscriptions ?? []).map((s: any): RecurringSubscription => ({
          subscriptionId: s.asaasSubscriptionId,
          provider: 'asaas',
          amountCents: s.amount,
          currency: s.currency ?? 'BRL',
          status: s.status,
          cycle: s.cycle,
          createdAt: s.createdAt,
        }))
      : [];

    return [...pay, ...asaas];
  },

  async cancelSubscription(subscriptionId: string, provider: RecurringSubscription['provider'] = 'asaas'): Promise<void> {
    const path = provider === 'pay'
      ? `/3minutes/subscriptions/${encodeURIComponent(subscriptionId)}`
      : `/asaas/subscriptions/${encodeURIComponent(subscriptionId)}`;
    const res = await illumineFetch(path, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Erro ao cancelar a assinatura.');
    }
  },
};
