// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const mocks = vi.hoisted(() => ({ available: vi.fn(), auth: vi.fn() }));
vi.mock('../../services/FamilyService', () => ({ FamilyService: { kidsAvailable: mocks.available } }));
vi.mock('../../lib/illumine', () => ({ illumineAuth: { isAuthenticated: mocks.auth } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, d: string) => d, i18n: { language: 'pt-BR' } }),
}));

import { KidsBadge } from '../KidsBadge';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  mocks.auth.mockReturnValue(true); mocks.available.mockResolvedValue({ d1: ['0-3', '7-10'] });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('selo de versão para crianças', () => {
  it('mostra disponível para quem tem versão publicada e indisponível para quem não tem, com uma consulta só', async () => {
    await act(async () => { root.render(<><KidsBadge devotionalId="d1" /><KidsBadge devotionalId="d2" /></>); });
    await flush();
    expect(host.textContent).toContain('Versão para crianças');
    expect(host.textContent).toContain('Crianças: indisponível');
    expect(mocks.available).toHaveBeenCalledTimes(1);
  });
});
