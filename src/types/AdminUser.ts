export type AppRole = 'super_admin' | 'admin' | 'editor' | 'moderator' | 'analyst';

export interface AdminUserItem {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AppRole[];
}

export interface PaginatedUsersResult {
  data: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
