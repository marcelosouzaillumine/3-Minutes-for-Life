import { describe, it, expect } from 'vitest';
import { toE164, formatPhone } from './phone';

describe('toE164', () => {
  it('assume Brasil quando não há +', () => {
    expect(toE164('(41) 99999-9999')).toBe('+5541999999999');
    expect(toE164('41 3333-4444')).toBe('+554133334444');
  });
  it('aceita número já com 55 e com +', () => {
    expect(toE164('+55 41 99999-9999')).toBe('+5541999999999');
    expect(toE164('5541999999999')).toBe('+5541999999999');
    expect(toE164('+351 912 345 678')).toBe('+351912345678');
  });
  it('recusa o que não parece número', () => {
    expect(toE164('')).toBeNull();
    expect(toE164('99999')).toBeNull();
    expect(toE164('abc')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formata brasileiro e deixa os demais', () => {
    expect(formatPhone('+5541999999999')).toBe('+55 (41) 99999-9999');
    expect(formatPhone('+351912345678')).toBe('+351912345678');
  });
});
