import { describe, expect, it } from 'vitest';
import { guideVersion, htmlBlocks, paginate, parseGuide, plainBlocks, readerForDay, versionsForChildren } from './ritual';
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

  const guide = 'Leia em voz baixa e deixe um silêncio.\n\nPara conversar à mesa:\n- O que aperta o coração?\n- Quando você sentiu paz?\n\nAtividade em família:\nCaixinha de preocupações com papel e lápis.\n\nOração em família:\nPai, damos graças. Amém.';
  it('separa o guia do adulto em blocos', () => {
    expect(parseGuide(guide)).toEqual({
      lead: 'Leia em voz baixa e deixe um silêncio.',
      questions: ['O que aperta o coração?', 'Quando você sentiu paz?'],
      activity: 'Caixinha de preocupações com papel e lápis.',
      prayer: 'Pai, damos graças. Amém.',
    });
  });
  it('reconhece os blocos em outro idioma pela ordem dos títulos', () => {
    const fr = 'Lisez doucement.\n\nPour en parler à table :\n1. Qu’est-ce qui te pèse ?\n\nActivité en famille :\nUne boîte à soucis.\n\nPrière en famille :\nSeigneur, merci. Amen.';
    expect(parseGuide(fr)?.questions).toEqual(['Qu’est-ce qui te pèse ?']);
  });
  it('devolve null quando o guia não segue o formato', () => {
    expect(parseGuide('Só um texto solto, sem títulos.')).toBeNull();
    expect(parseGuide(null)).toBeNull();
  });
  it('conduz a mesa pela faixa mais nova presente', () => {
    const out = guideVersion([{ version: v('11-13') }, { version: v('7-10') }], []);
    expect(out?.band).toBe('7-10');
    expect(guideVersion([], [v('11-13'), v('4-6')])?.band).toBe('4-6');
  });

  it('divide o texto em telas curtas sem cortar parágrafo', () => {
    const blocks = ['a'.repeat(300), 'b'.repeat(300), 'c'.repeat(100), 'd'.repeat(900)];
    const pages = paginate(blocks, 520);
    expect(pages.map((p) => p.length)).toEqual([1, 2, 1]);
    expect(pages.flat()).toEqual(blocks);
    expect(paginate([])).toEqual([]);
  });
  it('separa texto simples e HTML em blocos', () => {
    expect(plainBlocks('um\n\ndois\ntrês\n\n')).toEqual(['um', 'dois\ntrês']);
    expect(htmlBlocks('um\n\ndois')).toEqual(['<p>um</p>', '<p>dois</p>']);
    expect(htmlBlocks('<p>um</p><ul><li>a</li></ul><p>dois</p>')).toEqual(['<p>um</p>', '<ul><li>a</li></ul>', '<p>dois</p>']);
    expect(htmlBlocks(null)).toEqual([]);
  });
});
