import { supabase } from '../lib/supabase';
import type { AdminUserItem, AppRole, PaginatedUsersResult } from '../types/AdminUser';

interface GetUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const AdminUserService = {
  async getUsers({ search, page = 1, pageSize = 20 }: GetUsersParams = {}): Promise<PaginatedUsersResult> {
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * pageSize;

    const { data, error } = await supabase.rpc('get_admin_users', {
      p_search: search?.trim() || null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) throw error;

    const rows = (data || []) as Array<AdminUserItem & { total_count: number }>;
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return {
      data: rows.map(r => ({
        id: r.id,
        email: r.email,
        full_name: r.full_name,
        avatar_url: r.avatar_url,
        created_at: r.created_at,
        last_sign_in_at: r.last_sign_in_at,
        roles: r.roles || [],
      })),
      total,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  /** Roles currently held by the signed-in admin (self-read, always allowed by RLS). */
  async getMyRoles(): Promise<AppRole[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .is('revoked_at', null);

    if (error) return [];
    return (data || []).map(r => r.role as AppRole);
  },

  /** Only super_admins pass RLS on this write — enforced server-side regardless of the UI. */
  async assignRole(userId: string, role: AppRole): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role,
      granted_by: session?.user.id ?? null,
    });
    if (error) throw error;
  },

  async revokeRole(userId: string, role: AppRole): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('role', role)
      .is('revoked_at', null);
    if (error) throw error;
  },
};
