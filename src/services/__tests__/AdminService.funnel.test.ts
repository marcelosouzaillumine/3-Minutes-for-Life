import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn() }));

import { illumineFetch } from '../../lib/illumine';
import { AdminService, dateRangeParams, periodRanges } from '../AdminService';

const mockFetch = vi.mocked(illumineFetch);

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

// Responde cada endpoint que getDashboardMetrics consulta; `funnel` é o que varia.
const respondWith = (funnel: unknown) =>
  mockFetch.mockImplementation(async (path: string) => {
    if (path.startsWith('/analytics/overview')) return json({ retention: { totalUsers: 50 }, funnel: { opened: 999 } });
    if (path.startsWith('/analytics/retention/day-n')) return json([]);
    if (path.startsWith('/analytics/devotionals/funnel')) return json(funnel);
    if (path.startsWith('/analytics/devotionals/performance')) return json({ topRead: [] });
    if (path.startsWith('/pastoral/metrics')) return json({ testimonials: { pending: 4 }, prayer_requests: { pending: 2 } });
    throw new Error(`endpoint inesperado: ${path}`);
  });

describe('AdminService — funil do dashboard', () => {
  // chaves de propósito: retornar o mock faria o Vitest chamá-lo como função de limpeza
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('não tem mais a etapa "Leu" e usa pessoas distintas do gateway novo', async () => {
    // opened/completed/shared são os totais antigos (linhas e eventos) e não podem vencer
    respondWith({ opened: 140, completed: 11, shared: 98, accessedUsers: 60, sharedUsers: 7 });

    const metrics = await AdminService.getDashboardMetrics('2026-09-01', '2026-09-21');

    expect(metrics!.funnel).toEqual({ accessed: 60, shared: 7 });
    expect(metrics!.funnel).not.toHaveProperty('read');
  });

  it('cai nos totais antigos enquanto o gateway não devolve as pessoas distintas', async () => {
    respondWith({ opened: 140, completed: 11, shared: 98 });

    const metrics = await AdminService.getDashboardMetrics('2026-09-01', '2026-09-21');

    expect(metrics!.funnel.accessed).toBe(140);
    expect(metrics!.funnel.shared).toBe(98);
  });

  it('envia o período com from/to (o gateway ignorava startDate/endDate)', async () => {
    respondWith({ accessedUsers: 1, sharedUsers: 0 });

    await AdminService.getDashboardMetrics('2026-09-15', '2026-09-21');

    const funnelCall = mockFetch.mock.calls.map(c => c[0] as string).find(p => p.startsWith('/analytics/devotionals/funnel'))!;
    const perfCall = mockFetch.mock.calls.map(c => c[0] as string).find(p => p.startsWith('/analytics/devotionals/performance'))!;
    for (const url of [funnelCall, perfCall]) {
      expect(url).toContain('from=');
      expect(url).toContain('to=');
      expect(url).not.toContain('startDate');
      expect(url).not.toContain('endDate');
    }
  });
});

