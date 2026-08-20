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
    scripture_reference: 'Filipenses 4:6-7',
    scripture_text: 'Não andeis ansiosos por coisa alguma...',
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

  // Test 1 — criação
  it('Teste 1 — criação: Salva tradução manual com translation_source="manual"', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-manual-1', translation_source: 'manual', status: 'draft' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          upsert: mockUpsert
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

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        devotional_id: 'devo-123',
        language: 'en',
        translation_source: 'manual',
        title: 'Manual Title',
        status: 'draft'
      }),
      { onConflict: 'devotional_id,language,translation_source' }
    );
    expect(result.translation_source).toBe('manual');
  });

  // Test 2 — edição
  it('Teste 2 — edição: Atualiza registro de tradução manual existente mantendo a origem manual', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-manual-1', translation_source: 'manual', title: 'Updated Manual Title', status: 'published' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          upsert: mockUpsert
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
      status: 'published'
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Manual Title',
        translation_source: 'manual',
        status: 'published'
      }),
      { onConflict: 'devotional_id,language,translation_source' }
    );
    expect(result.status).toBe('published');
  });

  // Test 3 — rascunho
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
    expect(resolved.title).toBe('Título em Português');
    expect(resolved.resolvedLanguage).toBe('pt-BR');
    expect(resolved.isLanguageFallback).toBe(true);
  });

  // Test 4 — publicação
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

  // Test 5 — prioridade
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

  // Test 6 — fallback
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

  // Test 7 — isolamento
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

  // Test 8 — validação
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

  // Test 9 — sem chamadas IA
  it('Teste 9 — sem chamadas de IA: Fluxo manual salva diretamente no banco sem criar translation_jobs', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'trans-1' }, error: null })
      })
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') {
        return {
          upsert: mockUpsert
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

    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  // Test 10 — compartilhamento
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

    const resolvedDirect = resolveTranslation(devotionalWithManualSpanish, 'es');
    expect(resolvedDirect.title).toBe('Título Editorial en Español');
    expect(resolvedDirect.resolvedLanguage).toBe('es');

    const resolvedLocale = resolveTranslation(devotionalWithManualSpanish, 'es-ES');
    expect(resolvedLocale.title).toBe('Título Editorial en Español');
    expect(resolvedLocale.resolvedLanguage).toBe('es');
  });

  // --- SCRIPTURE FIELDS TESTS (Testes A - H) ---

  // Teste A: Salvar referência bíblica manualmente
  it('Teste A: Salva referência bíblica manualmente com scripture_reference', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-1', scripture_reference: 'Philippians 4:6-7', status: 'draft' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') return { upsert: mockUpsert };
      return {};
    });

    const result = await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Title',
      principle_statement: 'Principle',
      scripture_reference: 'Philippians 4:6-7',
      reflection: '<p>Reflection</p>',
      status: 'draft'
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scripture_reference: 'Philippians 4:6-7'
      }),
      { onConflict: 'devotional_id,language,translation_source' }
    );
    expect(result.scripture_reference).toBe('Philippians 4:6-7');
  });

  // Teste B: Salvar texto bíblico manualmente
  it('Teste B: Salva texto bíblico manualmente com scripture_text', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'trans-1', scripture_text: 'Do not be anxious about anything...', status: 'draft' },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') return { upsert: mockUpsert };
      return {};
    });

    const result = await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Title',
      principle_statement: 'Principle',
      scripture_text: 'Do not be anxious about anything...',
      reflection: '<p>Reflection</p>',
      status: 'draft'
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scripture_text: 'Do not be anxious about anything...'
      }),
      { onConflict: 'devotional_id,language,translation_source' }
    );
    expect(result.scripture_text).toBe('Do not be anxious about anything...');
  });

  // Teste C & D: Salvar ambos em rascunho e publicar ambos
  it('Teste C & D: Salva e publica scripture_reference e scripture_text com status="published"', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'trans-1',
        scripture_reference: 'Philippians 4:6-7',
        scripture_text: 'Do not be anxious about anything...',
        status: 'published',
        translation_source: 'manual'
      },
      error: null
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'devotional_translations') return { upsert: mockUpsert };
      return {};
    });

    const result = await AdminContentService.saveManualTranslation({
      devotional_id: 'devo-123',
      language: 'en',
      title: 'Title',
      principle_statement: 'Principle',
      scripture_reference: 'Philippians 4:6-7',
      scripture_text: 'Do not be anxious about anything...',
      reflection: '<p>Reflection</p>',
      status: 'published'
    });

    expect(result.status).toBe('published');
    expect(result.scripture_reference).toBe('Philippians 4:6-7');
    expect(result.scripture_text).toBe('Do not be anxious about anything...');
  });

  // Teste E & F: Usuário recebe a referência e o texto bíblico traduzidos
  it('Teste E & F: resolveTranslation entrega a referência e o texto bíblico traduzidos na versão manual', () => {
    const devotionalWithScripture = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-1',
          language: 'en',
          title: 'English Title',
          principle_statement: 'English Principle',
          scripture_reference: 'Philippians 4:6-7',
          scripture_text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
          reflection: '<p>English Reflection</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    const resolved = resolveTranslation(devotionalWithScripture, 'en');
    expect(resolved.scripture_reference).toBe('Philippians 4:6-7');
    expect(resolved.scripture_text).toBe('Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.');
    expect(resolved.resolvedLanguage).toBe('en');
  });

  // Teste G: Tradução manual prevalece sobre tradução IA para campos bíblicos
  it('Teste G: Tradução manual prevalece sobre tradução de IA para scripture_reference e scripture_text', () => {
    const devotionalWithBothScripture = {
      ...baseDevotional,
      devotional_translations: [
        {
          id: 'trans-ai',
          language: 'es',
          title: 'IA Title',
          principle_statement: 'IA Principle',
          scripture_reference: 'Filipenses 4:6 (IA)',
          scripture_text: 'Texto de la IA...',
          reflection: '<p>IA Reflection</p>',
          status: 'published',
          translation_source: 'ai'
        },
        {
          id: 'trans-manual',
          language: 'es',
          title: 'Manual Title',
          principle_statement: 'Manual Principle',
          scripture_reference: 'Filipenses 4:6-7 (Editorial)',
          scripture_text: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.',
          reflection: '<p>Manual Reflection</p>',
          status: 'published',
          translation_source: 'manual'
        }
      ]
    };

    const resolved = resolveTranslation(devotionalWithBothScripture, 'es');
    expect(resolved.scripture_reference).toBe('Filipenses 4:6-7 (Editorial)');
    expect(resolved.scripture_text).toBe('Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.');
  });

  // Teste H: Fallback para campos bíblicos originais quando não houver tradução publicada
  it('Teste H: Fallback entrega referência e texto bíblico originais (pt-BR) quando não houver tradução publicada', () => {
    const devotionalWithoutScriptureTrans = {
      ...baseDevotional,
      devotional_translations: []
    };

    const resolved = resolveTranslation(devotionalWithoutScriptureTrans, 'es');
    expect(resolved.scripture_reference).toBe('Filipenses 4:6-7');
    expect(resolved.scripture_text).toBe('Não andeis ansiosos por coisa alguma...');
    expect(resolved.resolvedLanguage).toBe('pt-BR');
    expect(resolved.isLanguageFallback).toBe(true);
  });
});
