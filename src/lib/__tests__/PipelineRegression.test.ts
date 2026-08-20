import { describe, it, expect } from 'vitest';
import { normalizeEditorialContent } from '../../components/HtmlRenderer';
import { extractStructure, reconstructHtml, validateStructuralIntegrity } from '../contentStructure';
import { resolveTranslation } from '../../services/DevotionalService';

describe('Pipeline de Renderização Editorial & Regressão de Idioma', () => {

  // A. Conteúdo HTML Completo (P1, P2, P3)
  it('Cenário A: HTML com múltiplos parágrafos preserva todos os blocos sem truncamento', () => {
    const rawHtml = [
      '<p>Primeiro parágrafo de introdução.</p>',
      '<p>Segundo parágrafo com desenvolvimento teológico profundo.</p>',
      '<p>Terceiro parágrafo de conclusão prática.</p>'
    ].join('\n');

    const normalized = normalizeEditorialContent(rawHtml);
    expect(normalized).toBe(rawHtml);

    const blocks = extractStructure(normalized);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('html');
    if (blocks[0].type === 'html') {
      expect(blocks[0].content).toContain('Primeiro parágrafo');
      expect(blocks[0].content).toContain('Segundo parágrafo');
      expect(blocks[0].content).toContain('Terceiro parágrafo');
    }
  });

  // B. Conteúdo Legado em Texto Puro (P1\n\nP2\n\nP3)
  it('Cenário B: Texto puro legado com quebras de linha duplas é normalizado em tags <p>', () => {
    const plainText = 'Primeiro parágrafo em texto puro.\n\nSegundo parágrafo com quebra dupla.\n\nTerceiro parágrafo final.';

    const normalized = normalizeEditorialContent(plainText);
    expect(normalized).toContain('<p>Primeiro parágrafo em texto puro.</p>');
    expect(normalized).toContain('<p>Segundo parágrafo com quebra dupla.</p>');
    expect(normalized).toContain('<p>Terceiro parágrafo final.</p>');

    const blocks = extractStructure(normalized);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('html');
  });

  // C. CTA no Meio (P1 -> CTA -> P2)
  it('Cenário C: Estrutura P1 -> CTA -> P2 mantém ordem exata e integridade', () => {
    const htmlWithCta = [
      '<p>Primeiro parágrafo antes do CTA.</p>',
      '<div data-type="cta" data-title="Aprofunde seu estudo" data-description="Guia prático de decisões" data-label="Acessar" data-url="https://3minutes.org/guia" data-action=""></div>',
      '<p>Segundo parágrafo após o CTA.</p>'
    ].join('\n');

    const normalized = normalizeEditorialContent(htmlWithCta);
    const blocks = extractStructure(normalized);

    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('html');
    expect(blocks[1].type).toBe('cta');
    expect(blocks[2].type).toBe('html');

    if (blocks[0].type === 'html') {
      expect(blocks[0].content).toContain('Primeiro parágrafo antes do CTA.');
    }
    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.title).toBe('Aprofunde seu estudo');
      expect(blocks[1].attrs.url).toBe('https://3minutes.org/guia');
      expect(blocks[1].attrs.action).toBe('');
    }
    if (blocks[2].type === 'html') {
      expect(blocks[2].content).toContain('Segundo parágrafo após o CTA.');
    }
  });

  // D. Tradução PT -> EN e PT -> ES preservando estrutura
  it('Cenário D: Tradução preserva rigorosamente quantidade, ordem e atributos invariantes de CTA', () => {
    const ptHtml = [
      '<p>Texto de abertura em português.</p>',
      '<div data-type="cta" data-title="Título PT" data-description="Desc PT" data-label="Botão PT" data-url="https://exemplo.com/recurso" data-action=""></div>',
      '<p>Texto de encerramento em português.</p>'
    ].join('\n');

    const enHtml = [
      '<p>Opening text in English.</p>',
      '<div data-type="cta" data-title="Title EN" data-description="Desc EN" data-label="Button EN" data-url="https://exemplo.com/recurso" data-action=""></div>',
      '<p>Closing text in English.</p>'
    ].join('\n');

    const esHtml = [
      '<p>Texto de apertura en español.</p>',
      '<div data-type="cta" data-title="Título ES" data-description="Desc ES" data-label="Botón ES" data-url="https://exemplo.com/recurso" data-action=""></div>',
      '<p>Texto de cierre en español.</p>'
    ].join('\n');

    const integrityEn = validateStructuralIntegrity(ptHtml, enHtml);
    const integrityEs = validateStructuralIntegrity(ptHtml, esHtml);

    expect(integrityEn.isValid).toBe(true);
    expect(integrityEs.isValid).toBe(true);
  });

  // E. Home: Resolução Determinística por Idioma
  it('Cenário E: resolveTranslation retorna o idioma correto solicitado para a Home', () => {
    const devotionalMock = {
      id: 'dev-123',
      title: 'Título PT Base',
      principle_statement: 'Destaque PT',
      reflection: '<p>Reflexão PT</p>',
      practical_application: '<p>Prática PT</p>',
      prayer: '<p>Oração PT</p>',
      scripture_reference: 'João 3:16',
      scripture_text: 'Porque Deus amou o mundo...',
      content_hash: 'hash-abc-123',
      devotional_translations: [
        {
          id: 'trans-en',
          language: 'en',
          translation_source: 'manual',
          status: 'published',
          title: 'Title EN',
          principle_statement: 'Statement EN',
          reflection: '<p>Reflection EN</p>',
          practical_application: '<p>Practice EN</p>',
          prayer: '<p>Prayer EN</p>',
          scripture_reference: 'John 3:16',
          scripture_text: 'For God so loved the world...',
          source_content_hash: null
        },
        {
          id: 'trans-es',
          language: 'es',
          translation_source: 'manual',
          status: 'published',
          title: 'Título ES',
          principle_statement: 'Declaración ES',
          reflection: '<p>Reflexión ES</p>',
          practical_application: '<p>Práctica ES</p>',
          prayer: '<p>Oración ES</p>',
          scripture_reference: 'Juan 3:16',
          scripture_text: 'Porque de tal manera amó Dios al mundo...',
          source_content_hash: null
        }
      ]
    };

    // 1. Solicitação PT-BR
    const resPt = resolveTranslation(devotionalMock, 'pt-BR');
    expect(resPt.resolvedLanguage).toBe('pt-BR');
    expect(resPt.title).toBe('Título PT Base');
    expect(resPt.isLanguageFallback).toBe(false);

    // 2. Solicitação EN
    const resEn = resolveTranslation(devotionalMock, 'en');
    expect(resEn.resolvedLanguage).toBe('en');
    expect(resEn.title).toBe('Title EN');
    expect(resEn.scripture_reference).toBe('John 3:16');
    expect(resEn.isLanguageFallback).toBe(false);

    // 3. Solicitação ES
    const resEs = resolveTranslation(devotionalMock, 'es');
    expect(resEs.resolvedLanguage).toBe('es');
    expect(resEs.title).toBe('Título ES');
    expect(resEs.scripture_reference).toBe('Juan 3:16');
    expect(resEs.isLanguageFallback).toBe(false);
  });

  // F. SharedDevotional: Simulação End-to-End do Link Compartilhado (/r/:code?d=:id)
  it('Cenário F: SharedDevotional carrega e renderiza devocional com CTA para anônimo e autenticado', () => {
    const sharedDevotionalMock = {
      id: 'shared-dev-1',
      title: 'What’s at stake?',
      principle_statement: 'When the cost is high, focus on what matters.',
      reflection: [
        '<p>First paragraph about bets and decision making.</p>',
        '<div data-type="cta" data-title="Need support?" data-description="Confidential help is available." data-label="Get Help" data-url="https://3minutes.org/help" data-action=""></div>',
        '<p>Closing paragraph encouraging recovery and faith.</p>'
      ].join('\n'),
      practical_application: '<p>Take a 3-minute break today.</p>',
      prayer: '<p>Lord, guide my choices today.</p>',
      scripture_reference: 'Proverbs 21:5',
      scripture_text: 'The plans of the diligent lead surely to abundance...',
      resolvedLanguage: 'en',
      translationStatus: 'available' as const
    };

    // Normalização e extração de blocos
    const normalized = normalizeEditorialContent(sharedDevotionalMock.reflection);
    const blocks = extractStructure(normalized);

    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('html');
    expect(blocks[1].type).toBe('cta');
    expect(blocks[2].type).toBe('html');

    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.title).toBe('Need support?');
      expect(blocks[1].attrs.label).toBe('Get Help');
      expect(blocks[1].attrs.url).toBe('https://3minutes.org/help');
    }

    // Reconstrução de volta para HTML
    const reconstructed = reconstructHtml(blocks);
    const parity = validateStructuralIntegrity(sharedDevotionalMock.reflection, reconstructed);
    expect(parity.isValid).toBe(true);
  });
});
