// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const family = {
  id: 'f1', name: 'Família Souza', meetingTime: null, role: 'owner', inviteCode: 'ABC',
  members: [{ displayName: 'Marcelo', role: 'owner', isMe: true, readToday: false }],
  children: [{ id: 'c1', nickname: 'Bento', band: '4-6' }],
  week: { days: [], streak: 4 }, plan: null,
};
const guide = 'Leia em voz baixa.\n\nPara conversar à mesa:\n- O que aperta o coração?\n- Quando você sentiu paz?\n\nAtividade em família:\nCaixinha de preocupações.\n\nOração em família:\nPai, obrigado. Amém.';

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), addChild: vi.fn(), getKids: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string; [k: string]: unknown }) =>
      (o?.defaultValue ?? _k).replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n] ?? '')),
    i18n: { language: 'pt-BR' },
  }),
}));
vi.mock('../../services/FamilyService', () => ({
  FamilyService: mocks,
  BANDS: ['4-6', '7-10', '11-13'],
}));
vi.mock('../../services/DevotionalService', () => ({
  DevotionalService: { getDailyDevotional: vi.fn().mockResolvedValue({ id: 'd1', title: 'A paz que guarda', reflection: '<p>x</p>', scripture_reference: 'Fp 4:6' }), getDevotional: vi.fn() },
}));
vi.mock('../../services/JourneyService', () => ({ JourneyService: { complete: vi.fn() } }));

import { FamilyRitual } from '../FamilyRitual';
import { DevotionalService } from '../../services/DevotionalService';

let root: Root;
let host: HTMLDivElement;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const click = (label: string) => act(async () => {
  const names = label === 'Continuar' ? ['Continuar', 'Começar'] : [label];
  const b = [...host.querySelectorAll('button')].find((x) => names.some((n) => x.textContent?.includes(n) || x.getAttribute('aria-label')?.includes(n)));
  if (!b) throw new Error(`botão não encontrado: ${label}`);
  b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.getKids.mockResolvedValue([{ band: '4-6', title: null, scriptureFocus: null, whatItSays: 'Deus cuida.', thinkAbout: 'Pensar.', practice: 'Fazer.', prayer: 'Orar.', adultGuide: guide, status: 'published' }]);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.clearAllMocks(); });

