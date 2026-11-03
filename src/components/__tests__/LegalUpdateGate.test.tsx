// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? _k }),
}));
vi.mock('../../lib/illumine', () => ({ illumineFetch: fetchMock }));

import { LegalUpdateGate } from '../LegalUpdateGate';
import { LEGAL_VERSION } from '../../lib/legal';

const json = (b: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(b) });
let host: HTMLDivElement; let root: Root;
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const click = (el: Element) => act(async () => { (el as HTMLElement).click(); });
const type = (el: HTMLInputElement, v: string) => act(async () => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, clear: () => store.clear() });
  fetchMock.mockReset();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const mount = async () => { await act(async () => { root.render(<LegalUpdateGate><p>app</p></LegalUpdateGate>); }); await flush(); await flush(); };

describe('LegalUpdateGate', () => {
  it('deixa passar quem já aceitou esta versão', async () => {
    fetchMock.mockImplementation(() => json({ accepted: true }));
    await mount();
    expect(host.textContent).toContain('app');
  });

  it('não trava o app se o servidor falhar', async () => {
    fetchMock.mockImplementation(() => json({}, false));
    await mount();
    expect(host.textContent).toContain('app');
  });

  it('pede o aceite, grava telefone, WhatsApp e aceite, e libera o app', async () => {
    fetchMock.mockImplementation((path: string, opts?: RequestInit) => {
      if (path.startsWith('/legal/acceptance') && !opts) return json({ accepted: false });
      if (path === '/users/me' && !opts) return json({ phone: null });
      return json({ ok: true });
    });
    await mount();
    expect(host.textContent).toContain('Atualizamos nossos termos');
    const cta = host.querySelector('.legalup__cta') as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    const [agree, whats] = Array.from(host.querySelectorAll('input[type=checkbox]'));
    await click(agree);
    await type(host.querySelector('input[type=tel]') as HTMLInputElement, '(41) 99999-9999');
    await click(whats);
    await click(cta);
    await flush();
    const calls = fetchMock.mock.calls.map(([p, o]) => `${(o as RequestInit | undefined)?.method ?? 'GET'} ${p}`);
    expect(calls).toContain('PATCH /users/me');
    expect(calls).toContain('PUT /consent');
    expect(calls).toContain('POST /legal/acceptance');
    const patch = fetchMock.mock.calls.find(([p, o]) => p === '/users/me' && o);
    expect(JSON.parse(patch![1].body)).toEqual({ phone: '+5541999999999' });
    expect(host.textContent).toContain('app');
    expect(localStorage.getItem(`3ml:legal:${LEGAL_VERSION}`)).toBe('1');
  });

  it('aceitar sem WhatsApp não grava consentimento nem exige telefone', async () => {
    fetchMock.mockImplementation((path: string, opts?: RequestInit) => {
      if (path.startsWith('/legal/acceptance') && !opts) return json({ accepted: false });
      if (path === '/users/me' && !opts) return json({ phone: null });
      return json({ ok: true });
    });
    await mount();
    await click(host.querySelectorAll('input[type=checkbox]')[0]);
    await click(host.querySelector('.legalup__cta')!);
    await flush();
    const calls = fetchMock.mock.calls.map(([p, o]) => `${(o as RequestInit | undefined)?.method ?? 'GET'} ${p}`);
    expect(calls).not.toContain('PUT /consent');
    expect(calls).not.toContain('PATCH /users/me');
    expect(calls).toContain('POST /legal/acceptance');
  });

  it('WhatsApp marcado exige um telefone válido', async () => {
    fetchMock.mockImplementation((path: string, opts?: RequestInit) => {
      if (path.startsWith('/legal/acceptance') && !opts) return json({ accepted: false });
      if (path === '/users/me' && !opts) return json({ phone: null });
      return json({ ok: true });
    });
    await mount();
    const [agree, whats] = Array.from(host.querySelectorAll('input[type=checkbox]'));
    await click(agree); await click(whats);
    expect((host.querySelector('.legalup__cta') as HTMLButtonElement).disabled).toBe(true);
  });
});
