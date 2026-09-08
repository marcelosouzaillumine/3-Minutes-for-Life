import { supabase } from '../lib/supabase';
import { illumineFetch, illumineAuth } from '../lib/illumine';
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
    if (illumineAuth.isAuthenticated()) {
      try {
        const params = new URLSearchParams();
        if (search?.trim()) params.set('search', search.trim());
        if (status) params.set('status', status);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        const res = await illumineFetch(`/supporters?${params}`);
        if (res.ok) {
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
        }
      } catch (e) {
        console.warn('[Supporters] Illumine getSupporters failed, falling back:', e);
      }
    }

    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * pageSize;

    const { data, error } = await supabase.rpc('get_admin_supporters', {
      p_search: search?.trim() || null,
      p_status: status || null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) throw error;

    const rows = (data || []) as Array<AdminSupporterItem & { total_count: number }>;
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return {
      data: rows.map(r => ({
        supporter_id: r.supporter_id,
        user_id: r.user_id,
        email: r.email,
        full_name: r.full_name,
        status: r.status,
        total_contributed_cents: Number(r.total_contributed_cents) || 0,
        contribution_count: Number(r.contribution_count) || 0,
        last_contribution_at: r.last_contribution_at,
        last_contribution_amount_cents: r.last_contribution_amount_cents,
        last_contribution_status: r.last_contribution_status,
        last_contribution_frequency: r.last_contribution_frequency,
        last_contribution_provider: r.last_contribution_provider,
        supporter_since: r.supporter_since,
      })),
      total,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async setSupporterStatus(supporterId: string, status: SupporterStatus): Promise<void> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/supporters/${supporterId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        if (res.ok) return;
      } catch (e) {
        console.warn('[Supporters] Illumine setSupporterStatus failed, falling back:', e);
      }
    }

    const { error } = await supabase
      .from('supporters')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', supporterId);
    if (error) throw error;
  },
};
