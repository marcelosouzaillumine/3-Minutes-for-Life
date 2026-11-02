// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/illumine', () => ({ illumineFetch: vi.fn() }));

import { illumineFetch } from '../../lib/illumine';
import { FamilyService, activeFamily } from '../FamilyService';

const mockFetch = vi.mocked(illumineFetch);
const reply = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 404, json: async () => body }) as Response;

describe('FamilyService com vários grupos', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => store.clear(),
    });
  });

  it('sem grupo ativo não manda familyId (vale o mais antigo)', async () => {
    mockFetch.mockResolvedValue(reply({ family: { id: 'f1' } }));
    await FamilyService.get();
    expect(String(mockFetch.mock.calls[0][0])).not.toContain('familyId');
  });

  it('com grupo ativo manda familyId nas rotas do grupo, mas não na lista nem ao criar', async () => {
    activeFamily.set('f2');
    mockFetch.mockResolvedValue(reply({ family: { id: 'f2' }, families: [], prayers: [] }));
    await FamilyService.get();
    await FamilyService.prayers();
    await FamilyService.list();
    const urls = mockFetch.mock.calls.map((c) => String(c[0]));
    expect(urls[0]).toContain('/families/me?');
    expect(urls[0]).toContain('familyId=f2');
    expect(urls[1]).toContain('familyId=f2');
    expect(urls[2]).not.toContain('familyId');
  });

  it('criar ou entrar torna o novo grupo o ativo; sair limpa', async () => {
    mockFetch.mockResolvedValue(reply({ family: { id: 'novo' } }));
    await FamilyService.create('Célula');
    expect(activeFamily.get()).toBe('novo');
    await FamilyService.leave();
    expect(activeFamily.get()).toBeNull();
  });

  it('grupo ativo que não existe mais: volta para o mais antigo', async () => {
    activeFamily.set('apagado');
    mockFetch.mockResolvedValueOnce(reply({ family: null })).mockResolvedValueOnce(reply({ family: { id: 'f1' } }));
    const f = await FamilyService.get();
    expect(f?.id).toBe('f1');
    expect(activeFamily.get()).toBeNull();
  });
});
