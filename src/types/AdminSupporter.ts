export type SupporterStatus = 'active' | 'inactive';

export interface AdminSupporterItem {
  supporter_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  status: SupporterStatus;
  total_contributed_cents: number;
  contribution_count: number;
  last_contribution_at: string | null;
  last_contribution_amount_cents: number | null;
  last_contribution_status: string | null;
  last_contribution_frequency: string | null;
  last_contribution_provider: string | null;
  supporter_since: string;
}

export interface PaginatedSupportersResult {
  data: AdminSupporterItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
