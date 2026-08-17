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
  async trackEvent(eventName: string, metadata: Record<string, any> = {}) {
    try {
      const payload = {
        event_name: eventName,
        anonymous_id: getAnonymousId(),
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
