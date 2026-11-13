import { describe, it, expect } from 'vitest';
import { BIBLE_BOOKS, TOTAL_BIBLE_VERSES, parseReference, buildCuration, resolveBook } from '../bible';

describe('bible', () => {
  it('cânon com 66 livros e 31.102 versículos', () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(TOTAL_BIBLE_VERSES).toBe(31102);
  });

  it('resolve nomes e abreviações', () => {
    expect(resolveBook('João')).toBe('jo');
    expect(resolveBook('Jó')).toBe('jo_b');
    expect(resolveBook('I Coríntios')).toBe('1co');
    expect(resolveBook('1º Co.')).toBe('1co');
    expect(resolveBook('Cântico dos Cânticos')).toBe('ct');
  });

  it('interpreta versículo simples e intervalo', () => {
    const r = parseReference('João 3:16-18');
    expect(r.passages[0].bookId).toBe('jo');
    expect(r.passages[0].verses).toEqual(['3:16', '3:17', '3:18']);
    expect(r.passages[0].label).toBe('João 3:16-18');
  });

  it('livros numerados, listas e várias passagens', () => {
    const r = parseReference('1 Coríntios 13:4-5,7; Fp 4:6');
    expect(r.passages.map((p) => p.bookId)).toEqual(['1co', 'fp']);
    expect(r.passages[0].verses).toEqual(['13:4', '13:5', '13:7']);
  });

  it('aceita ponto como separador (Lucas 19.1-10)', () => {
    const r = parseReference('Lucas 19.1-10');
    expect(r.unrecognized).toHaveLength(0);
    expect(r.passages[0].verses).toHaveLength(10);
    expect(r.passages[0].label).toBe('Lucas 19:1-10');
    expect(parseReference('Salmos 119.97').passages[0].verses).toEqual(['119:97']);
    expect(parseReference('Salmo 91.1-2').passages[0].bookId).toBe('sl');
  });

  it('capítulo inteiro e referências inválidas', () => {
    expect(parseReference('Salmo 23').passages[0].chapters).toEqual([23]);
    const bad = parseReference('Livro Inexistente 1:1');
    expect(bad.passages).toHaveLength(0);
    expect(bad.unrecognized).toHaveLength(1);
  });

  it('agrupa devocionais do mesmo versículo e calcula cobertura', () => {
    const mk = (id: string, ref: string, date: string) => ({ id, title: `T${id}`, publicationDate: date, category: 'Fé', scriptureReference: ref });
    const rep = buildCuration([mk('1', 'João 3:16', '2026-01-01'), mk('2', 'João 3:16', '2026-02-01'), mk('3', 'João 3:16-18', '2026-03-01'), mk('4', '???', '2026-04-01')]);
    const g = rep.groups.find((x) => x.label === 'João 3:16')!;
    expect(g.devotionals.map((d) => d.id)).toEqual(['1', '2']);
    expect(g.overlaps).toContain('João 3:16-18');
    const jo = rep.books.find((b) => b.book.id === 'jo')!;
    expect(jo.workedVerses).toBe(3);
    expect(jo.devotionalCount).toBe(3);
    expect(rep.unrecognized).toHaveLength(1);
  });
});
