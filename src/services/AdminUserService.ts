import { supabase } from '../lib/supabase';
import { illumineFetch } from '../lib/illumine';
import { authService } from './authService';
import type { AdminUserItem, AppRole, PaginatedUsersResult } from '../types/AdminUser';

interface GetUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const AdminUserService = {
  async getUsers({ search, page = 1, pageSize = 20 }: GetUsersParams = {}): Promise<PaginatedUsersResult> {
    const safePage = Math.max(1, page);

    try {
      const params = new URLSearchParams({ page: String(safePage), perPage: String(pageSize) });
      if (search?.trim()) params.set('search', search.trim());
      const res = await illumineFetch(`/users?${params}`);
      if (res.ok) {
        const body = await res.json();
        const users: any[] = body.users || [];
        return {
          data: users.map((u): AdminUserItem => ({
            id: u.id,
            email: u.email ?? null,
            full_name: u.name ?? null,
            avatar_url: u.avatar ?? null,
            created_at: u.createdAt,
            last_sign_in_at: null,
            roles: [],
          })),
          total: body.total,
          page: body.page,
          pageSize: body.perPage,
          totalPages: body.totalPages,
        };
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
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
        id: r.id, email: r.email, full_name: r.full_name, avatar_url: r.avatar_url,
        created_at: r.created_at, last_sign_in_at: r.last_sign_in_at, roles: r.roles || [],
      })),
      total, page: safePage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getMyRoles(): Promise<AppRole[]> {
    try {
      const res = await illumineFetch('/users/me');
      if (res.ok) {
        const user = await res.json();
        const role = user?.role ?? user?.app_role;
        if (role) return [role as AppRole];
        return [];
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    const session = await authService.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .is('revoked_at', null);
    if (error) return [];
    return (data || []).map(r => r.role as AppRole);
  },

  async assignRole(userId: string, role: AppRole): Promise<void> {
    const session = await authService.getSession();
    const granterId = session?.user?.id ?? null;
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId, role, granted_by: granterId,
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
