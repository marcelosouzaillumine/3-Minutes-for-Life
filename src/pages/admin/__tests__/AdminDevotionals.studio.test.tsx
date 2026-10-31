// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const mocks = vi.hoisted(() => ({
  kidsSummary: vi.fn(),
  getKids: vi.fn(),
  saveKids: vi.fn(),
  translateWithAi: vi.fn(),
  saveManualTranslation: vi.fn(),
}));

vi.mock('../../../lib/illumine', () => ({ illumineFetch: vi.fn(), illumineAuth: { isAuthenticated: () => true } }));
vi.mock('../../../services/AdminService', () => ({ AdminService: { getDevotionalRanking: vi.fn().mockResolvedValue(null) } }));
vi.mock('../../../components/PrincipleView', () => ({ PrincipleView: () => null }));
vi.mock('../../../components/admin/RichTextEditor', () => ({ RichTextEditor: () => null }));
vi.mock('../../../components/admin/MediaLibraryPicker', () => ({ MediaLibraryPicker: () => null }));
vi.mock('../../../components/admin/ManualTranslationEditor', () => ({
  ManualTranslationEditor: ({ language }: { language: { iso_code: string } }) => <div>EDITOR DE TRADUÇÃO {language.iso_code}</div>,
}));
vi.mock('../../../services/FamilyService', async (orig) => ({
  ...(await orig<typeof import('../../../services/FamilyService')>()),
  FamilyAdmin: { kidsSummary: mocks.kidsSummary, getKids: mocks.getKids, saveKids: mocks.saveKids },
}));

import { AdminDevotionals } from '../AdminDevotionals';
import { AdminContentService } from '../../../services/AdminContentService';

const devo = {
  id: 'd1', title: 'A paz', status: 'published', publication_date: '2026-10-30',
  scripture_reference: 'Fp 4:6', reflection: '<p>texto</p>', content_hash: 'h',
  devotional_translations: [{ language: 'en', translation_source: 'ai', status: 'draft', title: 'Peace', reflection: 'r', principle_statement: 'p' }],
};

let root: Root; let host: HTMLDivElement;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const click = (el: Element | null | undefined) => act(async () => { el!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const byText = (sel: string, text: string) => [...host.querySelectorAll(sel)].find((e) => e.textContent?.includes(text));

beforeEach(async () => {
  mocks.kidsSummary.mockResolvedValue({});
  mocks.getKids.mockResolvedValue({ '4-6': null, '7-10': null, '11-13': null });
  mocks.translateWithAi.mockResolvedValue({ ok: true });
  vi.spyOn(AdminContentService, 'getDevotionals').mockResolvedValue([devo] as any);
  vi.spyOn(AdminContentService, 'getDevotional').mockResolvedValue(devo as any);
  vi.spyOn(AdminContentService, 'getCategories').mockResolvedValue([]);
  vi.spyOn(AdminContentService, 'translateWithAi').mockImplementation(mocks.translateWithAi);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  host = document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await act(async () => { root.render(<AdminDevotionals />); });
  await flush(); await flush();
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe('Conteúdo unificado', () => {
  it('clicar no idioma na lista abre o editor naquele idioma, com as faixas infantis', async () => {
    const fr = [...host.querySelectorAll('[role="button"]')].find((e) => e.textContent?.startsWith('FR'));
    expect(fr).toBeTruthy();
    await click(fr);
    await flush(); await flush();
    expect(host.textContent).toContain('EDITOR DE TRADUÇÃO fr');
    expect(byText('[role="tab"]', 'IT')).toBeTruthy();
    expect(byText('[role="tab"]', '7 a 10 anos')).toBeTruthy();
  });

  it('abre a faixa infantil de um idioma e oferece traduzir os idiomas que faltam', async () => {
    await click(byText('h3', 'A paz'));
    await flush(); await flush();
    await click(byText('[role="tab"]', '7 a 10 anos'));
    await flush(); await flush();
    expect(host.textContent).toContain('O que a Bíblia conta');
    const translate = byText('button', 'Traduzir com IA');
    expect(translate?.textContent).toContain('ES');
    expect(translate?.textContent).toContain('FR');
    expect(translate?.textContent).not.toContain('EN'); // inglês já tem rascunho
    await click(translate);
    await flush();
    expect(mocks.translateWithAi).toHaveBeenCalledWith('d1', ['es', 'fr', 'it']);
  });
});
