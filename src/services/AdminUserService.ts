import { illumineFetch } from '../lib/illumine';
import type { AdminUserItem, AppRole, PaginatedUsersResult } from '../types/AdminUser';

interface GetUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const AdminUserService = {
  async getUsers({ search, page = 1, pageSize = 20 }: GetUsersParams = {}): Promise<PaginatedUsersResult> {
    const safePage = Math.max(1, page);
    const params = new URLSearchParams({ page: String(safePage), perPage: String(pageSize) });
    if (search?.trim()) params.set('search', search.trim());
    const res = await illumineFetch(`/users?${params}`);
    if (!res.ok) throw new Error(`[AdminUserService] L1 /users falhou com status ${res.status}`);
    const body = await res.json();
    const users: any[] = body.users ?? body.data ?? [];
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
      total: body.total ?? users.length,
      page: body.page ?? safePage,
      pageSize: body.perPage ?? pageSize,
      totalPages: body.totalPages ?? Math.max(1, Math.ceil((body.total ?? users.length) / pageSize)),
    };
  },

  async getMyRoles(): Promise<AppRole[]> {
    const res = await illumineFetch('/users/me');
    if (!res.ok) return [];
    const user = await res.json();
    const role = user?.role ?? user?.app_role;
    return role ? [role as AppRole] : [];
  },

  async assignRole(_userId: string, _role: AppRole): Promise<void> {
    // TODO (L1): endpoint POST /users/{userId}/roles não implementado ainda no Illumine OS
    console.warn('[AdminUserService] assignRole: endpoint L1 não disponível');
    throw new Error('Atribuição de papel não disponível — aguardando endpoint L1 /users/{id}/roles.');
  },

  async revokeRole(_userId: string, _role: AppRole): Promise<void> {
    // TODO (L1): endpoint DELETE /users/{userId}/roles/{role} não implementado ainda no Illumine OS
    console.warn('[AdminUserService] revokeRole: endpoint L1 não disponível');
    throw new Error('Revogação de papel não disponível — aguardando endpoint L1 /users/{id}/roles/{role}.');
  },
};
