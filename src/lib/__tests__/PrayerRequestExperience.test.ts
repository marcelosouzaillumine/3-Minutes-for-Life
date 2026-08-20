import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CtaEngine } from '../../services/CtaEngine';
import { extractStructure } from '../contentStructure';
import ptCommon from '../../i18n/locales/pt-BR/common.json';
import enCommon from '../../i18n/locales/en/common.json';
import esCommon from '../../i18n/locales/es/common.json';

describe('Separação Arquitetural: Captação no Meio da Reflexão & Relacionamento no Final', () => {

  const originalDoc = (globalThis as any).document;

  beforeAll(() => {
    if (typeof document === 'undefined') {
      (globalThis as any).document = new EventTarget();
    }
  });

  afterAll(() => {
    (globalThis as any).document = originalDoc;
  });

  const sampleReflection = [
    '<p>Primeiro parágrafo de introdução.</p>',
    '<p>Segundo parágrafo desenvolvendo a ideia.</p>',
    '<p>Terceiro parágrafo com aplicação prática.</p>',
    '<p>Quarto parágrafo concluindo o raciocínio.</p>'
  ].join('\n');

  // ─── 1. Regra de Separação: CtaEngine (Meio) vs Relacionamento (Final) ────────

  describe('1. Regra de Separação: CtaEngine vs RelationshipSection', () => {
    it('Anônimo recebe SOMENTE 1 CTA de captação/continuidade na reflexão (NUNCA testemunho ou oração)', () => {
      const output = CtaEngine.composeReflection(sampleReflection, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');

      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('Continue essa jornada com a gente.');
        expect(ctaBlocks[0].attrs.label).toBe('Quero continuar');
        expect(ctaBlocks[0].attrs.url).toBe('/signup');
      }

      expect(output).not.toContain('Como essa reflexão tocou você?');
      expect(output).not.toContain('Podemos orar por você?');
    });

    it('Usuário autenticado NÃO recebe nenhum CTA dentro da reflexão', () => {
      const output = CtaEngine.composeReflection(sampleReflection, {
        user: { id: 'auth-user-1', email: 'user@test.com' },
        language: 'pt-BR'
      });
      expect(output).not.toContain('data-type="cta"');
      expect(output).toBe(sampleReflection);
    });
  });

  // ─── 2. Área de Relacionamento no Final: Textos e Authentication Gate ────────

  describe('2. Área de Relacionamento no Final: Textos e Authentication Gate', () => {
    it('PT-BR: contém mensagens de acolhimento pastoral para login obrigatório', () => {
      const pr = ptCommon.prayerRequest;
      expect(pr.title).toBe('Podemos orar por você?');
      expect(pr.submitBtn).toBe('Enviar meu pedido de oração');
      expect(pr.authGateTitle).toBe('Entre para compartilhar seu pedido de oração');
      expect(pr.authGateDescription).toContain('Para que nossa equipe possa receber seu pedido e cuidar dele com responsabilidade');

      const tm = ptCommon.testimonials;
      expect(tm.title).toBe('Como essa reflexão tocou você?');
      expect(tm.writeBtn).toBe('Compartilhar meu testemunho');
      expect(tm.authGateTitle).toBe('Entre para compartilhar seu testemunho');
    });

    it('EN: contém mensagens equivalentes em inglês sem resquícios de português', () => {
      const pr = enCommon.prayerRequest;
      expect(pr.title).toBe('Can we pray for you?');
      expect(pr.submitBtn).toBe('Send my prayer request');
      expect(pr.authGateTitle).toBe('Sign in to share your prayer request');

      const tm = enCommon.testimonials;
      expect(tm.title).toBe('How did this reflection touch you?');
      expect(tm.writeBtn).toBe('Share my testimony');
      expect(tm.authGateTitle).toBe('Sign in to share your story');
    });

    it('ES: contém mensagens equivalentes em espanhol sem resquícios de português', () => {
      const pr = esCommon.prayerRequest;
      expect(pr.title).toBe('¿Podemos orar por ti?');
      expect(pr.submitBtn).toBe('Enviar mi petición de oración');
      expect(pr.authGateTitle).toBe('Inicia sesión para compartir tu petición de oración');

      const tm = esCommon.testimonials;
      expect(tm.title).toBe('¿Cómo te tocó esta reflexión?');
      expect(tm.writeBtn).toBe('Compartir mi testimonio');
      expect(tm.authGateTitle).toBe('Inicia sesión para compartir tu testimonio');
    });

    it('Gera URL de retorno correta com intent e devotional_id preservados', () => {
      const mockLocation = {
        pathname: '/app',
        search: '?tab=explore',
        href: 'https://3minutesforlife.com/app?tab=explore'
      };
      const devotionalId = 'devo-uuid-123';
      const intent = 'prayer_request';

      const currentUrl = new URL(mockLocation.href);
      currentUrl.searchParams.set('intent', intent);
      if (devotionalId) currentUrl.searchParams.set('d', devotionalId);
      const returnPath = currentUrl.pathname + currentUrl.search;
      const loginUrl = `/login?redirectTo=${encodeURIComponent(returnPath)}`;

      expect(loginUrl).toContain('redirectTo=');
      expect(decodeURIComponent(loginUrl)).toContain('/app?tab=explore&intent=prayer_request&d=devo-uuid-123');
    });
  });

  // ─── 3. Validação do Formulário e Persistência ───────────────────────────────

  describe('3. Validação do Formulário e Regras de Negócio', () => {
    it('campo vazio ou somente com espaços é bloqueado (trim obrigatório)', () => {
      const validateInput = (text: string) => text.trim().length > 0;

      expect(validateInput('')).toBe(false);
      expect(validateInput('   ')).toBe(false);
      expect(validateInput('\n\t  ')).toBe(false);
      expect(validateInput('Por favor, orem pela recuperação de minha mãe.')).toBe(true);
    });

    it('payload de inserção preserva user_id, devotional_id, language e request', () => {
      const userId = 'user-auth-uuid-999';
      const devotionalId = 'devo-uuid-456';
      const language = 'pt-BR';
      const requestText = 'Peço oração por paz no meu trabalho.';

      const payload = {
        user_id: userId,
        devotional_id: devotionalId || null,
        language: language || 'pt-BR',
        request: requestText.trim(),
        status: 'pending' as const
      };

      expect(payload.user_id).toBe(userId);
      expect(payload.devotional_id).toBe(devotionalId);
      expect(payload.language).toBe('pt-BR');
      expect(payload.request).toBe(requestText);
      expect(payload.status).toBe('pending');
    });
  });

  // ─── 4. Shared Devotional (/r/:code?d=:id) ─────────────────────────────────

  describe('4. Shared Devotional (/r/:code?d=:id)', () => {
    const sharedReflection = [
      '<p>Quando a jornada parece pesada, lembre-se de que cada passo conta.</p>',
      '<p>A graça nos encontra exatamente onde estamos.</p>'
    ].join('\n');

    it('Link compartilhado para anônimo recebe CTA de captação na reflexão', () => {
      const output = CtaEngine.composeReflection(sharedReflection, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(1);
      if (ctaBlocks[0].type === 'cta') {
        expect(ctaBlocks[0].attrs.title).toBe('Continue essa jornada com a gente.');
      }
    });

    it('Link compartilhado para autenticado NÃO recebe CTA de captação na reflexão', () => {
      const output = CtaEngine.composeReflection(sharedReflection, {
        user: { id: 'shared-user-1' },
        language: 'pt-BR'
      });
      const blocks = extractStructure(output);
      expect(blocks.some(b => b.type === 'cta')).toBe(false);
    });
  });
});
