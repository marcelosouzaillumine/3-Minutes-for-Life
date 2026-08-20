import { describe, it, expect } from 'vitest';
import {
  extractStructure,
  reconstructHtml,
  buildTranslationPayload,
  applyTranslations,
  translatePreservingStructure,
  validateStructuralIntegrity
} from '../contentStructure';

describe('Editorial Integrity Gate — Tradução & Invariantes de CTA', () => {

  // 1. CTA original → EN: CTA permanece na mesma posição
  it('Cenário 1: CTA original -> EN permanece exatamente na mesma posição entre parágrafos', async () => {
    const originalPt = [
      '<p>Parágrafo 1 de abertura em português.</p>',
      '<div data-type="cta" data-title="Quer se aprofundar?" data-description="Leia nosso conteúdo exclusivo." data-label="Acessar" data-url="https://exemplo.com/guia" data-action=""></div>',
      '<p>Parágrafo 2 de fechamento em português.</p>'
    ].join('\n');

    const mockTranslateToEn = async (segments: string[]) => {
      const dict: Record<string, string> = {
        '<p>Parágrafo 1 de abertura em português.</p>': '<p>Opening paragraph 1 in English.</p>',
        'Quer se aprofundar?': 'Want to dive deeper?',
        'Leia nosso conteúdo exclusivo.': 'Read our exclusive content.',
        'Acessar': 'Access Now',
        '<p>Parágrafo 2 de fechamento em português.</p>': '<p>Closing paragraph 2 in English.</p>'
      };
      return segments.map(s => dict[s] || s);
    };

    const translatedEn = await translatePreservingStructure(originalPt, mockTranslateToEn);
    const integrity = validateStructuralIntegrity(originalPt, translatedEn);

    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);

    const blocks = extractStructure(translatedEn);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: 'html', content: '<p>Opening paragraph 1 in English.</p>' });
    expect(blocks[1].type).toBe('cta');
    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.title).toBe('Want to dive deeper?');
      expect(blocks[1].attrs.description).toBe('Read our exclusive content.');
      expect(blocks[1].attrs.label).toBe('Access Now');
      expect(blocks[1].attrs.url).toBe('https://exemplo.com/guia'); // Invariant
    }
    expect(blocks[2]).toEqual({ type: 'html', content: '<p>Closing paragraph 2 in English.</p>' });
  });

  // 2. CTA original → ES: CTA permanece na mesma posição
  it('Cenário 2: CTA original -> ES permanece exatamente na mesma posição entre parágrafos', async () => {
    const originalPt = [
      '<p>Primer párrafo en portugués.</p>',
      '<div data-type="cta" data-title="Título PT" data-description="Desc PT" data-label="Botão PT" data-url="https://exemplo.com/es" data-action=""></div>',
      '<p>Segundo párrafo en portugués.</p>'
    ].join('\n');

    const mockTranslateToEs = async (segments: string[]) => {
      const dict: Record<string, string> = {
        '<p>Primer párrafo en portugués.</p>': '<p>Primer párrafo en español.</p>',
        'Título PT': 'Título ES',
        'Desc PT': 'Descripción ES',
        'Botão PT': 'Botón ES',
        '<p>Segundo párrafo en portugués.</p>': '<p>Segundo párrafo en español.</p>'
      };
      return segments.map(s => dict[s] || s);
    };

    const translatedEs = await translatePreservingStructure(originalPt, mockTranslateToEs);
    const integrity = validateStructuralIntegrity(originalPt, translatedEs);

    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);

    const blocks = extractStructure(translatedEs);
    expect(blocks[1].type).toBe('cta');
    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.title).toBe('Título ES');
      expect(blocks[1].attrs.url).toBe('https://exemplo.com/es');
    }
  });

  // 3. URL nunca é traduzida ou modificada
  it('Cenário 3: URL nunca é traduzida, mesmo que contenha palavras que pareçam texto', async () => {
    const original = '<p>Texto</p><div data-type="cta" data-title="Save" data-description="Description" data-label="Click" data-url="https://app.com/share/profile/read-book" data-action=""></div>';

    const mockTranslator = async (segments: string[]) => segments.map(s => s.toUpperCase());
    const result = await translatePreservingStructure(original, mockTranslator);

    const blocks = extractStructure(result);
    const cta = blocks.find(b => b.type === 'cta');
    expect(cta?.type).toBe('cta');
    if (cta?.type === 'cta') {
      expect(cta.attrs.url).toBe('https://app.com/share/profile/read-book');
    }
  });

  // 4. Action nunca é traduzida ou modificada
  it('Cenário 4: Action interna (ex: share, save) nunca é traduzida', async () => {
    const original = '<p>Texto</p><div data-type="cta" data-title="Compartilhe" data-description="Envie aos amigos" data-label="Compartilhar" data-url="" data-action="share"></div>';

    const mockTranslator = async (segments: string[]) => segments.map(s => s + ' [TRANSLATED]');
    const result = await translatePreservingStructure(original, mockTranslator);

    const blocks = extractStructure(result);
    const cta = blocks.find(b => b.type === 'cta');
    expect(cta?.type).toBe('cta');
    if (cta?.type === 'cta') {
      expect(cta.attrs.action).toBe('share'); // NOT 'share [TRANSLATED]'
      expect(cta.attrs.title).toBe('Compartilhe [TRANSLATED]');
      expect(cta.attrs.label).toBe('Compartilhar [TRANSLATED]');
    }
  });

  // 5. Múltiplos CTAs: ordem e contagem estritamente preservadas
  it('Cenário 5: Múltiplos CTAs mantêm contagem, ordem e atributos invariantes intactos', async () => {
    const original = [
      '<p>Seção 1</p>',
      '<div data-type="cta" data-title="CTA 1" data-description="D1" data-label="L1" data-url="https://cta1.com" data-action=""></div>',
      '<p>Seção 2</p>',
      '<div data-type="cta" data-title="CTA 2" data-description="D2" data-label="L2" data-url="" data-action="action_two"></div>',
      '<p>Seção 3</p>',
      '<div data-type="cta" data-title="CTA 3" data-description="D3" data-label="L3" data-url="https://cta3.com" data-action=""></div>',
      '<p>Fim</p>'
    ].join('\n');

    const result = await translatePreservingStructure(original, async (s) => s.map(x => `TR_${x}`));
    const integrity = validateStructuralIntegrity(original, result);

    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);

    const blocks = extractStructure(result);
    const ctas = blocks.filter((b): b is { type: 'cta'; attrs: any; index: number } => b.type === 'cta');

    expect(ctas).toHaveLength(3);
    expect(ctas[0].attrs.url).toBe('https://cta1.com');
    expect(ctas[1].attrs.action).toBe('action_two');
    expect(ctas[2].attrs.url).toBe('https://cta3.com');
  });

  // 6. CTA sem tradução: bloco continua visível com atributos estruturais
  it('Cenário 6: CTA com textos vazios na tradução preserva posição e estrutura', () => {
    const original = '<p>P1</p><div data-type="cta" data-title="Titulo" data-description="Desc" data-label="Botao" data-url="https://link.com" data-action=""></div><p>P2</p>';
    const blocks = extractStructure(original);
    const { manifest } = buildTranslationPayload(blocks);

    // Simulated translation where translator returned empty strings for CTA
    const emptyCtaTranslations = ['<p>P1 Traduzido</p>', '', '', '', '<p>P2 Traduzido</p>'];
    const translatedBlocks = applyTranslations(blocks, manifest, emptyCtaTranslations);
    const rebuilt = reconstructHtml(translatedBlocks);

    const integrity = validateStructuralIntegrity(original, rebuilt);
    expect(integrity.isValid).toBe(true);

    const parsed = extractStructure(rebuilt);
    expect(parsed).toHaveLength(3);
    expect(parsed[1].type).toBe('cta');
    if (parsed[1].type === 'cta') {
      expect(parsed[1].attrs.title).toBe('');
      expect(parsed[1].attrs.url).toBe('https://link.com'); // Structural URL is still preserved!
    }
  });

  // 7. CTA no início do conteúdo (index 0)
  it('Cenário 7: CTA no topo do conteúdo (antes do primeiro parágrafo) é preservado', async () => {
    const original = '<div data-type="cta" data-title="Destaque Inicial" data-description="Sub" data-label="Ver" data-url="https://inicio.com" data-action=""></div><p>Parágrafo subsequente</p>';

    const result = await translatePreservingStructure(original, async (s) => s.map(x => `ES_${x}`));
    const integrity = validateStructuralIntegrity(original, result);

    expect(integrity.isValid).toBe(true);

    const blocks = extractStructure(result);
    expect(blocks[0].type).toBe('cta');
    expect(blocks[1].type).toBe('html');
  });

  // 8. CTA no final do conteúdo (último elemento)
  it('Cenário 8: CTA no final do conteúdo (após último parágrafo) é preservado', async () => {
    const original = '<p>Primeiro parágrafo</p><p>Segundo parágrafo</p><div data-type="cta" data-title="Destaque Final" data-description="Fim" data-label="Finalizar" data-url="https://fim.com" data-action=""></div>';

    const result = await translatePreservingStructure(original, async (s) => s.map(x => `ES_${x}`));
    const integrity = validateStructuralIntegrity(original, result);

    expect(integrity.isValid).toBe(true);

    const blocks = extractStructure(result);
    expect(blocks[0].type).toBe('html');
    expect(blocks[1].type).toBe('cta');
    if (blocks[1].type === 'cta') {
      expect(blocks[1].attrs.url).toBe('https://fim.com');
    }
  });

  // 9. HTML Legado sem qualquer CTA
  it('Cenário 9: HTML legado tradicional (apenas <p>, <em>) funciona perfeitamente', async () => {
    const legacyHtml = '<p>Este é um devocional legado sem nenhum CTA.</p><p><em>Segundo parágrafo com ênfase.</em></p>';

    const result = await translatePreservingStructure(legacyHtml, async (s) => s.map(x => x.replace('devocional', 'devotional')));
    const integrity = validateStructuralIntegrity(legacyHtml, result);

    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);

    const blocks = extractStructure(result);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('html');
    if (blocks[0].type === 'html') {
      expect(blocks[0].content).toContain('devotional');
    }
  });

  // 10. Detecção de violação estrutural pelo Gate
  it('Cenário 10: validateStructuralIntegrity detecta e rejeita corrupção estrutural (remoção, adulteração de URL)', () => {
    const original = '<p>P1</p><div data-type="cta" data-title="T" data-description="D" data-label="L" data-url="https://seguro.com" data-action=""></div><p>P2</p>';
    
    // Corrupted 1: CTA removed
    const corruptedNoCta = '<p>P1</p><p>P2</p>';
    const check1 = validateStructuralIntegrity(original, corruptedNoCta);
    expect(check1.isValid).toBe(false);
    expect(check1.errors.some(e => e.includes('CTA count mismatch'))).toBe(true);

    // Corrupted 2: URL altered
    const corruptedBadUrl = '<p>P1</p><div data-type="cta" data-title="T" data-description="D" data-label="L" data-url="https://hacker.com" data-action=""></div><p>P2</p>';
    const check2 = validateStructuralIntegrity(original, corruptedBadUrl);
    expect(check2.isValid).toBe(false);
    expect(check2.errors.some(e => e.includes('CTA URL mismatch'))).toBe(true);
  });

  // 11. Teste Canônico de Round-Trip Completo
  it('Cenário 11: Round-Trip Canônico Completo (Original -> AST -> Tradução -> Reconstrução -> AST -> Invariantes)', async () => {
    const canonicalOriginal = [
      '<p>A vida oferece momentos para refletir e parar.</p>',
      '<div data-type="cta" data-title="Guia Prático" data-description="Descubra novos princípios para seu dia." data-label="Acessar Guia" data-url="https://3minutes.org/guia" data-action=""></div>',
      '<p>Quando aprendemos a priorizar o essencial, tudo ganha sentido.</p>',
      '<div data-type="cta" data-title="Participe da Comunidade" data-description="Compartilhe sua jornada com outras pessoas." data-label="Entrar" data-url="" data-action="join_community"></div>',
      '<p>Que seu dia seja pleno de clareza e paz.</p>'
    ].join('\n');

    // Step 1: Parse Original AST
    const astOriginal = extractStructure(canonicalOriginal);
    expect(astOriginal).toHaveLength(5);

    // Step 2: Translation Payload
    const { segments, manifest } = buildTranslationPayload(astOriginal);
    expect(segments).toHaveLength(9); // 3 html blocks + 2 CTAs * 3 text fields each = 3 + 6 = 9 segments

    // Step 3: Simulated AI Translator into Spanish
    const simulatedTranslations = segments.map((seg) => {
      if (seg.startsWith('<p>')) return seg.replace('A vida', 'La vida').replace('Quando', 'Cuando').replace('Que seu dia', 'Que tu día');
      return `[ES] ${seg}`;
    });

    // Step 4: Reconstruct Translated HTML
    const astTranslated = applyTranslations(astOriginal, manifest, simulatedTranslations);
    const reconstructedHtml = reconstructHtml(astTranslated);

    // Step 5: Re-parse Translated HTML into fresh AST
    const astRoundTrip = extractStructure(reconstructedHtml);

    // Step 6: Structural Parity Invariants
    expect(astRoundTrip).toHaveLength(astOriginal.length);

    astOriginal.forEach((origBlock, index) => {
      const transBlock = astRoundTrip[index];
      expect(transBlock.type).toBe(origBlock.type);

      if (origBlock.type === 'cta' && transBlock.type === 'cta') {
        // Strict Invariants:
        expect(transBlock.attrs.url).toBe(origBlock.attrs.url);
        expect(transBlock.attrs.action).toBe(origBlock.attrs.action);
        expect(transBlock.index).toBe(origBlock.index);
        // Translated content changed correctly:
        expect(transBlock.attrs.title).toContain('[ES]');
        expect(transBlock.attrs.label).toContain('[ES]');
      }
    });

    // Step 7: Final Structural Integrity Gate
    const gateResult = validateStructuralIntegrity(canonicalOriginal, reconstructedHtml);
    expect(gateResult.isValid).toBe(true);
    expect(gateResult.errors).toHaveLength(0);
  });
});
