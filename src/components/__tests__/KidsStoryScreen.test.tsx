// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { KidsStoryScreen } from '../KidsStoryScreen';
import type { KidStory } from '../../services/FamilyService';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const tt = (_k: string, d: string | Record<string, unknown>) => (typeof d === 'string' ? d : '');
const img = (n: number) => `/ilustracoes/x/quadros/faixa-11-13-${n}.webp`;
const base: Extract<KidStory, { format: 'dilemma' }> = { format: 'dilemma', setup: 'Situação.', question: 'O que faria?', options: ['A', 'B'], outcome: 'Desfecho.', outcomeQuestion: 'Mudaria?', today: 'Hoje.', todayQuestion: 'Onde?' };

function srcOf(story: KidStory, index: number): string | null {
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => root.render(<KidsStoryScreen story={story} index={index} tt={tt} />));
  const src = host.querySelector('img')?.getAttribute('src') ?? null;
  act(() => root.unmount());
  return src;
}
const srcs = (story: KidStory) => [0, 1, 2, 3].map((i) => srcOf(story, i));

describe('dilema com imagens', () => {
  it('mostra uma imagem por momento, na ordem', () => {
    expect(srcs({ ...base, images: [1, 2, 3, 4].map(img) })).toEqual([1, 2, 3, 4].map(img));
  });

  it('sem "images", só a abertura usa a cena única', () => {
    expect(srcs({ ...base, image: img(2) })).toEqual([img(2), null, null, null]);
  });
});

function textOf(story: KidStory, index: number): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => root.render(<KidsStoryScreen story={story} index={index} tt={tt} />));
  const html = host.innerHTML;
  act(() => root.unmount());
  return html;
}

describe('dilema com referência bíblica', () => {
  it('mostra o selo só na abertura e a fonte da citação no desfecho', () => {
    const story = { ...base, reference: 'Lucas 10.38-42', quote: 'Maria escolheu a boa parte.', quoteSource: 'Lucas 10.42' };
    expect(textOf(story, 0)).toContain('Lucas 10.38-42');
    expect(textOf(story, 1)).not.toContain('Lucas 10.38-42');
    expect(textOf(story, 2)).toContain('Lucas 10.42');
  });

  it('sem os campos novos, nada extra aparece', () => {
    expect(textOf(base, 0)).not.toContain('kstory__ref');
    expect(textOf({ ...base, quote: 'x' }, 2)).not.toContain('kstory__cite');
  });
});
