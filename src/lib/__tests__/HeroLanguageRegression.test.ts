import { describe, it, expect } from 'vitest';
import { resolveTranslation, normalizeLanguage } from '../../services/DevotionalService';

describe('Hero Language & Translation Regression Gate (Prompt 7)', () => {

  // Fixture: Canonical Devotional with manual and published translations in EN and ES
  const mockDevotionalWithTranslations = {
    id: 'devo-uuid-today',
    title: 'O Valor da Paciência',
    principle_statement: 'A paciência é uma virtude que transforma conflitos em sabedoria.',
    reflection: '<p>Primeiro parágrafo em português sobre paciência.</p><p>Segundo parágrafo desenvolvendo a calma.</p>',
    practical_application: '<p>Respire fundo antes de responder hoje.</p>',
    prayer: '<p>Senhor, dai-me paciência.</p>',
    scripture_reference: 'Tiago 1:19',
    scripture_text: 'Todo homem seja pronto para ouvir, tardio para falar.',
    content_hash: 'hash-abc-123',
    devotional_translations: [
      {
        id: 'trans-en-1',
        language: 'en',
        title: 'The Value of Patience',
        principle_statement: 'Patience is a virtue that transforms conflict into wisdom.',
        reflection: '<p>First paragraph in English about patience.</p><p>Second paragraph developing calm.</p>',
        practical_application: '<p>Take a deep breath before responding today.</p>',
        prayer: '<p>Lord, grant me patience.</p>',
        scripture_reference: 'James 1:19',
        scripture_text: 'Let every person be quick to hear, slow to speak.',
        status: 'published',
        translation_source: 'manual',
        source_content_hash: 'hash-abc-123'
      },
      {
        id: 'trans-es-1',
        language: 'es',
        title: 'El Valor de la Paciencia',
        principle_statement: 'La paciencia es una virtud que transforma conflictos en sabiduría.',
        reflection: '<p>Primer párrafo en español sobre la paciencia.</p><p>Segundo párrafo desarrollando la calma.</p>',
        practical_application: '<p>Respira profundo antes de responder hoy.</p>',
        prayer: '<p>Señor, dame paciencia.</p>',
        scripture_reference: 'Santiago 1:19',
        scripture_text: 'Que cada uno sea pronto para oír, tardo para hablar.',
        status: 'published',
        translation_source: 'manual',
        source_content_hash: 'hash-abc-123'
      }
    ]
  };

  // Fixture: Devotional without any translations (fallback scenario)
  const mockDevotionalWithoutTranslations = {
    id: 'devo-uuid-fallback',
    title: 'Amor Incondicional',
    principle_statement: 'O amor supera todas as barreiras.',
    reflection: '<p>Texto somente em português.</p>',
    practical_application: '<p>Ame hoje.</p>',
    prayer: '<p>Senhor, ensina-me a amar.</p>',
    scripture_reference: '1 Coríntios 13:13',
    scripture_text: 'O maior destes é o amor.',
    content_hash: 'hash-xyz-999',
    devotional_translations: []
  };

  // ─── 1. Normalização de Idiomas ─────────────────────────────────────────────

  describe('1. Normalização Canônica de Idiomas', () => {
    it('normaliza pt, pt-BR e strings vazias para pt-BR', () => {
      expect(normalizeLanguage('')).toBe('pt-BR');
      expect(normalizeLanguage(undefined)).toBe('pt-BR');
      expect(normalizeLanguage('pt')).toBe('pt-BR');
      expect(normalizeLanguage('pt-BR')).toBe('pt-BR');
    });

    it('normaliza en e variantes (en-US, en-GB) para en', () => {
      expect(normalizeLanguage('en')).toBe('en');
      expect(normalizeLanguage('en-US')).toBe('en');
      expect(normalizeLanguage('en-GB')).toBe('en');
    });

    it('normaliza es e variantes (es-ES, es-MX) para es', () => {
      expect(normalizeLanguage('es')).toBe('es');
      expect(normalizeLanguage('es-ES')).toBe('es');
      expect(normalizeLanguage('es-MX')).toBe('es');
    });
  });

  // ─── 2. Resolução por Idioma (PT-BR, EN, EN-US, ES, ES-ES) ─────────────────

  describe('2. Resolução por Idioma no Hero', () => {
    it('PT-BR: Hero exibe conteúdo estritamente em português', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'pt-BR');
      expect(resolved.title).toBe('O Valor da Paciência');
      expect(resolved.principle_statement).toContain('A paciência é uma virtude');
      expect(resolved.reflection).toContain('português sobre paciência');
      expect(resolved.practical_application).toContain('Respire fundo');
      expect(resolved.prayer).toContain('Senhor, dai-me paciência');
      expect(resolved.scripture_reference).toBe('Tiago 1:19');
      expect(resolved.resolvedLanguage).toBe('pt-BR');
      expect(resolved.isLanguageFallback).toBe(false);
    });

    it('EN: Hero exibe conteúdo em inglês sem nenhum resquício de português', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'en');
      expect(resolved.title).toBe('The Value of Patience');
      expect(resolved.principle_statement).toBe('Patience is a virtue that transforms conflict into wisdom.');
      expect(resolved.reflection).toContain('First paragraph in English');
      expect(resolved.practical_application).toContain('Take a deep breath');
      expect(resolved.prayer).toContain('Lord, grant me patience');
      expect(resolved.scripture_reference).toBe('James 1:19');
      expect(resolved.scripture_text).toBe('Let every person be quick to hear, slow to speak.');
      expect(resolved.resolvedLanguage).toBe('en');
      expect(resolved.isLanguageFallback).toBe(false);

      // Regressão Crítica: Não pode conter português quando EN está selecionado
      expect(resolved.title).not.toBe('O Valor da Paciência');
      expect(resolved.reflection).not.toContain('português');
    });

    it('EN-US: Hero resolve corretamente para a tradução em inglês (en)', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'en-US');
      expect(resolved.title).toBe('The Value of Patience');
      expect(resolved.principle_statement).toBe('Patience is a virtue that transforms conflict into wisdom.');
      expect(resolved.resolvedLanguage).toBe('en');
      expect(resolved.isLanguageFallback).toBe(false);
    });

    it('ES: Hero exibe conteúdo em espanhol sem nenhum resquício de português', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'es');
      expect(resolved.title).toBe('El Valor de la Paciencia');
      expect(resolved.principle_statement).toBe('La paciencia es una virtud que transforma conflictos en sabiduría.');
      expect(resolved.reflection).toContain('Primer párrafo en español');
      expect(resolved.practical_application).toContain('Respira profundo');
      expect(resolved.prayer).toContain('Señor, dame paciencia');
      expect(resolved.scripture_reference).toBe('Santiago 1:19');
      expect(resolved.scripture_text).toBe('Que cada uno sea pronto para oír, tardo para hablar.');
      expect(resolved.resolvedLanguage).toBe('es');
      expect(resolved.isLanguageFallback).toBe(false);

      // Regressão Crítica: Não pode conter português quando ES está selecionado
      expect(resolved.title).not.toBe('O Valor da Paciência');
      expect(resolved.reflection).not.toContain('português');
    });

    it('ES-ES: Hero resolve corretamente para a tradução em espanhol (es)', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'es-ES');
      expect(resolved.title).toBe('El Valor de la Paciencia');
      expect(resolved.principle_statement).toBe('La paciencia es una virtud que transforma conflictos en sabiduría.');
      expect(resolved.resolvedLanguage).toBe('es');
      expect(resolved.isLanguageFallback).toBe(false);
    });
  });

  // ─── 3. Cenário de Fallback Somente Quando Tradução Não Existir ───────────────

  describe('3. Fallback Controlado (Apenas quando não há tradução)', () => {
    it('Se tradução em EN não existe, faz fallback para PT-BR e sinaliza isLanguageFallback=true', () => {
      const resolved = resolveTranslation(mockDevotionalWithoutTranslations, 'en');
      expect(resolved.title).toBe('Amor Incondicional');
      expect(resolved.resolvedLanguage).toBe('pt-BR');
      expect(resolved.isLanguageFallback).toBe(true);
      expect(resolved.translationStatus).toBe('unavailable');
    });

    it('Se tradução existe, NUNCA ativa isLanguageFallback para EN ou ES', () => {
      const resolvedEn = resolveTranslation(mockDevotionalWithTranslations, 'en');
      expect(resolvedEn.isLanguageFallback).toBe(false);
      expect(resolvedEn.translationStatus).toBe('available');

      const resolvedEs = resolveTranslation(mockDevotionalWithTranslations, 'es');
      expect(resolvedEs.isLanguageFallback).toBe(false);
      expect(resolvedEs.translationStatus).toBe('available');
    });
  });

  // ─── 4. Isolamento do Cache por Idioma ───────────────────────────────────────

  describe('4. Isolamento Estrito do Cache', () => {
    it('Payload resolvido para EN não possui poluição de campos em português', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'en', 'indexeddb', true);
      expect(resolved.isCached).toBe(true);
      expect(resolved.source).toBe('indexeddb');
      expect(resolved.title).toBe('The Value of Patience');
      expect(resolved.resolvedLanguage).toBe('en');
    });

    it('Payload resolvido para ES não possui poluição de campos em português', () => {
      const resolved = resolveTranslation(mockDevotionalWithTranslations, 'es', 'indexeddb', true);
      expect(resolved.isCached).toBe(true);
      expect(resolved.source).toBe('indexeddb');
      expect(resolved.title).toBe('El Valor de la Paciencia');
      expect(resolved.resolvedLanguage).toBe('es');
    });
  });
});