describe('AdminService — cartões acompanham o período', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('usa o funil do período (não o /overview de janela fixa) e compara com o período anterior', async () => {
    mockFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/analytics/overview')) return json({ retention: { totalUsers: 50, dau: 999 }, funnel: { opened: 999 }, shares: { current: 999, previous: 999 } });
      if (path.startsWith('/analytics/retention/day-n')) return json([]);
      if (path.startsWith('/analytics/devotionals/funnel')) {
        // período atual = 15..21; anterior = 8..14 (distinguidos pelo `from`)
        const from = new Date(new URLSearchParams(path.split('?')[1]).get('from')!).getDate();
        return json(from === 15
          ? { opened: 30, shared: 5, accessedUsers: 12, sharedUsers: 3 }
          : { opened: 20, shared: 8, accessedUsers: 10, sharedUsers: 4 });
      }
      if (path.startsWith('/analytics/devotionals/performance')) return json({ topRead: [] });
      if (path.startsWith('/pastoral/metrics')) return json({ testimonials: { pending: 4 }, prayer_requests: { pending: 2 } });
      throw new Error(`endpoint inesperado: ${path}`);
    });

    const m = await AdminService.getDashboardMetrics('2026-09-15', '2026-09-21', { startDate: '2026-09-08', endDate: '2026-09-14' });

    expect(m!.intelligence).toEqual({
      active_users: { current: 12, previous: 10 },
      reads: { current: 30, previous: 20 },
      shares: { current: 5, previous: 8 },
    });
    expect(m!.total_users).toBe(50);
    expect(m!.community).toEqual({ pending_testimonials: 4, pending_prayers: 2 });
  });

  it('sem permissão no pastoral, a pendência é null (a tela mostra "—", não 0)', async () => {
    mockFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/pastoral/metrics')) return { ok: false, status: 403, json: async () => ({}) } as Response;
      if (path.startsWith('/analytics/overview')) return json({ retention: { totalUsers: 1 } });
      if (path.startsWith('/analytics/retention/day-n')) return json([]);
      if (path.startsWith('/analytics/devotionals/funnel')) return json({ accessedUsers: 1, sharedUsers: 0 });
      if (path.startsWith('/analytics/devotionals/performance')) return json({ topRead: [] });
      throw new Error(`endpoint inesperado: ${path}`);
    });

    const m = await AdminService.getDashboardMetrics('2026-09-21', '2026-09-21');

    expect(m!.community).toEqual({ pending_testimonials: null, pending_prayers: null });
    expect(m!.intelligence.reads.previous).toBe(0);
  });

  it('retenção mantém a taxa em % por dia N, sem recalcular', async () => {
    respondWith({ accessedUsers: 1, sharedUsers: 0 });
    mockFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/analytics/retention/day-n')) return json([{ day: 1, users: 200, retained: 80, rate: 40 }, { day: 7, users: 150, retained: 30, rate: 20 }]);
      if (path.startsWith('/analytics/overview')) return json({ retention: { totalUsers: 1 } });
      if (path.startsWith('/analytics/devotionals/funnel')) return json({});
      if (path.startsWith('/analytics/devotionals/performance')) return json({ topRead: [] });
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    const m = await AdminService.getDashboardMetrics('2026-09-21', '2026-09-21');

    expect(m!.retention).toEqual([
      { day: 1, users: 200, retained: 80, rate: 40 },
      { day: 7, users: 150, retained: 30, rate: 20 },
    ]);
  });
});

describe('periodRanges', () => {
  const now = new Date(2026, 10, 4, 15, 30); // 4/nov/2026, horário local

  it('"Hoje" é só o dia de hoje e o anterior é ontem', () => {
    expect(periodRanges('today', now)).toEqual({ start: '2026-11-04', end: '2026-11-04', prevStart: '2026-11-03', prevEnd: '2026-11-03' });
  });

  it('"7 dias" são 7 dias inclusive hoje, e o anterior são os 7 dias antes', () => {
    expect(periodRanges('7d', now)).toEqual({ start: '2026-10-29', end: '2026-11-04', prevStart: '2026-10-22', prevEnd: '2026-10-28' });
  });

  it('"30 dias" são 30 dias inclusive hoje, e o anterior são os 30 antes', () => {
    expect(periodRanges('30d', now)).toEqual({ start: '2026-10-06', end: '2026-11-04', prevStart: '2026-09-06', prevEnd: '2026-10-05' });
  });
});

describe('dateRangeParams', () => {
  it('cobre do início do primeiro dia ao fim do último, no horário local do admin', () => {
    const p = dateRangeParams('2026-09-15', '2026-09-21');
    const from = new Date(p.get('from')!);
    const to = new Date(p.get('to')!);

    expect([from.getFullYear(), from.getMonth() + 1, from.getDate(), from.getHours(), from.getMinutes()]).toEqual([2026, 9, 15, 0, 0]);
    expect([to.getFullYear(), to.getMonth() + 1, to.getDate(), to.getHours(), to.getMinutes(), to.getSeconds()]).toEqual([2026, 9, 21, 23, 59, 59]);
  });

  it('"Hoje" (mesmo dia nos dois lados) cobre o dia inteiro', () => {
    const p = dateRangeParams('2026-09-21', '2026-09-21');
    const spanMs = new Date(p.get('to')!).getTime() - new Date(p.get('from')!).getTime();

    // ~24h (23:59:59.999); pode variar 1h em dia de mudança de horário de verão
    expect(spanMs).toBeGreaterThan(22 * 3_600_000);
    expect(spanMs).toBeLessThan(25 * 3_600_000);
  });
});