describe('FamilyRitual', () => {
  it('quem não tem leitura configurada escolhe só adultos e segue direto, sem pedir nome de família', async () => {
    mocks.get.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush();
    expect(host.textContent).toContain('Com quem você vai ler?');
    expect(host.textContent).not.toContain('Como se chama a sua família?');
    await click('Só adultos');
    await flush(); await flush();
    expect(mocks.create).toHaveBeenCalledWith('Nossa leitura');
    expect(host.textContent).toContain('A paz que guarda');
  });

  it('com crianças, cadastra as crianças antes de começar a leitura', async () => {
    mocks.get.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ ...family, children: [] });
    mocks.addChild.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush();
    await click('Com crianças');
    await flush();
    expect(host.textContent).toContain('Quais crianças leem com você?');
    const input = host.querySelector('input') as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Bento');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();
    expect(mocks.addChild).toHaveBeenCalledWith('Bento', '7-10');
    await click('Começar a leitura');
    await flush(); await flush();
    expect(host.textContent).toContain('A paz que guarda');
  });

  it('troca de tela deslizando o dedo, mas não na primeira tela', async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    const dialog = host.querySelector('[role="dialog"]') as HTMLElement;
    const swipe = (from: number, to: number) => act(async () => {
      const ev = (type: string, x: number) => Object.assign(new Event(type, { bubbles: true }), { touches: [{ clientX: x, clientY: 300 }], changedTouches: [{ clientX: x, clientY: 300 }] });
      dialog.dispatchEvent(ev('touchstart', from));
      dialog.dispatchEvent(ev('touchend', to));
    });
    await swipe(300, 100);
    expect(host.textContent).not.toContain('1 · Ler');
    await click('Continuar');
    expect(host.textContent).toContain('1 · Ler');
    await swipe(300, 100);
    expect(host.textContent).toContain('Pergunta 1 de 2');
    await swipe(100, 300);
    expect(host.textContent).toContain('1 · Ler');
    await swipe(200, 170);
    expect(host.textContent).toContain('1 · Ler');
  });

  it('mostra uma pergunta por tela, a atividade e a oração em família do guia', async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('A paz que guarda');

    await click('Continuar'); // ler
    expect(host.textContent).toContain('1 · Ler');
    await click('Continuar'); // pergunta 1
    expect(host.textContent).toContain('Pergunta 1 de 2');
    expect(host.textContent).toContain('O que aperta o coração?');
    expect(host.textContent).not.toContain('Leia em voz baixa.'); // guia do adulto começa recolhido
    await click('Ver como conduzir');
    expect(host.textContent).toContain('Leia em voz baixa.');
    await click('Continuar'); // pergunta 2
    expect(host.textContent).toContain('Pergunta 2 de 2');
    await click('Continuar'); // fazer
    expect(host.textContent).toContain('Caixinha de preocupações.');
    await click('Continuar'); // orar
    expect(host.textContent).toContain('Pai, obrigado. Amém.');
  });

  it('sem guia no formato, usa as perguntas do "Para pensar", uma por tela', async () => {
    mocks.get.mockResolvedValue(family);
    mocks.getKids.mockResolvedValue([{ band: '4-6', title: null, scriptureFocus: null, whatItSays: 'Deus cuida.', thinkAbout: 'Quando você tem medo?\nO que ajuda você a ficar calmo?', practice: 'Fazer.', prayer: 'Orar.', adultGuide: 'Só um texto solto.', status: 'published' }]);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar'); // ler
    await click('Continuar'); // pergunta 1
    expect(host.textContent).toContain('Pergunta 1 de 2');
    expect(host.textContent).toContain('Quando você tem medo?');
    await click('Continuar');
    expect(host.textContent).toContain('Pergunta 2 de 2');
    await click('Ver como conduzir');
    expect(host.textContent).toContain('Só um texto solto.');
  });

  it('sem crianças cadastradas, Com crianças abre o cadastro na própria tela', async () => {
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Com crianças');
    expect(host.textContent).toContain('Adicionar criança');
    expect(host.textContent).toContain('Leitura de um dia só');
  });

  it('só adultos: não mistura pergunta de faixa infantil com o texto adulto', async () => {
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('Com quem você vai ler hoje?');
    expect(host.textContent).toContain('Só adultos');
    expect(host.textContent).toContain('Com crianças');
    expect(host.textContent).not.toContain('Adicionar criança');

    await click('Continuar'); // ler
    await click('Continuar'); // pergunta 1
    expect(host.textContent).toContain('Pergunta 1 de 3');
    expect(host.textContent).not.toContain('O que aperta o coração?');
  });

  it('com crianças, escolher só adultos troca todas as telas para o texto adulto', async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Só adultos');
    await click('Continuar'); await click('Continuar');
    expect(host.textContent).toContain('Pergunta 1 de 3');
    expect(host.textContent).not.toContain('O que aperta o coração?');
  });

  it('só adultos: usa as perguntas escritas pelo editor, uma por tela', async () => {
    vi.mocked(DevotionalService.getDailyDevotional).mockResolvedValueOnce({ id: 'd1', title: 'A paz que guarda', reflection: '<p>x</p>', discussion_questions: 'Onde falta paz em casa?\n- O que a gratidão muda?' } as never);
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar'); await click('Continuar');
    expect(host.textContent).toContain('Pergunta 1 de 2');
    expect(host.textContent).toContain('Onde falta paz em casa?');
    await click('Continuar');
    expect(host.textContent).toContain('O que a gratidão muda?');
  });

  it('texto longo vira várias telas de leitura, com o versículo só na primeira', async () => {
    const long = Array.from({ length: 5 }, (_, i) => `<p>${String(i).repeat(300)}</p>`).join('');
    vi.mocked(DevotionalService.getDailyDevotional).mockResolvedValueOnce({ id: 'd1', title: 'Longo', reflection: long, scripture_reference: 'Fp 4:6' } as never);
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar');
    expect(host.textContent).toContain('Parte 1 de 5');
    expect(host.textContent).toContain('Fp 4:6');
    await click('Continuar');
    expect(host.textContent).toContain('Parte 2 de 5');
    expect(host.textContent).not.toContain('Fp 4:6');
  });
});
