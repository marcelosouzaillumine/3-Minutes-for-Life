import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn() }));

import { illumineFetch } from '../../lib/illumine';
import { AdminService, dateRangeParams } from '../AdminService';

const mockFetch = vi.mocked(illumineFetch);

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

// Responde cada endpoint que getDashboardMetrics consulta; `funnel` é o que varia.
const respondWith = (funnel: unknown) =>
  mockFetch.mockImplementation(async (path: string) => {
    if (path.startsWith('/analytics/overview')) return json({ retention: { totalUsers: 50 }, funnel: { opened: 999 } });
    if (path.startsWith('/analytics/retention/day-n')) return json([]);
    if (path.startsWith('/analytics/devotionals/funnel')) return json(funnel);
    if (path.startsWith('/analytics/devotionals/performance')) return json({ topRead: [] });
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

    expect(metrics!.funnel).toEqual({
      accessed: 60,
      shared: 7,
      testified: 0,
      responded: 0,
      returned: 0,
    });
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
