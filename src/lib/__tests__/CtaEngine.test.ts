import { describe, it, expect } from 'vitest';
import { CtaEngine, calculateSemanticInsertionIndex, CTA_LIBRARY } from '../../services/CtaEngine';
import { extractStructure } from '../contentStructure';

describe('CtaEngine Unit Tests — CTA de Captação e Continuidade no Meio da Reflexão', () => {

  // ─── Fixtures ───────────────────────────────────────────────────────────────

  const sampleShort = [
    '<p>Primeiro parágrafo curto de reflexão.</p>',
    '<p>Segundo e último parágrafo de reflexão.</p>'
  ].join('\n');

  const sampleMedium = [
    '<p>Primeiro parágrafo de introdução.</p>',
    '<p>Segundo parágrafo desenvolvendo a ideia.</p>',
    '<p>Terceiro parágrafo com aplicação prática.</p>',
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

  // ─── 2. CTA_LIBRARY — Definição de Captação ────────────────────────────────

  describe('2. CTA_LIBRARY — Definição de Captação/Continuidade', () => {
    it('ANONYMOUS_ACQUISITION é classificado como type=auth_acquisition e targetAudience=anonymous', () => {
      const def = CTA_LIBRARY.ANONYMOUS_ACQUISITION;
      expect(def.id).toBe('anonymous_acquisition');
      expect(def.type).toBe('auth_acquisition');
      expect(def.targetAudience).toBe('anonymous');
      expect(def.url).toBe('/signup');
    });

    it('ANONYMOUS_ACQUISITION possui traduções para pt-BR, en e es', () => {
      const def = CTA_LIBRARY.ANONYMOUS_ACQUISITION;
      expect(def.translations['pt-BR']).toBeDefined();
      expect(def.translations['en']).toBeDefined();
      expect(def.translations['es']).toBeDefined();
    });

    it('CtaEngine NÃO contém Testemunho ou Oração como CTAs de reflexão', () => {
      expect(CTA_LIBRARY.TESTIMONY).toBeUndefined();
      expect(CTA_LIBRARY.PRAYER_REQUEST).toBeUndefined();
    });
  });

  // ─── 3. Segmentação de Audiência (Anônimo vs Autenticado) ───────────────────

  describe('3. Segmentação de Audiência (Anônimo vs Autenticado)', () => {
    it('Visitante anônimo recebe exatamente 1 CTA de captação no meio da reflexão', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('Continue essa jornada com a gente.');
        expect(ctaBlocks[0].attrs.label).toBe('Quero continuar');
        expect(ctaBlocks[0].attrs.url).toBe('/signup');
      }
    });

    it('Usuário autenticado NÃO recebe CTA de captação no meio da reflexão', () => {
      const output = CtaEngine.composeReflection(sampleMedium, {
        user: { id: 'user-123', email: 'auth@test.com' },
        language: 'pt-BR'
      });
      expect(output).not.toContain('data-type="cta"');
      expect(output).toBe(sampleMedium);
      const blocks = extractStructure(output);
      expect(blocks.some(b => b.type === 'cta')).toBe(false);
    });

    it('CtaEngine NÃO injeta Testemunho nem Pedido de Oração dentro da reflexão', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      expect(output).not.toContain('Como essa reflexão tocou você?');
      expect(output).not.toContain('Podemos orar por você?');
      expect(output).not.toContain('Compartilhar meu testemunho');
      expect(output).not.toContain('Enviar meu pedido de oração');
    });
  });

  // ─── 4. Internacionalização — PT-BR ─────────────────────────────────────────

  describe('4. Internacionalização — PT-BR', () => {
    it('CTA de captação em português para pt-BR', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'pt-BR' });
      expect(output).toContain('Continue essa jornada com a gente.');
      expect(output).toContain('Amanhã, uma nova reflexão espera por você. Entre ou crie sua conta para guardar suas anotações e acompanhar sua jornada.');
      expect(output).toContain('Quero continuar');
    });
  });

  // ─── 5. Internacionalização — EN ─────────────────────────────────────────────

  describe('5. Internacionalização — EN', () => {
    it('CTA de captação em inglês para language=en', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en' });
      expect(output).toContain('Continue this journey with us.');
      expect(output).toContain('Tomorrow, a fresh reflection awaits you. Sign in or create your account to save personal notes and track your journey.');
      expect(output).toContain('Keep going');
    });

    it('Nenhum texto português aparece no modo en', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en' });
      expect(output).not.toContain('Continue essa jornada com a gente.');
      expect(output).not.toContain('Quero continuar');
    });

    it('en-US é mapeado para inglês', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'en-US' });
      expect(output).toContain('Continue this journey with us.');
      expect(output).toContain('Keep going');
      expect(output).not.toContain('Continue essa jornada com a gente.');
    });
  });

  // ─── 6. Internacionalização — ES ─────────────────────────────────────────────

  describe('6. Internacionalização — ES', () => {
    it('CTA de captação em espanhol para language=es', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es' });
      expect(output).toContain('Continúa este camino con nosotros.');
      expect(output).toContain('Mañana, una nueva reflexión te espera. Inicia sesión o crea tu cuenta para guardar tus notas y seguir tu camino.');
      expect(output).toContain('Quiero continuar');
    });

    it('Nenhum texto português aparece no modo es', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es' });
      expect(output).not.toContain('Continue essa jornada com a gente.');
      expect(output).not.toContain('Quero continuar');
    });

    it('es-ES é mapeado para espanhol', () => {
      const output = CtaEngine.composeReflection(sampleMedium, { user: null, language: 'es-ES' });
      expect(output).toContain('Continúa este camino con nosotros.');
      expect(output).toContain('Quiero continuar');
      expect(output).not.toContain('Continue essa jornada com a gente.');
    });
  });

  // ─── 7. CTA Manual ───────────────────────────────────────────────────────────

  describe('7. Prevenção de Duplicidade — CTA Manual', () => {
    it('CTA manual existente permanece; nenhum CTA automático adicional é inserido', () => {
      const output = CtaEngine.composeReflection(manualCtaHtml, { user: null, language: 'pt-BR' });
      expect(output).toContain('CTA Manual Específico');
      expect(output).not.toContain('Que estes três minutos não terminem aqui.');
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
      expect(output).not.toContain('Que estes três minutos');
      const blocks = extractStructure(output);
      expect(blocks.filter(b => b.type === 'cta')).toHaveLength(1);
    });
  });

  // ─── 8. Conteúdo Curto ───────────────────────────────────────────────────────

  describe('8. Posicionamento — Conteúdo Curto', () => {
    it('Parágrafo único: CTA de captação aparece ao final', () => {
      const output = CtaEngine.composeReflection(sampleSingleParagraph, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      expect(blocks[1].type).toBe('cta');
    });

    it('2 parágrafos: CTA de captação aparece ao final', () => {
      const output = CtaEngine.composeReflection(sampleShort, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      expect(blocks.filter(b => b.type === 'cta')).toHaveLength(1);
    });
  });

  // ─── 9. Conteúdo Longo ───────────────────────────────────────────────────────

  describe('9. Posicionamento — Conteúdo Longo (8 parágrafos)', () => {
    it('CTA de captação é inserido em ~65% do conteúdo (após parágrafo 5)', () => {
      const output = CtaEngine.composeReflection(sampleLong, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);

      expect(blocks.length).toBe(3);
      expect(blocks[0].type).toBe('html');
      expect(blocks[1].type).toBe('cta');
      expect(blocks[2].type).toBe('html');

      if (blocks[0].type === 'html') {
        expect(blocks[0].content).toContain('Parágrafo 1');
        expect(blocks[0].content).toContain('Parágrafo 5');
        expect(blocks[0].content).not.toContain('Parágrafo 6');
      }
      if (blocks[2].type === 'html') {
        expect(blocks[2].content).toContain('Parágrafo 6');
        expect(blocks[2].content).toContain('Parágrafo 8');
      }
    });
  });

  // ─── 10. composeBlocks ───────────────────────────────────────────────────────

  describe('10. composeBlocks — composição em nível de bloco', () => {
    it('Insere 1 CTA de captação para visitante anônimo', () => {
      const htmlBlocks = [
        { type: 'html' as const, content: '<p>P1</p>' },
        { type: 'html' as const, content: '<p>P2</p>' },
        { type: 'html' as const, content: '<p>P3</p>' },
        { type: 'html' as const, content: '<p>P4</p>' },
      ];
      const composed = CtaEngine.composeBlocks(htmlBlocks, { user: null, language: 'pt-BR' });
      const ctaBlocks = composed.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('Continue essa jornada com a gente.');
      }
    });

    it('NÃO insere CTA de captação para usuário autenticado', () => {
      const htmlBlocks = [
        { type: 'html' as const, content: '<p>P1</p>' },
        { type: 'html' as const, content: '<p>P2</p>' },
      ];
      const composed = CtaEngine.composeBlocks(htmlBlocks, { user: { id: 'u1' }, language: 'pt-BR' });
      expect(composed.some(b => b.type === 'cta')).toBe(false);
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
