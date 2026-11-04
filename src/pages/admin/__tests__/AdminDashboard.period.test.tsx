// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

vi.mock('recharts', () => {
  const Box = ({ children }: any) => <div>{children}</div>;
  return { ResponsiveContainer: Box, AreaChart: Box, Area: Box, BarChart: Box, Bar: Box, XAxis: Box, YAxis: Box, CartesianGrid: Box, Tooltip: Box };
});

// Dados por período, devolvidos pelo serviço (o que o gateway faria para cada intervalo).
const byPeriod: Record<string, { reads: number; shares: number; users: number }> = {
  today: { reads: 3, shares: 1, users: 2 },
  '7d': { reads: 40, shares: 9, users: 17 },
  '30d': { reads: 200, shares: 31, users: 60 },
};

vi.mock('../../../services/AdminService', async (orig) => {
  const real = await orig<typeof import('../../../services/AdminService')>();
  return {
    ...real,
    AdminService: {
      getDashboardMetrics: vi.fn(async (start: string, end: string) => {
        const days = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86_400_000) + 1;
        const d = byPeriod[days === 1 ? 'today' : days === 7 ? '7d' : '30d'];
        return {
          total_users: 100,
          intelligence: { active_users: { current: d.users, previous: 1 }, reads: { current: d.reads, previous: 1 }, shares: { current: d.shares, previous: 1 } },
          funnel: { accessed: d.users, shared: d.shares },
          retention: [{ day: 1, users: 50, retained: 20, rate: 40 }],
          top_content: [],
          community: { pending_testimonials: null, pending_prayers: 2 },
        };
      }),
      getDashboardDailySeries: vi.fn(async () => []),
      getSearchTerms: vi.fn(async () => null),
      getReadingModes: vi.fn(async () => null),
      getKidsIndicators: vi.fn(async () => null),
      getPublishedDates: vi.fn(async () => null),
      getReadingTrends: vi.fn(async () => null),
    },
  };
});
vi.mock('../../../components/admin/KidsIndicatorsPanel', () => ({ KidsIndicatorsPanel: () => null }));

import { AdminDashboard } from '../AdminDashboard';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const flush = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });
const card = (title: string) =>
  [...container.querySelectorAll('.admin-card')].find(c => c.querySelector('.admin-card-title')?.textContent === title)?.querySelector('.admin-card-value')?.textContent ?? '';

describe('AdminDashboard — seletor de período', () => {
  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<AdminDashboard />); });
    await flush();
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const choose = async (label: string) => {
    const btn = [...container.querySelectorAll('.dash-seg button')].find(b => b.textContent === label) as HTMLButtonElement;
    await act(async () => { btn.click(); });
    await flush();
  };

  it('"Hoje" troca os cartões, em vez de manter os números dos 7 dias', async () => {
    expect(card('Leituras')).toContain('40');
    expect(card('Compartilhamentos')).toContain('9');

    await choose('Hoje');

    expect(card('Leituras')).toContain('3');
    expect(card('Leituras')).not.toContain('40');
    expect(card('Compartilhamentos')).toContain('1');
    expect(card('Usuários Ativos')).toContain('2');

    await choose('30 dias');
    expect(card('Leituras')).toContain('200');
  });

  it('não mostra o cartão de testemunhos (sem fonte por período) e mostra "—" quando a pendência é desconhecida', async () => {
    expect(card('Testemunhos Recebidos')).toBe('');
    expect(container.textContent).toContain('Testemunhos Pendentes');
    expect(container.textContent).toMatch(/Testemunhos Pendentes[\s\S]*—/);
    expect(container.textContent).toContain('Pedidos de Oração Pendentes');
  });

  it('retenção mostra a taxa devolvida pelo gateway (40%), não uma nova conta', async () => {
    expect(container.textContent).toContain('Retenção');
    expect(container.textContent).toContain('40%'); // chip "voltam no dia seguinte"
  });
});
