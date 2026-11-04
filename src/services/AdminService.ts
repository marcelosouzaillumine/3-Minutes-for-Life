import { illumineFetch } from '../lib/illumine';

export type DashboardMetrics = {
  total_users: number;
  /** Cartões do período: valor atual e o do período anterior de mesmo tamanho. */
  intelligence: {
    active_users: { current: number; previous: number };
    reads: { current: number; previous: number };
    shares: { current: number; previous: number };
  };
  funnel: {
    accessed: number;
    shared: number;
  };
  /** Retenção por dia N (1, 7, 14, 30) de todo o histórico — não depende do período. `rate` já vem em %. */
  retention: Array<{ day: number; users: number; retained: number; rate: number }>;
  top_content: Array<{
    content_id: string;
    devotional_title?: string | null;
    opens: number;
  }>;
  /** Backlog atual (null = sem permissão ou fonte indisponível; a tela mostra "—", nunca 0). */
  community: {
    pending_testimonials: number | null;
    pending_prayers: number | null;
  };
};

export type DailySeriesPoint = {
  day: string;
  active_users: number;
  reads: number;
};

export type SearchTerms = {
  total: number;
  without_results: number;
  terms: { term: string; count: number; without_results: number }[];
  topics: { topic: string; count: number }[];
};

export type KidsBand = {
  band: string;
  registeredChildren: number;
  families: number;
  activeChildren: number;
  reads: number;
  readingDays: number;
  returningChildren: number;
  avgReadsPerActiveChild: number;
  publishedVersions: number;
  coverage: number;
  topDevotionals: { devotionalId: string; title: string; reads: number }[];
};

export type KidsIndicators = {
  totals: { registeredChildren: number; activeChildren: number; reads: number; publishedDevotionals: number };
  bands: KidsBand[];
};

export type ReadingModes = {
  total: number;
  modes: { mode: string; reads: number }[];
  bands: { band: string; reads: number }[];
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

// O gateway só entende `from`/`to`/`days` (DateRangeSchema); `startDate`/`endDate`
// eram ignorados e o seletor de período do dashboard nunca chegava às consultas.
// Datas 'YYYY-MM-DD' locais viram o início do primeiro dia e o fim do último,
// no fuso do admin.
export function dateRangeParams(startDate: string, endDate: string): URLSearchParams {
  return new URLSearchParams({
    from: new Date(`${startDate}T00:00:00`).toISOString(),
    to: new Date(`${endDate}T23:59:59.999`).toISOString(),
  });
}

export type PeriodId = 'today' | '7d' | '30d';
const PERIOD_DAYS: Record<PeriodId, number> = { today: 1, '7d': 7, '30d': 30 };

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const periodDays = (period: PeriodId) => PERIOD_DAYS[period];

/**
 * Intervalo do período (dias inclusivos, horário local do admin: "7 dias" = hoje e os 6 anteriores)
 * e o período anterior de mesmo tamanho, usado nas tendências.
 */
export function periodRanges(period: PeriodId, now = new Date()) {
  const n = PERIOD_DAYS[period];
  const start = new Date(now);
  start.setDate(start.getDate() - (n - 1));
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (n - 1));
  return { start: localDate(start), end: localDate(now), prevStart: localDate(prevStart), prevEnd: localDate(prevEnd) };
}

export class AdminService {
  static async checkAdminRole(): Promise<boolean> {
    const res = await illumineFetch('/users/me');
    if (!res.ok) return false;
    const user = await res.json();
    const role = user?.role ?? user?.app_role ?? user?.admin_role;
    return role ? ['super_admin', 'admin', 'analyst'].includes(role) : false;
  }

  // Área de mídia: só administradores (o analista de leitura não gerencia arquivos).
  static async isFullAdmin(): Promise<boolean> {
    const res = await illumineFetch('/users/me');
    if (!res.ok) return false;
    const user = await res.json();
    const role = user?.role ?? user?.app_role ?? user?.admin_role;
    return role ? ['super_admin', 'admin'].includes(role) : false;
  }

