import { describe, it, expect } from 'vitest';
import { CtaEngine, calculateSemanticInsertionIndex, CTA_LIBRARY } from '../../services/CtaEngine';
import { extractStructure } from '../contentStructure';

describe('CtaEngine Unit Tests — CTAs de Relacionamento (Testemunho + Pedido de Oração)', () => {

  // ─── Fixtures ───────────────────────────────────────────────────────────────

  const sampleShort = [
    '<p>Primeiro parágrafo curto de reflexão.</p>',
    '<p>Segundo e último parágrafo de reflexão.</p>'
  ].join('\n');

  const sampleMedium = [
    '<p>Primeiro parágrafo de introdução.</p>',
    '<p>Segundo parágrafo desenvolvendo a ideia.</p>',
    '<p>Terceiro parágrafo com aplicação.</p>',
    '<p>Quarto parágrafo finalizando o pensamento.</p>'
  ].join('\n');

  const sampleLong = [
    '<p>Parágrafo 1 - Abertura</p>',
    '<p>Parágrafo 2 - Contexto histórico</p>',
    '<p>Parágrafo 3 - Dilema existencial</p>',
    '<p>Parágrafo 4 - Reflexão bíblica</p>',
    '<p>Parágrafo 5 - Aplicação ao cotidiano</p>',
    '<p>Parágrafo 6 - Desafio prático</p>',
    '<p>Parágrafo 7 - Conclusão</p>',
    '<p>Parágrafo 8 - Fechamento</p>'
  ].join('\n');

  const sampleSingleParagraph = '<p>Parágrafo único.</p>';

  const manualCtaHtml = [
    '<p>Primeiro parágrafo.</p>',
    '<div data-type="cta" data-title="CTA Manual Específico" data-description="Desc manual" data-label="Ação Manual" data-url="https://manual.com" data-action=""></div>',
    '<p>Segundo parágrafo.</p>'
  ].join('\n');

  // ─── 1. Regras de Posição Semântica ─────────────────────────────────────────

  describe('1. Regras de Posição Semântica', () => {
    it('calcula posição para textos curtos (1-2 parágrafos) ao final', () => {
      expect(calculateSemanticInsertionIndex(1)).toBe(1);
      expect(calculateSemanticInsertionIndex(2)).toBe(2);
    });

    it('calcula posição para textos médios (3-4 parágrafos) após o 2º parágrafo', () => {
      expect(calculateSemanticInsertionIndex(3)).toBe(2);
      expect(calculateSemanticInsertionIndex(4)).toBe(2);
    });

    it('calcula posição para textos de 5-7 parágrafos em ~60%', () => {
      expect(calculateSemanticInsertionIndex(5)).toBe(3);
      expect(calculateSemanticInsertionIndex(6)).toBe(3);
      expect(calculateSemanticInsertionIndex(7)).toBe(4);
    });

    it('calcula posição para textos de 8+ parágrafos em ~65%', () => {
      expect(calculateSemanticInsertionIndex(8)).toBe(5);
      expect(calculateSemanticInsertionIndex(10)).toBe(6);
    });
  });

  // ─── 2. CTA_LIBRARY — Definições e Classificação ────────────────────────────

  describe('2. CTA_LIBRARY — Definições e Classificação', () => {
    it('TESTIMONY é classificado como type=relationship e targetAudience=all', () => {
      const def = CTA_LIBRARY.TESTIMONY;
      expect(def.id).toBe('anonymous_testimony');
      expect(def.type).toBe('relationship');
      expect(def.action).toBe('testimony');
      expect(def.targetAudience).toBe('all');
    });

    it('PRAYER_REQUEST é classificado como type=relationship e targetAudience=all', () => {
      const def = CTA_LIBRARY.PRAYER_REQUEST;
      expect(def.id).toBe('anonymous_prayer_request');
      expect(def.type).toBe('relationship');
      expect(def.action).toBe('prayer_request');
      expect(def.targetAudience).toBe('all');
    });

    it('Nenhum CTA de relacionamento é classificado como auth_acquisition', () => {
      expect(CTA_LIBRARY.TESTIMONY.type).not.toBe('auth_acquisition');
      expect(CTA_LIBRARY.PRAYER_REQUEST.type).not.toBe('auth_acquisition');
    });

    it('TESTIMONY possui traduções para pt-BR, en e es', () => {
      const def = CTA_LIBRARY.TESTIMONY;
      expect(def.translations['pt-BR']).toBeDefined();
      expect(def.translations['en']).toBeDefined();
      expect(def.translations['es']).toBeDefined();
    });

    it('PRAYER_REQUEST possui traduções para pt-BR, en e es', () => {
      const def = CTA_LIBRARY.PRAYER_REQUEST;
      expect(def.translations['pt-BR']).toBeDefined();
      expect(def.translations['en']).toBeDefined();
      expect(def.translations['es']).toBeDefined();
    });

    it('Testemunho pt-BR não menciona publicação pública', () => {
      const text = JSON.stringify(CTA_LIBRARY.TESTIMONY.translations['pt-BR']);
      expect(text).not.toContain('inspirar');
      expect(text).not.toContain('abençoar');
      expect(text).not.toContain('outras pessoas');
    });
  });

  // ─── 3. Visibilidade Universal (Anônimo e Autenticado) ──────────────────────

  describe('3. Visibilidade dos CTAs de Relacionamento (Anônimo vs Autenticado)', () => {
    it('Visitante anônimo recebe exatamente 2 CTAs de relacionamento', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      if (ctaBlocks[0].type === 'cta') expect(ctaBlocks[0].attrs.action).toBe('testimony');
      if (ctaBlocks[1].type === 'cta') expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
    });

    it('Usuário autenticado TAMBÉM recebe os 2 CTAs de relacionamento (visibilidade universal)', () => {
      const output = CtaEngine.composeReflection(sampleMedium, {
        user: { id: 'user-123', email: 'auth@test.com' },
        language: 'pt-BR'
      });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      if (ctaBlocks[0].type === 'cta') expect(ctaBlocks[0].attrs.action).toBe('testimony');
      if (ctaBlocks[1].type === 'cta') expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
    });

    it('Ordem obrigatória: Testemunho seguido de Pedido de Oração', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      if (ctaBlocks[0].type === 'cta' && ctaBlocks[1].type === 'cta') {
        expect(ctaBlocks[0].attrs.action).toBe('testimony');
        expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
      }
    });
  });

  // ─── 4. PT-BR ────────────────────────────────────────────────────────────────

  describe('4. Internacionalização — PT-BR', () => {
    it('Ambos os CTAs em português para pt-BR', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      expect(output).toContain('Como essa reflexão tocou você?');
      expect(output).toContain('Compartilhar meu testemunho');
      expect(output).toContain('Podemos orar por você?');
      expect(output).toContain('Enviar meu pedido de oração');
    });

    it('Textos pt-BR não afirmam publicação do testemunho', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      expect(output).not.toContain('inspirar e abençoar');
      expect(output).not.toContain('outras pessoas que estão na mesma jornada');
    });
  });

  // ─── 5. EN ───────────────────────────────────────────────────────────────────

  describe('5. Internacionalização — EN', () => {
    it('Ambos os CTAs em inglês para language=en', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en' });
      expect(output).toContain('How did this reflection speak to you?');
      expect(output).toContain('Share my testimony');
      expect(output).toContain('Can we pray for you?');
      expect(output).toContain('Send my prayer request');
    });

    it('Nenhum texto português aparece no modo en', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en' });
      expect(output).not.toContain('Como essa reflexão');
      expect(output).not.toContain('Podemos orar');
      expect(output).not.toContain('Compartilhar meu testemunho');
    });

    it('en-US é mapeado para inglês', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en-US' });
      expect(output).toContain('How did this reflection speak to you?');
      expect(output).toContain('Can we pray for you?');
      expect(output).not.toContain('Como essa reflexão');
    });
  });

  // ─── 6. ES ───────────────────────────────────────────────────────────────────

  describe('6. Internacionalização — ES', () => {
    it('Ambos os CTAs em espanhol para language=es', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es' });
      expect(output).toContain('¿Cómo te habló esta reflexión?');
      expect(output).toContain('Compartir mi testimonio');
      expect(output).toContain('¿Podemos orar por ti?');
      expect(output).toContain('Enviar mi petición de oración');
    });

    it('Nenhum texto português aparece no modo es', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es' });
      expect(output).not.toContain('Como essa reflexão');
      expect(output).not.toContain('Podemos orar por você');
      expect(output).not.toContain('Compartilhar meu testemunho');
    });

    it('es-ES é mapeado para espanhol', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es-ES' });
      expect(output).toContain('¿Cómo te habló esta reflexión?');
      expect(output).toContain('¿Podemos orar por ti?');
      expect(output).not.toContain('Como essa reflexão');
    });
  });

  // ─── 7. CTA Manual ───────────────────────────────────────────────────────────

  describe('7. Prevenção de Duplicidade — CTA Manual', () => {
    it('CTA manual existente permanece; nenhum CTA automático adicional é inserido', () => {
      const output = CtaEngine.composeReflection(manualCtaHtml, { user: null, language: 'pt-BR' });
      expect(output).toContain('CTA Manual Específico');
      expect(output).not.toContain('Como essa reflexão tocou você?');
      expect(output).not.toContain('Podemos orar por você?');
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('CTA Manual Específico');
      }
    });

    it('CTA manual é preservado também para usuário autenticado', () => {
      const output = CtaEngine.composeReflection(manualCtaHtml, { user: { id: 'u1' }, language: 'pt-BR' });
      expect(output).toContain('CTA Manual Específico');
      expect(output).not.toContain('Como essa reflexão tocou você?');
      const blocks = extractStructure(output);
      expect(blocks.filter(b => b.type === 'cta')).toHaveLength(1);
    });
  });

  // ─── 8. Conteúdo Curto ───────────────────────────────────────────────────────

  describe('8. Posicionamento — Conteúdo Curto', () => {
    it('Parágrafo único: ambos os CTAs aparecem ao final', () => {
      const output = CtaEngine.composeReflection(sampleSingleParagraph, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      const lastHtmlIndex = blocks.reduce((acc, b, i) => b.type === 'html' ? i : acc, -1);
      const firstCtaIndex = blocks.findIndex(b => b.type === 'cta');
      expect(firstCtaIndex).toBeGreaterThan(lastHtmlIndex);
    });

    it('2 parágrafos: ambos os CTAs aparecem ao final', () => {
      const output = CtaEngine.composeReflection(sampleShort, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      expect(blocks.filter(b => b.type === 'cta')).toHaveLength(2);
    });
  });

  // ─── 9. Conteúdo Longo ───────────────────────────────────────────────────────

  describe('9. Posicionamento — Conteúdo Longo (8 parágrafos)', () => {
    it('Os dois CTAs são inseridos juntos em ~65% do conteúdo', () => {
      const output = CtaEngine.composeReflection(sampleLong, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);

      expect(blocks.length).toBe(4);
      expect(blocks[0].type).toBe('html');
      expect(blocks[1].type).toBe('cta');
      expect(blocks[2].type).toBe('cta');
      expect(blocks[3].type).toBe('html');

      if (blocks[0].type === 'html') {
        expect(blocks[0].content).toContain('Parágrafo 1');
        expect(blocks[0].content).toContain('Parágrafo 5');
        expect(blocks[0].content).not.toContain('Parágrafo 6');
      }
      if (blocks[3].type === 'html') {
        expect(blocks[3].content).toContain('Parágrafo 6');
        expect(blocks[3].content).toContain('Parágrafo 8');
      }
    });

    it('Os dois CTAs são consecutivos (mesmo ponto semântico)', () => {
      const output = CtaEngine.composeReflection(sampleLong, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaIndices = blocks.reduce<number[]>((acc, b, i) => b.type === 'cta' ? [...acc, i] : acc, []);
      expect(ctaIndices.length).toBe(2);
      expect(ctaIndices[1] - ctaIndices[0]).toBe(1);
    });
  });

  // ─── 10. Estrutura Completa via extractStructure ─────────────────────────────

  describe('10. Verificação Estrutural — extractStructure', () => {
    it('extractStructure identifica os dois CTAs individualmente', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      expect(blocks.filter(b => b.type === 'cta')).toHaveLength(2);
    });

    it('Atributos do CTA de testemunho são preservados', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const testimony = blocks.find(b => b.type === 'cta' && b.attrs.action === 'testimony');
      expect(testimony).toBeDefined();
      if (testimony?.type === 'cta') {
        expect(testimony.attrs.title).toBe('Como essa reflexão tocou você?');
        expect(testimony.attrs.description).toContain('Seu relato pode ajudar nossa equipe');
        expect(testimony.attrs.label).toBe('Compartilhar meu testemunho');
      }
    });

    it('Atributos do CTA de pedido de oração são preservados', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const prayer = blocks.find(b => b.type === 'cta' && b.attrs.action === 'prayer_request');
      expect(prayer).toBeDefined();
      if (prayer?.type === 'cta') {
        expect(prayer.attrs.title).toBe('Podemos orar por você?');
        expect(prayer.attrs.label).toBe('Enviar meu pedido de oração');
      }
    });
  });

  // ─── 11. composeBlocks ───────────────────────────────────────────────────────

  describe('11. composeBlocks — composição em nível de bloco', () => {
    it('Insere os dois CTAs consecutivos para visitante anônimo', () => {
      const htmlBlocks = [
        { type: 'html' as const, content: '<p>P1</p>' },
        { type: 'html' as const, content: '<p>P2</p>' },
        { type: 'html' as const, content: '<p>P3</p>' },
        { type: 'html' as const, content: '<p>P4</p>' },
      ];
      const composed = CtaEngine.composeBlocks(htmlBlocks, { user: null, language: 'pt-BR' });
      const ctaBlocks = composed.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      if (ctaBlocks[0].type === 'cta' && ctaBlocks[1].type === 'cta') {
        expect(ctaBlocks[0].attrs.action).toBe('testimony');
        expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
      }
    });

    it('Insere os dois CTAs consecutivos também para usuário autenticado', () => {
      const htmlBlocks = [
        { type: 'html' as const, content: '<p>P1</p>' },
        { type: 'html' as const, content: '<p>P2</p>' },
      ];
      const composed = CtaEngine.composeBlocks(htmlBlocks, { user: { id: 'u1' }, language: 'pt-BR' });
      const ctaBlocks = composed.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
    });

    it('Preserva CTA manual e não insere automáticos via composeBlocks', () => {
      const blocksWithManual = [
        { type: 'html' as const, content: '<p>P1</p>' },
        { type: 'cta' as const, attrs: { title: 'Manual', description: '', label: 'Click', url: '', action: '' }, index: 0 },
        { type: 'html' as const, content: '<p>P2</p>' },
      ];
      const composed = CtaEngine.composeBlocks(blocksWithManual, { user: null, language: 'pt-BR' });
      const ctaBlocks = composed.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('Manual');
      }
    });
  });
});
