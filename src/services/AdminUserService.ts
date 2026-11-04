import { illumineFetch } from '../lib/illumine';
import type { AdminUserItem, AppRole, TenantRole, PaginatedUsersResult, WhatsappFilter } from '../types/AdminUser';

interface GetUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
  whatsapp?: WhatsappFilter;
  roleId?: string;
}

function directoryParams(f: { search?: string; whatsapp?: WhatsappFilter; roleId?: string }): string {
  const params = new URLSearchParams();
  if (f.search?.trim()) params.set('search', f.search.trim());
  if (f.whatsapp && f.whatsapp !== 'all') params.set('whatsapp', f.whatsapp);
  if (f.roleId) params.set('roleId', f.roleId);
  return params.toString();
}

export const AdminUserService = {
  /** Diretório com busca, papel e situação do WhatsApp (GET /users/directory). */
  async getUsers({ search, page = 1, pageSize = 20, whatsapp = 'all', roleId }: GetUsersParams = {}): Promise<PaginatedUsersResult> {
    const safePage = Math.max(1, page);
    const res = await illumineFetch(`/users/directory?${directoryParams({ search, whatsapp, roleId })}&page=${safePage}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error(`[AdminUserService] /users/directory falhou com status ${res.status}`);
    const body = await res.json();
    const users: any[] = body.users ?? [];
    return {
      data: users.map((u): AdminUserItem => ({
        id: u.id,
        email: u.email ?? null,
        full_name: u.name ?? null,
        avatar_url: u.avatar ?? null,
        created_at: u.createdAt,
        last_sign_in_at: null,
        role: u.role ? { id: u.role.id, name: u.role.name } : null,
        phone: u.phone ?? null,
        whatsapp: u.whatsapp,
      })),
      total: body.total ?? users.length,
      page: body.page ?? safePage,
      pageSize: body.perPage ?? pageSize,
      totalPages: body.totalPages ?? 1,
      counts: body.counts,
      canSeeWhatsapp: !!body.canSeeWhatsapp,
    };
  },

  /** Baixa a lista filtrada em CSV (só para quem gerencia consentimentos). */
  async exportCsv(filters: { search?: string; whatsapp?: WhatsappFilter; roleId?: string }): Promise<void> {
    const res = await illumineFetch(`/users/directory?${directoryParams(filters)}&format=csv`);
    if (!res.ok) throw new Error(`[AdminUserService] exportação falhou com status ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
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
