import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveTranslation } from '../DevotionalService';
import { AdminContentService } from '../AdminContentService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn()
    }
  };
});

describe('Translation Center — Manual Editorial Translation System', () => {
  const baseDevotional = {
    id: 'devo-123',
    legacy_id: 10,
    title: 'Título em Português',
    principle_statement: 'Princípio em Português',
    reflection: '<p>Reflexão em Português</p>',
    practical_application: '<p>Aplicação em Português</p>',
    prayer: '<p>Oração em Português</p>',
    content_hash: 'hash-pt-123',
    publication_date: '2026-08-20',
    status: 'published'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1 — criação: Administrador consegue criar tradução manual
  it('Teste 1 — criação: Salva tradução manual com translation_source="manual"', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-manual-1', translation_source: 'manual', status: 'draft' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq3 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelectExisting = vi.fn().mockReturnValue({ eq: mockEq1 });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          select: mockSelectExisting,
          insert: mockInsert
        };
      }
      return {};
    });

    const result = await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Manual Title',
      principle_statement: 'Manual Principle',
      reflection: '<p>Manual Reflection</p>',
      status: 'draft'
    });

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        devotional_id: 'devo-123',
        language: 'en',
        translation_source: 'manual',
        title: 'Manual Title',
        status: 'draft'
      })
    ]);
    expect(result.translation_source).toBe('manual');
  });

  // Test 2 — edição: Administrador consegue editar tradução manual existente
  it('Teste 2 — edição: Atualiza registro de tradução manual existente mantendo a origem manual', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-manual-1', translation_source: 'manual', title: 'Updated Manual Title' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'trans-manual-1' }, error: null });
    const mockEq3 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelectExisting = vi.fn().mockReturnValue({ eq: mockEq1 });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          select: mockSelectExisting,
          update: mockUpdate
        };
      }
      return {};
    });

    const result = await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Updated Manual Title',
      principle_statement: 'Updated Principle',
      reflection: '<p>Updated Reflection</p>',
      status: 'draft'
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Manual Title',
        translation_source: 'manual',
        status: 'draft'
      })
    );
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 'trans-manual-1');
    expect(result.title).toBe('Updated Manual Title');
  });

  // Test 3 — rascunho: Rascunho não aparece para usuários finais
  it('Teste 3 — rascunho: Tradução manual em rascunho (status="draft") é ignorada no resolveTranslation e faz fallback', () => {
    const devotionalWithDraft = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-1',
          language: 'en',
          title: 'Draft English Title',
          principle_statement: 'Draft English Principle',
          reflection: '<p>Draft English Reflection</p>',
          status: 'draft',
          translation_source: 'manual'
        }
      ]
    };

    const resolved = resolveTranslation(devotionalWithDraft, 'en');
    // Deve ignorar o rascunho e fazer fallback para o original em português
    expect(resolved.title).toBe('Título em Português');
    expect(resolved.resolvedLanguage).toBe('pt-BR');
    expect(resolved.isLanguageFallback).toBe(true);
  });

  // Test 4 — publicação: Tradução publicada aparece para usuários
  it('Teste 4 — publicação: Tradução manual com status="published" é entregue ao usuário', () => {
    const devotionalWithPublishedManual = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-manual-1',
          language: 'en',
          title: 'Published Manual English Title',
          principle_statement: 'Published Manual English Principle',
          reflection: '<p>Published Manual English Reflection</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    const resolved = resolveTranslation(devotionalWithPublishedManual, 'en');
    expect(resolved.title).toBe('Published Manual English Title');
    expect(resolved.principle_statement).toBe('Published Manual English Principle');
    expect(resolved.resolvedLanguage).toBe('en');
    expect(resolved.isLanguageFallback).toBe(false);
  });

  // Test 5 — prioridade: Se existir IA publicada + Manual publicada, a MANUAL sempre vence
  it('Teste 5 — prioridade: Tradução manual publicada SEMPRE prevalece sobre a tradução automática da IA', () => {
    const devotionalWithBoth = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-ai-1',
          language: 'en',
          title: 'AI English Title',
          principle_statement: 'AI English Principle',
          reflection: '<p>AI English Reflection</p>',
          status: 'published',
          translation_source: 'ai'
        },
        {
          id: 'trans-manual-1',
          language: 'en',
          title: 'Manual Editorial English Title',
          principle_statement: 'Manual Editorial English Principle',
          reflection: '<p>Manual Editorial English Reflection</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    const resolved = resolveTranslation(devotionalWithBoth, 'en');
    expect(resolved.title).toBe('Manual Editorial English Title');
    expect(resolved.principle_statement).toBe('Manual Editorial English Principle');
    expect(resolved.reflection).toBe('<p>Manual Editorial English Reflection</p>');
    expect(resolved.resolvedLanguage).toBe('en');
  });

  // Test 6 — fallback: Se não existir tradução publicada, o original em português deve ser retornado
  it('Teste 6 — fallback: Sem tradução para o idioma, retorna os dados originais em pt-BR', () => {
    const devotionalWithoutTrans = {
      ...baseDevotional,
      devotional_translations: []
    };

    const resolved = resolveTranslation(devotionalWithoutTrans, 'es');
    expect(resolved.title).toBe('Título em Português');
    expect(resolved.principle_statement).toBe('Princípio em Português');
    expect(resolved.resolvedLanguage).toBe('pt-BR');
    expect(resolved.isLanguageFallback).toBe(true);
    expect(resolved.translationStatus).toBe('unavailable');
  });

  // Test 7 — isolamento: Uma tradução em English não é usada para Spanish
  it('Teste 7 — isolamento: Tradução em English não é usada como tradução para Spanish', () => {
    const devotionalEnOnly = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-en-1',
          language: 'en',
          title: 'English Title',
          principle_statement: 'English Principle',
          reflection: '<p>English Reflection</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    const resolvedSpanish = resolveTranslation(devotionalEnOnly, 'es');
    expect(resolvedSpanish.resolvedLanguage).toBe('pt-BR');
    expect(resolvedSpanish.title).toBe('Título em Português');
    expect(resolvedSpanish.isLanguageFallback).toBe(true);
  });

  // Test 8 — autorização / validação: Falha ao tentar publicar sem campos obrigatórios
  it('Teste 8 — validação de publicação: Rejeita publicação manual sem título ou reflexão ou destaque', async () => {
    await expect(
      AdminContentService.saveManualTranslation({
        devotional_id: 'devo-123',
        language: 'en',
        title: '',
        principle_statement: 'Principle',
        reflection: 'Reflection',
        status: 'published'
      })
    ).rejects.toThrow('O título é obrigatório');

    await expect(
      AdminContentService.saveManualTranslation({
        devotional_id: 'devo-123',
        language: 'en',
        title: 'Title',
        principle_statement: '',
        reflection: 'Reflection',
        status: 'published'
      })
    ).rejects.toThrow('O destaque (principle statement) é obrigatório');

    await expect(
      AdminContentService.saveManualTranslation({
        devotional_id: 'devo-123',
        language: 'en',
        title: 'Title',
        principle_statement: 'Principle',
        reflection: '',
        status: 'published'
      })
    ).rejects.toThrow('A reflexão é obrigatória');
  });

  // Test 9 — IA: O fluxo manual não realiza chamadas para a API OpenAI nem enfileira jobs
  it('Teste 9 — sem chamadas de IA: Fluxo manual salva diretamente no banco sem criar translation_jobs', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'trans-1' }, error: null })
      })
    });
    const mockSelectExisting = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          select: mockSelectExisting,
          insert: mockInsert
        };
      }
      if (table === 'translation_jobs') {
        throw new Error('translation_jobs MUST NOT be accessed during manual translation flow');
      }
      return {};
    });

    await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Valid Title',
      principle_statement: 'Valid Principle',
      reflection: 'Valid Reflection',
      status: 'draft'
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  // Test 10 — compartilhamento e links públicos: Devocional compartilhado respeita resolução
  it('Teste 10 — compartilhamento e links públicos: Resolução funciona deterministamente para requisições com código de idioma', () => {
    const devotionalWithManualSpanish = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-es-manual',
          language: 'es',
          title: 'Título Editorial en Español',
          principle_statement: 'Principio en Español',
          reflection: '<p>Reflexión en Español</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    // Shared devotional requested with lang 'es' or 'es-ES'
    const resolvedDirect = resolveTranslation(devotionalWithManualSpanish, 'es');
    expect(resolvedDirect.title).toBe('Título Editorial en Español');
    expect(resolvedDirect.resolvedLanguage).toBe('es');

    const resolvedLocale = resolveTranslation(devotionalWithManualSpanish, 'es-ES');
    expect(resolvedLocale.title).toBe('Título Editorial en Español');
    expect(resolvedLocale.resolvedLanguage).toBe('es');
  });
});
