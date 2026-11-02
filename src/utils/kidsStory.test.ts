import { describe, it, expect } from 'vitest';
import type { KidStory } from '../services/FamilyService';
import { cleanStory, emptyStory, safeStoryImage, storyScreenCount, storyToText, validateStory } from './kidsStory';

const panels: KidStory = { format: 'panels', panels: [{ image: '/ilustracoes/x/1.svg', caption: 'Um.', speech: 'Oi!' }, { image: 'https://cdn.exemplo.com/2.png', caption: 'Dois.' }] };
const dilemma: Extract<KidStory, { format: 'dilemma' }> = {
  format: 'dilemma', setup: 'Worms.', question: 'O que faria?', options: ['A', 'B'], outcome: 'Recusou.', quote: 'Presa à Palavra.',
  outcomeQuestion: 'Mudaria?', today: 'Hoje.', todayQuestion: 'Onde procura?',
};

describe('história da faixa', () => {
  it('conta as telas: um quadro por tela, quatro momentos no dilema', () => {
    expect(storyScreenCount(panels)).toBe(2);
    expect(storyScreenCount(dilemma)).toBe(4);
  });

  it('só aceita arte em https ou em /ilustracoes/', () => {
    expect(safeStoryImage('/ilustracoes/a/b-1.svg')).toBe('/ilustracoes/a/b-1.svg');
    expect(safeStoryImage('https://cdn.exemplo.com/a b.png')).toBe('https://cdn.exemplo.com/a%20b.png');
    for (const bad of ['http://x.com/a.png', 'javascript:alert(1)', '//x.com/a.png', '/ilustracoes/../a.svg', '/outra/a.svg', '', null, undefined]) expect(safeStoryImage(bad)).toBeNull();
  });

  it('o texto corrido sai da história, igual ao da API', () => {
    expect(storyToText(panels)).toBe('Um.\n\n“Oi!”\n\nDois.');
    expect(storyToText(dilemma)).toBe('Worms.\n\nO que faria?\n\nRecusou.\n\n“Presa à Palavra.”\n\nHoje.');
  });

  it('valida com mensagem para quem edita', () => {
    expect(validateStory(null)).toBeNull();
    expect(validateStory(panels)).toBeNull();
    expect(validateStory(dilemma)).toBeNull();
    expect(validateStory(emptyStory('panels'))).toMatch(/Quadro 1: informe a arte/);
    expect(validateStory({ format: 'panels', panels: [panels.panels[0]] })).toMatch(/pelo menos 2/);
    expect(validateStory({ format: 'panels', panels: [{ ...panels.panels[0], caption: 'x'.repeat(241) }, panels.panels[1]] })).toMatch(/240/);
    expect(validateStory({ ...dilemma, options: ['A', ' '] })).toMatch(/2 opções/);
    expect(validateStory({ ...dilemma, options: ['A', 'B', 'C', 'D', 'E'] })).toMatch(/no máximo 4/);
    expect(validateStory({ ...dilemma, question: ' ' })).toMatch(/a pergunta/);
    expect(validateStory({ ...dilemma, image: 'http://x.com/a.png' })).toMatch(/cena/);
  });

  it('limpa espaços e opções vazias antes de enviar', () => {
    const c = cleanStory({ ...dilemma, setup: ' Worms. ', options: [' A ', '', 'B '], quote: '  ' });
    expect(c).toMatchObject({ setup: 'Worms.', options: ['A', 'B'] });
    expect('quote' in c).toBe(false);
    expect(cleanStory({ format: 'panels', panels: [{ image: ' /ilustracoes/x/1.svg ', caption: ' Um. ', speech: ' ' }, panels.panels[1]] })).toMatchObject({ panels: [{ image: '/ilustracoes/x/1.svg', caption: 'Um.' }, panels.panels[1]] });
  });
});
