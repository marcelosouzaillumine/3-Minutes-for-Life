import { illumineFetch } from '../lib/illumine';

export interface InAppCommunicationMessage {
  id: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  status: 'delivered' | 'opened' | string;
  language: string;
  created_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

function normalizeMessage(m: any): InAppCommunicationMessage {
  return {
    id: m.id,
    title: m.title,
    body: m.body,
    cta_label: m.ctaLabel ?? m.cta_label ?? null,
    cta_url: m.ctaUrl ?? m.cta_url ?? null,
    status: m.status,
    language: m.language,
    created_at: m.createdAt ?? m.created_at,
    delivered_at: m.deliveredAt ?? m.delivered_at ?? null,
    opened_at: m.openedAt ?? m.opened_at ?? null,
    clicked_at: m.clickedAt ?? m.clicked_at ?? null,
  };
}

export const CommunicationInboxService = {
  async getMessages(): Promise<InAppCommunicationMessage[]> {
    const res = await illumineFetch('/communications/inbox');
    if (!res.ok) return [];
    const data = await res.json();
    const messages: any[] = data.messages ?? data;
    return Array.isArray(messages) ? messages.map(normalizeMessage) : [];
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await illumineFetch('/communications/inbox/unread-count');
      if (res.ok) {
        const data = await res.json();
        const count = data.count ?? data;
        return typeof count === 'number' ? count : 0;
      }
    } catch {}
    return 0;
  },

  async markAsOpened(deliveryIds: string[]): Promise<number> {
    if (deliveryIds.length === 0) return 0;
    const res = await illumineFetch('/communications/inbox/opened', {
      method: 'POST',
      body: JSON.stringify({ deliveryIds }),
    });
    if (!res.ok) throw new Error('Failed to mark messages as opened');
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : deliveryIds.length;
  },

  async markAsClicked(deliveryId: string): Promise<boolean> {
    const res = await illumineFetch('/communications/inbox/clicked', {
      method: 'POST',
      body: JSON.stringify({ deliveryId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success !== false;
  },
};
