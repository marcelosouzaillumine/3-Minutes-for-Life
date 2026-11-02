// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { BandPicker } from '../BandPicker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(props: Partial<Parameters<typeof BandPicker>[0]> = {}) {
  const host = document.createElement('div');
  const root = createRoot(host);
  act(() => root.render(<BandPicker bands={['4-6', '7-10']} value="4-6" names={{ '4-6': ['Ju'] }} years="anos" ariaLabel="Qual versão?" onPick={() => {}} {...props} />));
  return { host, done: () => act(() => root.unmount()) };
}

describe('BandPicker', () => {
  it('sem cartões, continua sendo só o botão com a idade', () => {
    const { host, done } = render();
    expect(host.querySelectorAll('img')).toHaveLength(0);
    expect(host.textContent).toContain('4 a 6 anos');
    expect(host.querySelector('.bandpick--cards')).toBeNull();
    done();
  });

  it('com cartões, mostra a arte e a frase de cada faixa e marca a escolhida', () => {
    const { host, done } = render({ cards: { '4-6': { image: '/ilustracoes/x/quadros/faixa-4-6-1.webp', text: 'Levi foi com Jesus.' }, '7-10': { image: '/ilustracoes/x/quadros/faixa-7-10-1.webp', text: 'Levi fez um banquete.' } } });
    expect(host.querySelectorAll('img')).toHaveLength(2);
    expect(host.textContent).toContain('Levi fez um banquete.');
    expect(host.querySelector('[aria-checked="true"]')?.textContent).toContain('4 a 6 anos');
    expect(host.textContent).toContain('Ju');
    done();
  });

  it('sem nenhuma arte, não vira cartão', () => {
    const { host, done } = render({ cards: { '4-6': { image: null, text: 'x' } } });
    expect(host.querySelector('.bandpick--cards')).toBeNull();
    done();
  });
});
