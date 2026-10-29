import { describe, expect, it } from 'vitest';
import { readerForDay, versionsForChildren } from './ritual';
import type { KidsVersion } from '../services/FamilyService';

const v = (band: KidsVersion['band']): KidsVersion => ({
  band, scriptureFocus: null, whatItSays: 'a', thinkAbout: 'b', practice: 'c', prayer: 'd', adultGuide: 'e', status: 'published',
});

describe('ritual', () => {
  it('reveza quem lê entre os adultos', () => {
    expect(readerForDay(['Ana', 'Bruno'], 10)).toBe('Ana');
    expect(readerForDay(['Ana', 'Bruno'], 11)).toBe('Bruno');
    expect(readerForDay([], 3)).toBeNull();
  });
  it('liga cada criança presente à versão da sua faixa', () => {
    const kids = [{ id: '1', band: '4-6' as const }, { id: '2', band: '11-13' as const }, { id: '3', band: '7-10' as const }];
    const out = versionsForChildren(kids, new Set(['1', '2']), [v('4-6')]);
    expect(out.map((o) => [o.child.id, o.version?.band ?? null])).toEqual([['1', '4-6'], ['2', null]]);
  });
});
