import { supabase } from '../lib/supabase';
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

export const AdminSupporterService = {
  async getSupporters({ search, status, page = 1, pageSize = 20 }: GetSupportersParams = {}): Promise<PaginatedSupportersResult> {
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

  /** Manual correction — only super_admin/admin pass RLS on this write. */
  async setSupporterStatus(supporterId: string, status: SupporterStatus): Promise<void> {
    const { error } = await supabase
      .from('supporters')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', supporterId);
    if (error) throw error;
  },
};
