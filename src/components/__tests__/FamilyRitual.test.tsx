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

  it('só adultos: não mistura pergunta de faixa infantil com o texto adulto', async () => {
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('Com quem você vai ler hoje?');
    expect(host.textContent).toContain('Só adultos');
    expect(host.textContent).not.toContain('Com crianças');

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
});
