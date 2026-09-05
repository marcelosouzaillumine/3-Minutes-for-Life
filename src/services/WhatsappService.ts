import { illumineFetch } from '../lib/illumine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsappConversation {
  id: string;
  contactPhone: string;
  contactName: string | null;
  status: 'open' | 'closed' | 'archived';
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface WhatsappMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  type: string;
  content: Record<string, unknown>;
  status: string;
  sentAt: string | null;
  receivedAt: string | null;
}

export interface SendTextResult {
  messageId: string;
  conversationId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const WhatsappService = {
  // Returns true if the Illumine gateway has WhatsApp configured for this tenant.
  // Used to decide between "send via API" and "open link" fallback.
  async isConfigured(): Promise<boolean> {
    try {
      const res = await illumineFetch('/whatsapp/config');
      return res.ok;
    } catch {
      return false;
    }
  },

  async sendText(to: string, text: string): Promise<SendTextResult> {
    const res = await illumineFetch('/whatsapp/send/text', {
      method: 'POST',
      body: JSON.stringify({ to: to.replace(/\D/g, ''), text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      // WHATSAPP_NOT_CONFIGURED means credentials not yet set up
      if (err?.message === 'WHATSAPP_NOT_CONFIGURED') {
        throw new Error('NOT_CONFIGURED');
      }
      throw new Error(err?.message || `WhatsApp error ${res.status}`);
    }

    return res.json();
  },

  async sendTemplate(to: string, templateName: string, language = 'pt_BR', components?: unknown[]): Promise<SendTextResult> {
    const res = await illumineFetch('/whatsapp/send/template', {
      method: 'POST',
      body: JSON.stringify({ to: to.replace(/\D/g, ''), templateName, language, components }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      if (err?.message === 'WHATSAPP_NOT_CONFIGURED') throw new Error('NOT_CONFIGURED');
      throw new Error(err?.message || `WhatsApp error ${res.status}`);
    }

    return res.json();
  },

  async listConversations(params: { status?: 'open' | 'closed' | 'archived'; search?: string; limit?: number; offset?: number } = {}): Promise<WhatsappConversation[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await illumineFetch(`/whatsapp/conversations?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load conversations: ${res.status}`);
    return res.json();
  },

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<WhatsappMessage[]> {
    const res = await illumineFetch(`/whatsapp/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
    return res.json();
  },

  async closeConversation(conversationId: string): Promise<void> {
    await illumineFetch(`/whatsapp/conversations/${conversationId}/close`, { method: 'POST' });
  },

  async reopenConversation(conversationId: string): Promise<void> {
    await illumineFetch(`/whatsapp/conversations/${conversationId}/reopen`, { method: 'POST' });
  },
};
