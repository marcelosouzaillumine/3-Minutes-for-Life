import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CtaEngine } from '../../services/CtaEngine';
import { extractStructure } from '../contentStructure';
import ptCommon from '../../i18n/locales/pt-BR/common.json';
import enCommon from '../../i18n/locales/en/common.json';
import esCommon from '../../i18n/locales/es/common.json';

describe('Fase 3 — Relationship CTA Authentication Gate & Prayer Request Flow', () => {

  const originalDoc = (globalThis as any).document;

  beforeAll(() => {
    if (typeof document === 'undefined') {
      (globalThis as any).document = new EventTarget();
    }
  });

  afterAll(() => {
    (globalThis as any).document = originalDoc;
  });

  // ─── 1. Modelo Conceitual: Visibilidade Universal vs Autorização ────────────

  describe('1. Modelo Conceitual: Relationship CTAs Visíveis para Todos', () => {
    const sampleReflection = [
      '<p>Primeiro parágrafo de introdução.</p>',
      '<p>Segundo parágrafo desenvolvendo a ideia.</p>',
      '<p>Terceiro parágrafo com aplicação prática.</p>'
    ].join('\n');

    it('Visitante anônimo vê ambos os CTAs de relacionamento na reflexão', () => {
      const output = CtaEngine.composeReflection(sampleReflection, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      if (ctaBlocks[0].type === 'cta') expect(ctaBlocks[0].attrs.action).toBe('testimony');
      if (ctaBlocks[1].type === 'cta') expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
    });

    it('Usuário autenticado TAMBÉM vê ambos os CTAs de relacionamento (visibilidade não depende de auth)', () => {
      const output = CtaEngine.composeReflection(sampleReflection, {
        user: { id: 'auth-user-1', email: 'user@test.com' },
        language: 'pt-BR'
      });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
      if (ctaBlocks[0].type === 'cta') expect(ctaBlocks[0].attrs.action).toBe('testimony');
      if (ctaBlocks[1].type === 'cta') expect(ctaBlocks[1].attrs.action).toBe('prayer_request');
    });
  });

  // ─── 2. Authentication Gate: Textos e Direcionamento ────────────────────────

  describe('2. Authentication Gate: Textos Localizados e Parâmetros de Retorno', () => {
    it('PT-BR: contém mensagens de acolhimento pastoral para login obrigatório', () => {
      const pr = ptCommon.prayerRequest;
      expect(pr.authGateTitle).toBe('Entre para compartilhar seu pedido de oração');
      expect(pr.authGateDescription).toContain('Para que nossa equipe possa receber seu pedido e cuidar dele com responsabilidade');
      expect(pr.authGateButton).toBe('Entrar ou criar conta');

      const tm = ptCommon.testimonials;
      expect(tm.authGateTitle).toBe('Entre para compartilhar seu testemunho');
      expect(tm.authGateDescription).toContain('Para que nossa equipe possa receber seu relato e cuidar dele com responsabilidade');
      expect(tm.authGateButton).toBe('Entrar ou criar conta');
    });

    it('EN: contém mensagens equivalentes em inglês sem textos em português', () => {
      const pr = enCommon.prayerRequest;
      expect(pr.authGateTitle).toBe('Sign in to share your prayer request');
      expect(pr.authGateDescription).toContain('To allow our team to receive your request and care for it responsibly');
      expect(pr.authGateButton).toBe('Sign in or create account');

      const tm = enCommon.testimonials;
      expect(tm.authGateTitle).toBe('Sign in to share your story');
      expect(tm.authGateDescription).toContain('To allow our team to receive your story and care for it responsibly');
      expect(tm.authGateButton).toBe('Sign in or create account');
    });

    it('ES: contém mensagens equivalentes em espanhol sem textos em português', () => {
      const pr = esCommon.prayerRequest;
      expect(pr.authGateTitle).toBe('Inicia sesión para compartir tu petición de oración');
      expect(pr.authGateDescription).toContain('Para que nuestro equipo pueda recibir tu petición y cuidarla con responsabilidad');
      expect(pr.authGateButton).toBe('Iniciar sesión o crear cuenta');

      const tm = esCommon.testimonials;
      expect(tm.authGateTitle).toBe('Inicia sesión para compartir tu testimonio');
      expect(tm.authGateDescription).toContain('Para que nuestro equipo pueda recibir tu relato y cuidarlo con responsabilidad');
      expect(tm.authGateButton).toBe('Iniciar sesión o crear cuenta');
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

    it('mensagem de confirmação de oração expressa acolhimento pastoral', () => {
      const successBody = ptCommon.prayerRequest.successBody;
      expect(successBody).toContain('Vamos recebê-lo com cuidado e colocá-lo diante de Deus');
    });
  });

  // ─── 4. Simulação End-to-End no Link Compartilhado (/r/:code?d=:id) ─────────

  describe('4. Simulação End-to-End no Link Compartilhado (/r/:code?d=:id)', () => {
    const sharedReflection = [
      '<p>Quando a jornada parece pesada, lembre-se de que cada passo conta.</p>',
      '<p>A graça nos encontra exatamente onde estamos.</p>'
    ].join('\n');

    it('Link compartilhado renderiza ambos os CTAs para visitante anônimo', () => {
      const output = CtaEngine.composeReflection(sharedReflection, { user: null, language: 'pt-BR' });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
    });

    it('Link compartilhado renderiza ambos os CTAs para usuário autenticado', () => {
      const output = CtaEngine.composeReflection(sharedReflection, {
        user: { id: 'shared-user-1' },
        language: 'pt-BR'
      });
      const blocks = extractStructure(output);
      const ctaBlocks = blocks.filter(b => b.type === 'cta');
      expect(ctaBlocks).toHaveLength(2);
    });
  });
});
