import { describe, it, expect } from 'vitest';
import {
  extractStructure,
  reconstructHtml,
  buildTranslationPayload,
  applyTranslations,
  translatePreservingStructure
} from '../contentStructure';

describe('contentStructure — Structural Parser & Reconstructor', () => {
  it('handles HTML without any CTA correctly', () => {
    const html = '<p>First paragraph</p><p>Second paragraph</p>';
    const blocks = extractStructure(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: 'html', content: html });

    const rebuilt = reconstructHtml(blocks);
    expect(rebuilt).toBe(html);
  });

  it('extracts a CTA located between paragraphs', () => {
    const html = [
      '<p>Opening paragraph</p>',
      '<div data-type="cta" data-title="Quer saber mais?" data-description="Acesse o nosso guia." data-label="Ler Guia" data-url="https://exemplo.com" data-action=""></div>',
      '<p>Closing paragraph</p>'
    ].join('\n');

    const blocks = extractStructure(html);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('html');
    expect(blocks[1].type).toBe('cta');
    expect(blocks[2].type).toBe('html');

    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.title).toBe('Quer saber mais?');
      expect(blocks[1].attrs.description).toBe('Acesse o nosso guia.');
      expect(blocks[1].attrs.label).toBe('Ler Guia');
      expect(blocks[1].attrs.url).toBe('https://exemplo.com');
      expect(blocks[1].attrs.action).toBe('');
    }
  });

  it('preserves url, action, and node position while updating translatable text', () => {
    const html = [
      '<p>Texto 1</p>',
      '<div data-type="cta" data-title="Título PT" data-description="Desc PT" data-label="Botão PT" data-url="https://exemplo.com/path" data-action="custom_action"></div>',
      '<p>Texto 2</p>'
    ].join('\n');

    const blocks = extractStructure(html);
    const { segments, manifest } = buildTranslationPayload(blocks);

    expect(segments).toEqual([
      '<p>Texto 1</p>',
      'Título PT',
      'Desc PT',
      'Botão PT',
      '<p>Texto 2</p>'
    ]);

    // Simulated translated segments (e.g. into Spanish)
    const translatedSegments = [
      '<p>Texto 1 ES</p>',
      'Título ES',
      'Desc ES',
      'Botão ES',
      '<p>Texto 2 ES</p>'
    ];

    const translatedBlocks = applyTranslations(blocks, manifest, translatedSegments);
    const rebuilt = reconstructHtml(translatedBlocks);

    expect(rebuilt).toContain('<p>Texto 1 ES</p>');
    expect(rebuilt).toContain('<p>Texto 2 ES</p>');
    expect(rebuilt).toContain('data-title="Título ES"');
    expect(rebuilt).toContain('data-description="Desc ES"');
    expect(rebuilt).toContain('data-label="Botão ES"');
    // Crucial: url and action MUST be intact
    expect(rebuilt).toContain('data-url="https://exemplo.com/path"');
    expect(rebuilt).toContain('data-action="custom_action"');
  });

  it('translatePreservingStructure end-to-end preserves CTA structure', async () => {
    const originalHtml = '<p>P1</p><div data-type="cta" data-title="Title" data-description="Desc" data-label="Click" data-url="https://test.com" data-action=""></div><p>P2</p>';

    const mockTranslateFn = async (segments: string[]) => {
      return segments.map(s => s + ' [ES]');
    };

    const translatedHtml = await translatePreservingStructure(originalHtml, mockTranslateFn);

    expect(translatedHtml).toContain('<p>P1</p> [ES]');
    expect(translatedHtml).toContain('<p>P2</p> [ES]');
    expect(translatedHtml).toContain('data-title="Title [ES]"');
    expect(translatedHtml).toContain('data-description="Desc [ES]"');
    expect(translatedHtml).toContain('data-label="Click [ES]"');
    expect(translatedHtml).toContain('data-url="https://test.com"');
  });
});