  static async getDashboardMetrics(
    startDate: string,
    endDate: string,
    previous?: { startDate: string; endDate: string },
  ): Promise<DashboardMetrics | null> {
    const params = dateRangeParams(startDate, endDate);
    const [overviewRes, retentionRes, funnelRes, perfRes, prevFunnelRes, pastoralRes] = await Promise.all([
      illumineFetch('/analytics/overview'),
      illumineFetch('/analytics/retention/day-n'),
      illumineFetch(`/analytics/devotionals/funnel?${params}`),
      illumineFetch(`/analytics/devotionals/performance?${params}`),
      // Opcionais: sem eles a tendência some, mas os números do período aparecem.
      previous ? illumineFetch(`/analytics/devotionals/funnel?${dateRangeParams(previous.startDate, previous.endDate)}`).catch(() => null) : Promise.resolve(null),
      illumineFetch('/pastoral/metrics').catch(() => null),
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
    const prevFunnel = prevFunnelRes?.ok ? await prevFunnelRes.json() : null;
    const pastoral = pastoralRes?.ok ? await pastoralRes.json() : null;

    // Pessoas distintas no período (gateway novo); cai nos totais antigos
    // (linhas de leitura / eventos) enquanto o gateway não for atualizado.
    const accessedOf = (f: any) => f?.accessedUsers ?? f?.accessed ?? f?.opened ?? 0;

    // day-N retention vem como array: [{ day, users, retained, rate }, ...] (rate em %)
    const retention = (Array.isArray(ret) ? ret : []).map((r: any) => ({
      day: Number(r.day) || 0,
      users: Number(r.users) || 0,
      retained: Number(r.retained) || 0,
      rate: Number(r.rate) || 0,
    }));

    // performance: { topRead: [{ devotionalId, title, count }], ... }
    const topContent: any[] = perf.topRead ?? (Array.isArray(perf) ? perf : perf.data ?? []);

    return {
      total_users: ov.retention?.totalUsers ?? 0,
      // Tudo vem do funil do período: o /analytics/overview tem janelas fixas (24 h / 30 dias) e não aceita datas.
      intelligence: {
        active_users: { current: accessedOf(funnel), previous: accessedOf(prevFunnel) },
        reads: { current: funnel.opened ?? 0, previous: prevFunnel?.opened ?? 0 },
        shares: { current: funnel.shared ?? 0, previous: prevFunnel?.shared ?? 0 },
      },
      funnel: {
        accessed: accessedOf(funnel),
        shared: funnel.sharedUsers ?? funnel.shared ?? 0,
      },
      retention,
      top_content: topContent.slice(0, 10).map((c: any) => ({
        content_id: c.contentId ?? c.devotionalId ?? c.id,
        devotional_title: c.title ?? c.devotionalTitle ?? null,
        opens: c.opens ?? c.count ?? c.reads ?? 0,
      })),
      community: {
        pending_testimonials: pastoral?.testimonials?.pending ?? null,
        pending_prayers: pastoral?.prayer_requests?.pending ?? null,
      },
    };
  }

  static async getDashboardDailySeries(startDate: string, endDate: string): Promise<DailySeriesPoint[]> {
    const params = dateRangeParams(startDate, endDate);
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

  /** Datas de publicação dos devocionais publicados (base da fila de 14 dias). */
  static async getPublishedDates(): Promise<string[] | null> {
    const res = await illumineFetch('/devotionals?status=published&perPage=500');
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.devotionals ?? [])
      .map((d: any) => String(d.publicationDate ?? '').slice(0, 10))
      .filter(Boolean);
  }

  static async getSearchTerms(days: number): Promise<SearchTerms | null> {
    const res = await illumineFetch(`/analytics/search/terms?days=${days}`);
    if (!res.ok) {
      console.error('[Dashboard] L1 endpoint /analytics/search/terms com falha:', res.status);
      return null;
    }
    const body = await res.json();
    return {
      total: body.total ?? 0,
      without_results: body.withoutResults ?? 0,
      terms: (body.terms ?? []).map((t: any) => ({ term: t.term, count: t.count ?? 0, without_results: t.withoutResults ?? 0 })),
      topics: (body.topics ?? []).map((t: any) => ({ topic: t.topic, count: t.count ?? 0 })),
    };
  }

  /** Indicadores só das crianças, por faixa de idade, no período. */
  static async getKidsIndicators(startDate: string, endDate: string): Promise<KidsIndicators | null> {
    const res = await illumineFetch(`/analytics/devotionals/kids?${dateRangeParams(startDate, endDate)}`);
    if (!res.ok) {
      console.error('[Dashboard] endpoint /analytics/devotionals/kids com falha:', res.status);
      return null;
    }
    const body = await res.json();
    return { totals: body.totals, bands: body.bands ?? [] };
  }

  /** Leituras por modo (individual, grupo, crianças) e por faixa etária, no período. */
  static async getReadingModes(startDate: string, endDate: string): Promise<ReadingModes | null> {
    const res = await illumineFetch(`/analytics/devotionals/reading-modes?${dateRangeParams(startDate, endDate)}`);
    if (!res.ok) {
      console.error('[Dashboard] L1 endpoint /analytics/devotionals/reading-modes com falha:', res.status);
      return null;
    }
    const body = await res.json();
    return {
      total: body.total ?? 0,
      modes: (body.modes ?? []).map((m: any) => ({ mode: m.mode, reads: m.reads ?? 0 })),
      bands: (body.bands ?? []).map((b: any) => ({ band: b.band, reads: b.reads ?? 0 })),
    };
  }
}
