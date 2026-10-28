import { describe, it, expect } from 'vitest';
import { summarizeJourney } from './journey';

const at = (day: string) => ({ readAt: `${day}T15:00:00Z` });

describe('summarizeJourney', () => {
  it('conta dias seguidos terminando hoje', () => {
    const s = summarizeJourney([at('2026-10-26'), at('2026-10-27'), at('2026-10-28')], '2026-10-28');
    expect(s.currentStreak).toBe(3);
    expect(s.readToday).toBe(true);
  });

  it('mantém a sequência viva quando ainda não leu hoje', () => {
    const s = summarizeJourney([at('2026-10-26'), at('2026-10-27')], '2026-10-28');
    expect(s.currentStreak).toBe(2);
    expect(s.readToday).toBe(false);
  });

  it('zera a sequência após um dia pulado, preservando a maior', () => {
    const s = summarizeJourney([at('2026-10-20'), at('2026-10-21'), at('2026-10-22'), at('2026-10-27')], '2026-10-28');
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(3);
  });

  it('usa o fuso de São Paulo para o dia', () => {
    // 01:30 UTC de 28/10 ainda é 27/10 em São Paulo (UTC-3).
    const s = summarizeJourney([{ readAt: '2026-10-28T01:30:00Z' }], '2026-10-27');
    expect(s.readToday).toBe(true);
  });

  it('resume o mês corrente', () => {
    const s = summarizeJourney(
      [
        { readAt: '2026-09-30T15:00:00Z', completedAt: '2026-09-30T15:10:00Z' },
        { readAt: '2026-10-02T15:00:00Z', completedAt: '2026-10-02T15:10:00Z' },
        at('2026-10-03'),
      ],
      '2026-10-28',
    );
    expect(s.daysThisMonth).toBe(2);
    expect(s.completedThisMonth).toBe(1);
    expect(s.totalDays).toBe(3);
  });

  it('lida com lista vazia', () => {
    const s = summarizeJourney([], '2026-10-28');
    expect(s).toMatchObject({ currentStreak: 0, longestStreak: 0, totalDays: 0 });
  });
});
