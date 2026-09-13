import { illumineFetch, illumineAuth } from '../lib/illumine';

const CONTEXT_KEY = '3m_referral_context';
const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ReferralContext {
  code: string;
  devotional_id: string;
  captured_at: number;
}

const getAnonymousId = () => {
  let anonId = localStorage.getItem('3m_anon_id');
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem('3m_anon_id', anonId);
  }
  return anonId;
};

export const AnalyticsService = {
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

      await illumineFetch('/analytics/events', {
        method: 'POST',
        body: JSON.stringify({
          eventType: eventName,
          resource: resolvedContentId ? 'devotional' : undefined,
          resourceId: resolvedContentId || undefined,
          anonymousId: illumineAuth.isAuthenticated() ? undefined : getAnonymousId(),
          properties: metadata,
        }),
      });
    } catch (err) {
      console.error('[Analytics] Failed to track event:', err);
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
