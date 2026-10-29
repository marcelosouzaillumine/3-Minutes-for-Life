import { describe, it, expect } from 'vitest';
import { searchMoments, type SearchableDevotional } from './momentSearch';

const lib: SearchableDevotional[] = [
  { id: 'a', title: 'Deus também encontra os cansados', principle_statement: 'O descanso é um presente.', reflection: 'Quando as forças acabam, ele sustenta.' },
  { id: 'b', title: 'O futuro nas mãos de Deus', principle_statement: 'A ansiedade perde força diante da confiança.', reflection: 'Não precisamos controlar o amanhã.' },
  { id: 'c', title: 'Perdoar também é caminho', principle_statement: 'A mágoa prende quem a carrega.', reflection: 'Perdoar liberta.' },
  { id: 'd', title: 'Gratidão em todo tempo', principle_statement: 'Agradecer muda o olhar.', reflection: 'Celebre o que já recebeu.' },
];

const top = (q: string) => searchMoments(q, lib).map((m) => m.devotional.id);

describe('searchMoments', () => {
  it('acha pela palavra, ignorando acento e maiúsculas', () => {
    expect(top('ANSIEDADE')[0]).toBe('b');
    expect(top('gratidao')[0]).toBe('d');
  });

  it('entende a frase livre por sinônimos, sem a palavra exata', () => {
    expect(top('estou sem forças')[0]).toBe('a');
    expect(top('com medo do que vem')[0]).toBe('b');
    expect(top('não consigo perdoar, tenho muita raiva')[0]).toBe('c');
  });

  it('entende en e es com os mesmos grupos', () => {
    expect(top('I feel so tired')[0]).toBe('a');
    expect(top('tengo miedo')[0]).toBe('b');
  });

  it('palavras vazias sozinhas ou sem correspondência não devolvem nada', () => {
    expect(top('estou muito')).toEqual([])
    expect(top('xyzabc')).toEqual([]);
    expect(top('   ')).toEqual([]);
  });

  it('respeita o limite e ordena do mais relevante ao menos', () => {
    const r = searchMoments('perdoar mágoa gratidão', lib, 2);
    expect(r).toHaveLength(2);
    expect(r[0].score).toBeGreaterThanOrEqual(r[1].score);
  });
});
