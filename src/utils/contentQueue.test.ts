import { describe, it, expect } from 'vitest';
import { queueStatus } from './contentQueue';

const days = (from: string, n: number) =>
  Array.from({ length: n }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10));

describe('queueStatus', () => {
  it('ok quando há 14 dias seguidos', () => {
    const s = queueStatus(days('2026-10-29', 14), '2026-10-29');
    expect(s.covered_days).toBe(14);
    expect(s.level).toBe('ok');
    expect(s.missing).toEqual([]);
  });
  it('aponta o primeiro buraco e os dias que faltam', () => {
    const s = queueStatus([...days('2026-10-29', 5), ...days('2026-11-04', 3)], '2026-10-29');
    expect(s.covered_days).toBe(5);
    expect(s.first_gap).toBe('2026-11-03');
    expect(s.level).toBe('warning');
    expect(s.missing[0]).toBe('2026-11-03');
  });
  it('crítico quando hoje ou amanhã já falham', () => {
    expect(queueStatus(days('2026-10-30', 20), '2026-10-29').level).toBe('critical');
    expect(queueStatus([], '2026-10-29').covered_days).toBe(0);
  });
  it('ignora datas passadas e aceita timestamp', () => {
    const s = queueStatus(['2026-10-01', '2026-10-29T00:00:00.000Z'], '2026-10-29');
    expect(s.covered_days).toBe(1);
  });
});
