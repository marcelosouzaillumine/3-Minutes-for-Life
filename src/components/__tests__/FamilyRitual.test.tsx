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

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), addChild: vi.fn(), getKids: vi.fn(), readTogether: vi.fn() }));

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
import { JourneyService } from '../../services/JourneyService';

let root: Root;
let host: HTMLDivElement;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const press = (names: string[]) => {
  const b = [...host.querySelectorAll('button')].find((x) => names.some((n) => x.textContent?.includes(n) || x.getAttribute('aria-label')?.includes(n)));
  if (!b) throw new Error(`botão não encontrado: ${names[0]}`);
  b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};
// 'Continuar' avança até sair das duas telas de entrada (público e quem está à mesa).
const click = (label: string) => act(async () => {
  press(label === 'Continuar' ? ['Continuar', 'Começar'] : [label]);
  if (label !== 'Continuar') return;
  for (let i = 0; i < 2; i++) {
    await new Promise((r) => setTimeout(r, 0));
    if (/Com quem você vai ler hoje\?|Quem vai ler\?/.test(host.textContent ?? '')) press(['Continuar', 'Começar']);
  }
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
    const sel = host.querySelector('form select') as HTMLSelectElement;
    expect(sel.value).toBe('');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(sel, '7-10');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
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
    expect(host.textContent).toContain('2 · Conversar');
    await swipe(100, 300);
    expect(host.textContent).toContain('1 · Ler');
    await swipe(200, 170);
    expect(host.textContent).toContain('1 · Ler');
  });

  const kid = (story: unknown) => ({ band: '4-6', title: 'A Bíblia é para todos', scriptureFocus: null, whatItSays: 'Texto de reserva.', thinkAbout: 'Pensar?', practice: 'Fazer.', prayer: 'Orar.', adultGuide: guide, story, status: 'published' });
  const open = async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar'); // passagem
  };

  it('abre na versão da faixa escolhida na folha (11 a 13), não na mais nova', async () => {
    const f3 = { ...family, children: [{ id: 'c1', nickname: 'Bento', band: '4-6' }, { id: 'c3', nickname: 'Lia', band: '11-13' }] };
    const v = (band: string, title: string) => ({ ...kid(null), band, title });
    mocks.get.mockResolvedValue(f3);
    mocks.getKids.mockResolvedValue([v('4-6', 'Versão pequena'), v('11-13', 'Versão adolescente')]);
    await act(async () => { root.render(<FamilyRitual source="daily" audience="kids" intro={false} kidIds={['c1', 'c3']} band="11-13" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('Versão adolescente');
    expect(host.textContent).not.toContain('Versão pequena');
  });

  it('quadrinhos: passagem primeiro, depois um quadro por tela, legenda e fala em texto, e só então as perguntas', async () => {
    mocks.getKids.mockResolvedValue([kid({ format: 'panels', panels: [
      { image: '/ilustracoes/x/1.svg', caption: 'Em casa havia um livro.', speech: 'Que livro grande!' },
      { image: '/ilustracoes/x/2.svg', caption: 'Ninguém alcançava.' },
    ] })]);
    await open();
    expect(host.textContent).toContain('1 · Ler');
    expect(host.textContent).toContain('Fp 4:6');
    expect(host.textContent).not.toContain('Texto de reserva.');
    await click('Continuar');
    expect(host.textContent).toContain('Quadro 1 de 2');
    expect(host.textContent).toContain('Em casa havia um livro.');
    expect(host.querySelector('.kstory__speech')?.textContent).toBe('Que livro grande!');
    expect(host.querySelector('.kstory__art img')?.getAttribute('src')).toBe('/ilustracoes/x/1.svg');
    await click('Continuar');
    expect(host.textContent).toContain('Quadro 2 de 2');
    expect(host.querySelector('.kstory__speech')).toBeNull();
    await click('Continuar');
    expect(host.textContent).toContain('2 · Conversar');
  });

  it('quadrinhos: se a imagem não carregar, a legenda continua na tela', async () => {
    mocks.getKids.mockResolvedValue([kid({ format: 'panels', panels: [{ image: 'https://cdn.exemplo.com/1.png', caption: 'Legenda.' }, { image: 'https://cdn.exemplo.com/2.png', caption: 'Outra.' }] })]);
    await open();
    await click('Continuar');
    await act(async () => { host.querySelector('.kstory__art img')!.dispatchEvent(new Event('error')); });
    expect(host.querySelector('.kstory__art')).toBeNull();
    expect(host.textContent).toContain('Legenda.');
  });

  it('dilema: situação, decisão da mesa (opções marcáveis), desfecho e “E hoje?”', async () => {
    mocks.getKids.mockResolvedValue([kid({ format: 'dilemma', setup: 'Worms, 1521.', question: 'O que você faria?', options: ['Negar', 'Manter'], outcome: 'Ele recusou.', quote: 'Presa à Palavra.', outcomeQuestion: 'Alguém mudaria?', today: 'Hoje é mais rápido.', todayQuestion: 'Onde procura?' })]);
    await open();
    await click('Continuar');
    expect(host.textContent).toContain('O dilema · 1/4');
    expect(host.textContent).toContain('Worms, 1521.');
    expect(host.textContent).not.toContain('Ele recusou.'); // o desfecho só vem depois da decisão
    await click('Continuar');
    expect(host.textContent).toContain('A decisão da mesa · 2/4');
    await click('Manter');
    expect(host.querySelector('.kstory__opt.is-on')?.textContent).toBe('Manter');
    await click('Continuar');
    expect(host.textContent).toContain('Ele recusou.');
    expect(host.querySelector('.kstory__quote')?.textContent).toBe('“Presa à Palavra.”');
    expect(host.textContent).not.toContain('Alguém mudaria?'); // a leitura só conta; quem pergunta é a conversa
    await click('Continuar');
    expect(host.textContent).toContain('Hoje é mais rápido.');
    expect(host.textContent).not.toContain('Onde procura?');
    await click('Continuar');
    expect(host.textContent).toContain('Alguém mudaria?'); // a pergunta da história abre a conversa, que é uma tela só
    expect(host.textContent).not.toContain('Onde procura?');
  });

  it('sem história, a leitura em texto segue igual', async () => {
    mocks.getKids.mockResolvedValue([kid(null)]);
    await open();
    expect(host.textContent).toContain('Texto de reserva.');
    expect(host.querySelector('.kstory')).toBeNull();
  });

  it('mostra uma só pergunta, a atividade e a oração em família do guia', async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('A paz que guarda');

    await click('Continuar'); // ler
    expect(host.textContent).toContain('1 · Ler');
    await click('Continuar'); // pergunta 1
    expect(host.textContent).toContain('2 · Conversar');
    expect(host.textContent).toContain('O que aperta o coração?');
    expect(host.textContent).not.toContain('Leia em voz baixa.'); // guia do adulto começa recolhido
    await click('Ver como conduzir');
    expect(host.textContent).toContain('Leia em voz baixa.');
    expect(host.textContent).not.toContain('Pergunta 2 de 2'); // Conversar é uma tela só
    await click('Continuar'); // fazer
    expect(host.textContent).toContain('Caixinha de preocupações.');
    await click('Continuar'); // orar
    expect(host.textContent).toContain('Pai, obrigado. Amém.');
  });

  it('ao concluir com crianças à mesa, registra o adulto e as crianças (mesmo com um adulto só)', async () => {
    mocks.get.mockResolvedValue(family);
    mocks.readTogether.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar');
    for (let i = 0; i < 20 && !host.textContent?.includes('Concluímos juntos'); i++) await act(async () => { press(['Continuar']); });
    await act(async () => { press(['Concluímos juntos']); });
    await flush();
    expect(JourneyService.complete).toHaveBeenCalled();
    expect(mocks.readTogether).toHaveBeenCalledWith('d1', [0], ['c1']);
  });

  it('só adultos: ao concluir não envia criança nenhuma', async () => {
    mocks.get.mockResolvedValue({ ...family, members: [...family.members, { displayName: 'Ana', role: 'adult', isMe: false, readToday: false }] });
    mocks.readTogether.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Só adultos');
    for (let i = 0; i < 20 && !host.textContent?.includes('Concluímos juntos'); i++) await act(async () => { press(['Continuar', 'Começar']); });
    await act(async () => { press(['Concluímos juntos']); });
    await flush();
    expect(mocks.readTogether).toHaveBeenCalledWith('d1', [0, 1], []);
  });

  it('sem guia no formato, usa as perguntas do "Para pensar", só a primeira', async () => {
    mocks.get.mockResolvedValue(family);
    mocks.getKids.mockResolvedValue([{ band: '4-6', title: null, scriptureFocus: null, whatItSays: 'Deus cuida.', thinkAbout: 'Quando você tem medo?\nO que ajuda você a ficar calmo?', practice: 'Fazer.', prayer: 'Orar.', adultGuide: 'Só um texto solto.', status: 'published' }]);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar'); // ler
    await click('Continuar'); // pergunta 1
    expect(host.textContent).toContain('2 · Conversar');
    expect(host.textContent).toContain('Quando você tem medo?');
    expect(host.textContent).not.toContain('O que ajuda você a ficar calmo?'); // só a primeira pergunta
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
    expect(host.textContent).toContain('2 · Conversar');
    expect(host.textContent).not.toContain('O que aperta o coração?');
  });

  it('com crianças, escolher só adultos troca todas as telas para o texto adulto', async () => {
    mocks.get.mockResolvedValue(family);
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Só adultos');
    await click('Continuar'); await click('Continuar');
    expect(host.textContent).toContain('2 · Conversar');
    expect(host.textContent).not.toContain('O que aperta o coração?');
  });

  it('só adultos: usa a primeira pergunta escrita pelo editor', async () => {
    vi.mocked(DevotionalService.getDailyDevotional).mockResolvedValueOnce({ id: 'd1', title: 'A paz que guarda', reflection: '<p>x</p>', discussion_questions: 'Onde falta paz em casa?\n- O que a gratidão muda?' } as never);
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar'); await click('Continuar');
    expect(host.textContent).toContain('2 · Conversar');
    expect(host.textContent).toContain('Onde falta paz em casa?');
    expect(host.textContent).not.toContain('O que a gratidão muda?');
  });

  it('mede o espaço real da tela: com muito espaço, o texto cabe numa tela só', async () => {
    const long = Array.from({ length: 5 }, (_, i) => `<p>${String(i).repeat(300)}.</p>`).join('');
    vi.mocked(DevotionalService.getDailyDevotional).mockResolvedValueOnce({ id: 'd1', title: 'Longo', reflection: long, scripture_reference: 'Fp 4:6' } as never);
    mocks.get.mockResolvedValue({ ...family, children: [] });
    const h = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(5000);
    const w = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390);
    const sh = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300);
    try {
      await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
      await flush(); await flush();
      await click('Continuar'); // ler (uma tela só)
      expect(host.textContent).toContain('1 · Ler');
      await click('Continuar');
      expect(host.textContent).toContain('2 · Conversar');
    } finally { h.mockRestore(); w.mockRestore(); sh.mockRestore(); }
  });

  it('texto longo vira várias telas de leitura, com o versículo só na primeira', async () => {
    const long = Array.from({ length: 5 }, (_, i) => `<p>${String(i).repeat(300)}</p>`).join('');
    vi.mocked(DevotionalService.getDailyDevotional).mockResolvedValueOnce({ id: 'd1', title: 'Longo', reflection: long, scripture_reference: 'Fp 4:6' } as never);
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" onClose={() => {}} />); });
    await flush(); await flush();
    await click('Continuar');
    expect(host.textContent).toContain('1 de ');
    expect(host.textContent).toContain('Fp 4:6');
    await click('Continuar');
    expect(host.textContent).toContain('2 de ');
    expect(host.textContent).not.toContain('Fp 4:6');
  });

  it('escolheu crianças e o devocional não tem versão infantil: avisa "Indisponível hoje" em vez de abrir o texto dos adultos', async () => {
    mocks.get.mockResolvedValue({ ...family, children: [] });
    mocks.getKids.mockResolvedValue([]);
    await act(async () => { root.render(<FamilyRitual source="daily" audience="kids" onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).toContain('Indisponível hoje');
    expect(host.textContent).toContain('Ler a versão dos adultos');
    expect(host.textContent).not.toContain('A paz que guarda');
  });

  it('lê uma faixa sem criança cadastrada e não registra progresso de ninguém', async () => {
    mocks.get.mockResolvedValue({ ...family, children: [] });
    await act(async () => { root.render(<FamilyRitual source="daily" audience="kids" kidIds={[]} guestBand="4-6" intro={false} onClose={() => {}} />); });
    await flush(); await flush();
    expect(host.textContent).not.toContain('Indisponível hoje');
    expect(host.textContent).toContain('Deus cuida.');
  });
});
