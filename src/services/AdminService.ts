import { illumineFetch } from '../lib/illumine';

export type DashboardMetrics = {
  total_users: number;
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

export type ReadingTrends = {
  global_total_reads: number;
  global_total_opens: number;
  avg_opens_per_day: number;
  days_since_first_open: number;
  total_devotionals: number;
  avg_reads_per_devotional: number;
  monthly: Array<{ month: string; reads: number }>;
  yearly: Array<{ year: number; reads: number; growth_rate: number | null }>;
  monthly_opens: Array<{ month: string; opens: number }>;
  yearly_opens: Array<{ year: number; opens: number; growth_rate: number | null }>;
};

export type DevotionalRankingItem = {
  devotional_id: string;
  unique_reads: number;
  total_opens: number;
  total_shares: number;
  // null = fora do ranking (rascunho/agendado)
  rank_by_reads: number | null;
  rank_by_opens: number | null;
  rank_by_shares: number | null;
};

export type DevotionalRanking = {
  total_ranked: number;
  items: DevotionalRankingItem[];
};

export class AdminService {
  static async checkAdminRole(): Promise<boolean> {
    const res = await illumineFetch('/users/me');
    if (!res.ok) return false;
    const user = await res.json();
    const role = user?.role ?? user?.app_role ?? user?.admin_role;
    return role ? ['super_admin', 'admin', 'analyst'].includes(role) : false;
  }

  static async getDashboardMetrics(startDate: string, endDate: string): Promise<DashboardMetrics | null> {
    const params = new URLSearchParams({ startDate, endDate });
    const [overviewRes, retentionRes, funnelRes, perfRes] = await Promise.all([
      illumineFetch('/analytics/overview'),
      illumineFetch('/analytics/retention/day-n'),
      illumineFetch(`/analytics/devotionals/funnel?${params}`),
      illumineFetch(`/analytics/devotionals/performance?${params}`),
    ]);

    if (!overviewRes.ok || !retentionRes.ok || !funnelRes.ok || !perfRes.ok) {
      const failed = [
        !overviewRes.ok && '/analytics/overview',
        !retentionRes.ok && '/analytics/retention/day-n',
        !funnelRes.ok && `/analytics/devotionals/funnel`,
        !perfRes.ok && `/analytics/devotionals/performance`,
      ].filter(Boolean);
      console.error('[Dashboard] L1 endpoints com falha:', failed);
      return null;
    }

    const [ov, ret, funnel, perf] = await Promise.all([
      overviewRes.json(),
      retentionRes.json(),
      funnelRes.json(),
      perfRes.json(),
    ]);

    // day-N retention is returned as an array: [{ day, users, retained, rate }, ...]
    const retArr: any[] = Array.isArray(ret) ? ret : [];
    const findDay = (n: number) => retArr.find((r: any) => r.day === n);

    // overview: { retention: { dau, wau, mau, totalUsers }, funnel: { opened, completed }, streaks }
    const ovRetention = ov.retention ?? {};
    const ovFunnel = ov.funnel ?? {};

    // performance: { topRead: [{ devotionalId, title, count }], ... }
    const topContent: any[] = perf.topRead ?? (Array.isArray(perf) ? perf : perf.data ?? []);

    return {
      total_users: ovRetention.totalUsers ?? 0,
      intelligence: {
        active_users: { current: ov.activeUsers?.current ?? ovRetention.dau ?? ov.dau ?? 0, previous: ov.activeUsers?.previous ?? 0 },
        reads: { current: ov.reads?.current ?? ovFunnel.opened ?? ov.totalReads ?? 0, previous: ov.reads?.previous ?? 0 },
        shares: { current: ov.shares?.current ?? 0, previous: ov.shares?.previous ?? 0 },
        testimonials: { current: ov.testimonials?.current ?? 0, previous: ov.testimonials?.previous ?? 0 },
      },
      funnel: {
        accessed: funnel.accessed ?? funnel.opened ?? 0,
        read: funnel.read ?? funnel.completed ?? 0,
        shared: funnel.shared ?? 0,
        testified: funnel.testified ?? 0,
        responded: funnel.responded ?? 0,
        returned: funnel.returned ?? 0,
      },
      retention: {
        cohort_size: ret.cohortSize ?? ret.d1_count ?? findDay(1)?.users ?? 0,
        d1: ret.d1 ?? findDay(1)?.rate ?? 0,
        d3: ret.d3 ?? 0,
        d7: ret.d7 ?? findDay(7)?.rate ?? 0,
        d30: ret.d30 ?? findDay(30)?.rate ?? 0,
      },
      top_content: topContent.slice(0, 10).map((c: any) => ({
        content_id: c.contentId ?? c.devotionalId ?? c.id,
        devotional_title: c.title ?? c.devotionalTitle ?? null,
        opens: c.opens ?? c.count ?? c.reads ?? 0,
      })),
      community: {
        pending_testimonials: ov.pendingTestimonials ?? 0,
        delayed_responses: ov.delayedResponses ?? 0,
      },
    };
  }

  static async getDashboardDailySeries(startDate: string, endDate: string): Promise<DailySeriesPoint[]> {
    const params = new URLSearchParams({ startDate, endDate });
    const res = await illumineFetch(`/analytics/activity?${params}`);
    if (!res.ok) {
      console.error('[Dashboard] L1 endpoint /analytics/activity com falha:', res.status);
      return [];
    }
    const body = await res.json();
    const rows: any[] = Array.isArray(body) ? body : (body.data ?? []);
    return rows.map((r: any) => ({
      day: r.date ?? r.day,
      active_users: r.activeUsers ?? r.active_users ?? 0,
      reads: r.reads ?? r.events ?? 0,
    }));
  }

  static async getDevotionalRanking(): Promise<DevotionalRanking | null> {
    const res = await illumineFetch('/analytics/devotionals/ranking');
    if (!res.ok) {
      console.error('[Conteúdo] L1 endpoint /analytics/devotionals/ranking com falha:', res.status);
      return null;
    }
    const body = await res.json();
    return {
      total_ranked: body.totalRanked ?? 0,
      items: (body.items ?? []).map((i: any) => ({
        devotional_id: i.devotionalId,
        unique_reads: i.uniqueReads ?? 0,
        total_opens: i.totalOpens ?? 0,
        total_shares: i.totalShares ?? 0,
        rank_by_reads: i.rankByReads ?? null,
        rank_by_opens: i.rankByOpens ?? null,
        rank_by_shares: i.rankByShares ?? null,
      })),
    };
  }

  static async getReadingTrends(): Promise<ReadingTrends | null> {
    const res = await illumineFetch('/analytics/devotionals/reading-trends');
    if (!res.ok) {
      console.error('[Dashboard] L1 endpoint /analytics/devotionals/reading-trends com falha:', res.status);
      return null;
    }
    const body = await res.json();
    return {
      global_total_reads: body.globalTotalReads ?? 0,
      global_total_opens: body.globalTotalOpens ?? 0,
      avg_opens_per_day: body.avgOpensPerDay ?? 0,
      days_since_first_open: body.daysSinceFirstOpen ?? 0,
      total_devotionals: body.totalDevotionals ?? 0,
      avg_reads_per_devotional: body.avgReadsPerDevotional ?? 0,
      monthly: (body.monthly ?? []).map((m: any) => ({ month: m.month, reads: m.reads ?? 0 })),
      yearly: (body.yearly ?? []).map((y: any) => ({ year: y.year, reads: y.reads ?? 0, growth_rate: y.growthRate ?? null })),
      monthly_opens: (body.monthlyOpens ?? []).map((m: any) => ({ month: m.month, opens: m.opens ?? 0 })),
      yearly_opens: (body.yearlyOpens ?? []).map((y: any) => ({ year: y.year, opens: y.opens ?? 0, growth_rate: y.growthRate ?? null })),
    };
  }
}
