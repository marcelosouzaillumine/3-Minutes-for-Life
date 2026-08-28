import { supabase } from '../lib/supabase';
import { illumineFetch } from '../lib/illumine';
import { authService } from './authService';

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
    devotional_title?: string | null;
    opens: number;
  }>;
  community: {
    pending_testimonials: number;
    delayed_responses: number;
  };
};

export type DailySeriesPoint = {
  day: string;
  active_users: number;
  reads: number;
};

export class AdminService {
  /**
   * Checks if the user has an administrative role.
   * The matrix of access is verified inside the RPC and policies,
   * this is just for UX routing/protection.
   */
  static async checkAdminRole(): Promise<boolean> {
    const session = await authService.getSession().catch(() => null);
    const userId = session?.user?.id;

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .is('revoked_at', null)
          .maybeSingle();

        if (!error && data?.role) {
          return ['super_admin', 'admin', 'analyst'].includes(data.role);
        }
      } catch (e) {
        console.warn('Supabase checkAdminRole error:', e);
      }
    }

    try {
      const res = await illumineFetch('/users/me');

      if (!res.ok) return false;

      const user = await res.json();

      const role =
        user?.role ||
        user?.app_role ||
        user?.admin_role ||
        user?.user?.role ||
        user?.user?.app_role ||
        user?.user?.admin_role;

      return ['super_admin', 'admin', 'analyst'].includes(role);
    } catch {
      return false;
    }
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

  /**
   * Simple day-by-day count (not the full cross-device identity merge used
   * by getDashboardMetrics) — good enough for a trend line, computed by a
   * separate, easy-to-verify RPC so the complex metrics function didn't
   * need to be touched to add charts.
   */
  static async getDashboardDailySeries(startDate: string, endDate: string): Promise<DailySeriesPoint[]> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_daily_series', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Error fetching dashboard daily series:', error);
      return [];
    }

    return (data || []) as DailySeriesPoint[];
  }
}
