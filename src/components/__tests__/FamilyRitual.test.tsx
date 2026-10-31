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

let root: Root;
let host: HTMLDivElement;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const click = (label: string) => act(async () => {
  const b = [...host.querySelectorAll('button')].find((x) => x.textContent?.includes(label));
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
  it('quem não tem família cria uma em dois passos e segue para a leitura', async () => {
    mocks.get.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ ...family, children: [] });
    mocks.addChild.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush();
    expect(host.textContent).toContain('Como se chama a sua família?');

    const input = host.querySelector('input') as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Família Souza');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();
    expect(mocks.create).toHaveBeenCalledWith('Família Souza');
    expect(host.textContent).toContain('Quem lê com você?');
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
});
