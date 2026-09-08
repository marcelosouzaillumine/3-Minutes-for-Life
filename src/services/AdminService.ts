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
  static async checkAdminRole(): Promise<boolean> {
    // Illumine-first
    try {
      const res = await illumineFetch('/users/me');
      if (res.ok) {
        const user = await res.json();
        const role = user?.role ?? user?.app_role ?? user?.admin_role;
        if (role) return ['super_admin', 'admin', 'analyst'].includes(role);
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    const session = await authService.getSession().catch(() => null);
    const userId = session?.user?.id;
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .is('revoked_at', null)
        .maybeSingle();
      if (!error && data?.role) return ['super_admin', 'admin', 'analyst'].includes(data.role);
    } catch {
      // noop
    }
    return false;
  }

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

  static async getDashboardDailySeries(startDate: string, endDate: string): Promise<DailySeriesPoint[]> {
    // Try gateway first
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await illumineFetch(`/analytics/activity?${params}`);
      if (res.ok) {
        const body = await res.json();
        const rows: any[] = Array.isArray(body) ? body : (body.data ?? []);
        if (rows.length > 0 && 'date' in rows[0]) {
          return rows.map((r: any) => ({
            day: r.date ?? r.day,
            active_users: r.activeUsers ?? r.active_users ?? 0,
            reads: r.reads ?? r.events ?? 0,
          }));
        }
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
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
