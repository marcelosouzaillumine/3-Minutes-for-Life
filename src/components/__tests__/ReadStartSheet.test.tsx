// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const mocks = vi.hoisted(() => ({ list: vi.fn(), getKids: vi.fn(), addChild: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string; [k: string]: unknown }) =>
      (o?.defaultValue ?? _k).replace(/\{\{(\w+)\}\}/g, (_m, n) => String(o?.[n] ?? '')),
    i18n: { language: 'pt-BR' },
  }),
}));
vi.mock('../../services/FamilyService', () => ({
  FamilyService: mocks,
  activeFamily: { get: () => null, set: () => {} },
  BANDS: ['0-3', '4-6', '7-10', '11-13'],
}));
vi.mock('../../services/DevotionalService', () => ({
  DevotionalService: { getDailyDevotional: vi.fn().mockResolvedValue({ id: 'd1' }) },
}));
vi.mock('../../pages/Family', () => ({ openRitual: vi.fn() }));

import { ReadStartSheet } from '../ReadStartSheet';

const version = (band: string) => ({ band, story: null });
const base = {
  id: 'f1', name: 'G', meetingTime: null, role: 'owner', inviteCode: 'X', members: [{ displayName: 'Eu', role: 'owner', isMe: true, readToday: false }],
  week: { days: [], streak: 0 }, plan: null,
};
const jose = { id: 'c1', nickname: 'Jose', band: '7-10' };
const ana = { id: 'c2', nickname: 'Ana', band: '4-6' };

let root: Root;
let host: HTMLDivElement;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.list.mockResolvedValue({ families: [] });
  mocks.getKids.mockResolvedValue([version('4-6'), version('7-10')]);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.clearAllMocks(); });

const render = (family: unknown) => act(async () => { root.render(<ReadStartSheet audience="kids" family={family as never} plan={false} inline onClose={() => {}} />); });

describe('ReadStartSheet (crianças)', () => {
  it('a criança removida some da tela na hora, sem recarregar', async () => {
    await render({ ...base, children: [jose, ana] });
    await flush();
    expect(host.textContent).toContain('Jose');
    expect(host.textContent).toContain('Ana');
    await render({ ...base, children: [ana] });
    await flush();
    expect(host.textContent).not.toContain('Jose');
    expect(host.textContent).toContain('Ana');
  });

  it('sem criança à mesa a versão não vem marcada e o botão só libera depois de escolher', async () => {
    await render({ ...base, children: [] });
    await flush();
    const start = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Começar a leitura')) as HTMLButtonElement;
    expect(start.disabled).toBe(true);
    expect(host.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
    const opt = [...host.querySelectorAll('[role="radio"]')].find((b) => b.textContent?.includes('7 a 10')) as HTMLElement;
    await act(async () => { opt.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(start.disabled).toBe(false);
  });
});
