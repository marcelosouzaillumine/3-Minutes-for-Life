import { supabase } from '../lib/supabase';

export type DashboardMetrics = {
  intelligence: {
    active_users: { current: number; previous: number };
    reads: { current: number; previous: number };
    shares: { current: number; previous: number };
    testimonials: { current: number; previous: number };
  };
  funnel: {
    accessed: number;
    read: number;
    shared: number;
    testified: number;
    responded: number;
    returned: number;
  };
  retention: {
    cohort_size: number;
    d1: number;
    d3: number;
    d7: number;
    d30: number;
  };
  top_content: Array<{
    content_id: string;
    opens: number;
  }>;
  community: {
    pending_testimonials: number;
    delayed_responses: number;
  };
};

export class AdminService {
  /**
   * Checks if the user has an administrative role.
   * The matrix of access is verified inside the RPC and policies,
   * this is just for UX routing/protection.
   */
  static async checkAdminRole(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // We can query user_roles directly since we are authenticated.
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) return false;

    return ['super_admin', 'admin', 'analyst'].includes(data.role);
  }

  /**
   * Fetches the dashboard metrics using the backend RPC contract.
   * Strict parameters are enforced: start_date and end_date.
   */
  static async getDashboardMetrics(startDate: string, endDate: string): Promise<DashboardMetrics | null> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_metrics', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Error fetching dashboard metrics:', error);
      return null;
    }

    return data as DashboardMetrics;
  }
}
