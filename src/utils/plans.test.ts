import { describe, it, expect } from 'vitest';
import { buildPlan, PLANS } from './plans';

const lib = Array.from({ length: 40 }, (_, i) => ({
  id: `d${i}`,
  title: i % 3 === 0 ? `Descanso ${i}` : i % 3 === 1 ? `Confiança ${i}` : `Gratidão ${i}`,
  principle_statement: i % 2 ? 'Sua fé e esperança renovam as forças' : 'Oração com paciência',
}));

describe('buildPlan', () => {
  it('entrega exatamente os dias do plano, sem repetir devocional', () => {
    for (const p of PLANS) {
      const days = buildPlan(p, lib);
      expect(days).toHaveLength(p.days);
      expect(new Set(days.map((d) => d.devotional.id)).size).toBe(p.days);
      expect(days.map((d) => d.day)).toEqual(Array.from({ length: p.days }, (_, i) => i + 1));
    }
  });
  it('é estável para o mesmo acervo', () => {
    const a = buildPlan(PLANS[0], lib).map((d) => d.devotional.id);
    const b = buildPlan(PLANS[0], lib).map((d) => d.devotional.id);
    expect(a).toEqual(b);
  });
  it('devolve menos dias quando o acervo é pequeno', () => {
    expect(buildPlan(PLANS[1], lib.slice(0, 4)).length).toBeLessThanOrEqual(4);
    expect(buildPlan(PLANS[1], [])).toEqual([]);
  });
});
