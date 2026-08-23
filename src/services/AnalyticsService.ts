import { supabase } from '../lib/supabase';

const CONTEXT_KEY = '3m_referral_context';
const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ReferralContext {
  code: string;
  devotional_id: string;
  captured_at: number;
}

// Generate anonymous ID if not exists
const getAnonymousId = () => {
  let anonId = localStorage.getItem('3m_anon_id');
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem('3m_anon_id', anonId);
  }
  return anonId;
};

export const AnalyticsService = {
  /**
   * Dispara um evento de analytics.
   *
   * BUGFIX (auditoria Intelligence Center): a coluna `content_id` em app_events
   * nunca era preenchida porque o `devotional_id` só ia dentro de `metadata`,
   * e a edge function `track-event` só lê `content_id` como campo de primeiro
   * nível do payload. Agora extraímos automaticamente `metadata.devotional_id`
   * (convenção já usada em todos os pontos de chamada) para o campo correto,
   * sem precisar alterar cada chamador individualmente. `contentId` pode
   * também ser passado explicitamente quando preferível.
   *
   * Também geramos um `idempotency_key` por chamada, aproveitando a proteção
   * de duplicidade que já existe em `track_analytic_event` no banco (útil em
   * retries de rede, comuns em mobile).
   */
  async trackEvent(
    eventName: string,
    metadata: Record<string, any> = {},
    contentId?: string
  ) {
    try {
      const resolvedContentId =
        contentId ||
        metadata.devotional_id ||
        metadata.content_id ||
        null;

      const payload = {
        event_type: eventName,
        event_name: eventName, // retrocompatibilidade
        content_id: resolvedContentId,
        anonymous_id: getAnonymousId(),
        idempotency_key: crypto.randomUUID(),
        metadata
      };

      await supabase.functions.invoke('track-event', {
        body: payload
      });
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  },

  saveReferralContext(code: string, devotionalId: string) {
    const context: ReferralContext = {
      code,
      devotional_id: devotionalId,
      captured_at: Date.now()
    };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  },

  getReferralContext(): ReferralContext | null {
    const stored = localStorage.getItem(CONTEXT_KEY);
    if (!stored) return null;

    try {
      const context: ReferralContext = JSON.parse(stored);
      // Check expiration
      if (Date.now() - context.captured_at > EXPIRATION_MS) {
        this.clearReferralContext();
        return null;
      }
      return context;
    } catch {
      this.clearReferralContext();
      return null;
    }
  },

  clearReferralContext() {
    localStorage.removeItem(CONTEXT_KEY);
  }
};
