import { illumineFetch } from '../lib/illumine';
import type { AdminUserItem, AppRole, TenantRole, PaginatedUsersResult } from '../types/AdminUser';

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
        // GET /users inclui { role: { id, name } | null } por usuário (papel único por tenant).
        role: u.role ? { id: u.role.id, name: u.role.name } : null,
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

  // Papéis existentes no tenant atual (dinâmico — não é uma lista fixa).
  async getRoles(): Promise<TenantRole[]> {
    const res = await illumineFetch('/roles');
    if (!res.ok) throw new Error(`[AdminUserService] GET /roles falhou com status ${res.status}`);
    const body = await res.json();
    return (body.roles ?? []) as TenantRole[];
  },

  // Um usuário tem no máximo um papel por tenant — atribuir substitui o atual.
  async assignRole(userId: string, roleId: string): Promise<void> {
    const res = await illumineFetch(`/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error === 'FORBIDDEN'
        ? 'Você não tem permissão para atribuir papéis.'
        : `Falha ao atribuir papel (status ${res.status}).`);
    }
  },

  async revokeRole(userId: string): Promise<void> {
    const res = await illumineFetch(`/users/${userId}/roles`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error === 'FORBIDDEN'
        ? 'Você não tem permissão para remover papéis.'
        : `Falha ao remover papel (status ${res.status}).`);
    }
  },
};
