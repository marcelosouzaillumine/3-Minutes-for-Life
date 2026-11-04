// Nomes historicamente usados no client; o backend permite papéis arbitrários
// por tenant (tabela `roles`), então isso é só um hint de estilo, não uma
// enumeração fechada — ver TenantRole.
export type AppRole = 'super_admin' | 'admin' | 'editor' | 'moderator' | 'analyst';

// Papel de um tenant, como o backend realmente modela (um por usuário, id
// dinâmico — não um enum fixo). Ver GET /roles e POST/DELETE /users/:id/roles.
export interface TenantRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface AdminUserItem {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: TenantRole | null;
  /** Só vem para quem gerencia consentimentos. */
  phone?: string | null;
  whatsapp?: { state: 'granted' | 'revoked' | 'none'; at: string | null };
}

export interface PaginatedUsersResult {
  data: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Contagens dos filtros de WhatsApp (todo o tenant). Só para quem gerencia consentimentos. */
  counts?: Record<WhatsappFilter, number>;
  canSeeWhatsapp?: boolean;
}

export type WhatsappFilter = 'all' | 'granted' | 'none' | 'revoked' | 'granted_no_phone';
