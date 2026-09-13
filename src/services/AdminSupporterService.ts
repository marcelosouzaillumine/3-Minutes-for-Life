import { illumineFetch } from '../lib/illumine';
import type {
  AdminSupporterItem,
  PaginatedSupportersResult,
  SupporterStatus,
} from '../types/AdminSupporter';

interface GetSupportersParams {
  search?: string;
  status?: SupporterStatus | '';
  page?: number;
  pageSize?: number;
}

function normalizeSupporter(r: any): AdminSupporterItem {
  return {
    supporter_id: r.supporterId ?? r.supporter_id,
    user_id: r.userId ?? r.user_id,
    email: r.email,
    full_name: r.fullName ?? r.full_name,
    status: r.status,
    total_contributed_cents: Number(r.totalContributedCents ?? r.total_contributed_cents) || 0,
    contribution_count: Number(r.contributionCount ?? r.contribution_count) || 0,
    last_contribution_at: r.lastContributionAt ?? r.last_contribution_at,
    last_contribution_amount_cents: r.lastContributionAmountCents ?? r.last_contribution_amount_cents,
    last_contribution_status: r.lastContributionStatus ?? r.last_contribution_status,
    last_contribution_frequency: r.lastContributionFrequency ?? r.last_contribution_frequency,
    last_contribution_provider: r.lastContributionProvider ?? r.last_contribution_provider,
    supporter_since: r.supporterSince ?? r.supporter_since,
  };
}

export const AdminSupporterService = {
  async getSupporters({ search, status, page = 1, pageSize = 20 }: GetSupportersParams = {}): Promise<PaginatedSupportersResult> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    const res = await illumineFetch(`/supporters?${params}`);
    if (!res.ok) throw new Error(`[AdminSupporterService] L1 /supporters falhou com status ${res.status}`);

    const result = await res.json();
    const data = (result.data ?? []).map(normalizeSupporter);
    const total = result.total ?? data.length;
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async setSupporterStatus(supporterId: string, status: SupporterStatus): Promise<void> {
    const res = await illumineFetch(`/supporters/${supporterId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`[AdminSupporterService] L1 /supporters/${supporterId}/status falhou com status ${res.status}`);
  },
};
