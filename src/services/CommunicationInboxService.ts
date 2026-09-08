import { supabase } from '../lib/supabase';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/communications/inbox');
        if (res.ok) {
          const data = await res.json();
          const messages: any[] = data.messages ?? data;
          if (Array.isArray(messages)) return messages.map(normalizeMessage);
        }
      } catch (e) {
        console.warn('[Inbox] Illumine getMessages failed, falling back:', e);
      }
    }

    const { data, error } = await supabase.rpc('get_my_in_app_messages');
    if (error) {
      console.error('Failed to load in-app communication messages:', error);
      throw error;
    }
    return (data || []) as InAppCommunicationMessage[];
  },

  async getUnreadCount(): Promise<number> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/communications/inbox/unread-count');
        if (res.ok) {
          const data = await res.json();
          const count = data.count ?? data;
          return typeof count === 'number' ? count : 0;
        }
      } catch (e) {
        console.warn('[Inbox] Illumine getUnreadCount failed, falling back:', e);
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_my_unread_communication_count');
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    } catch (err) {
      console.error('Failed to load unread communication count:', err);
      return 0;
    }
  },

  async markAsOpened(deliveryIds: string[]): Promise<number> {
    if (deliveryIds.length === 0) return 0;

    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/communications/inbox/opened', {
          method: 'POST',
          body: JSON.stringify({ deliveryIds }),
        });
        if (res.ok) {
          const data = await res.json();
          return typeof data.count === 'number' ? data.count : deliveryIds.length;
        }
      } catch (e) {
        console.warn('[Inbox] Illumine markAsOpened failed, falling back:', e);
      }
    }

    const { data, error } = await supabase.rpc('mark_communication_as_opened', {
      p_delivery_ids: deliveryIds,
    });
    if (error) {
      console.error('Failed to mark communications as opened:', error);
      throw error;
    }
    return typeof data === 'number' ? data : 0;
  },

  async markAsClicked(deliveryId: string): Promise<boolean> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/communications/inbox/clicked', {
          method: 'POST',
          body: JSON.stringify({ deliveryId }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.success !== false;
        }
      } catch (e) {
        console.warn('[Inbox] Illumine markAsClicked failed, falling back:', e);
      }
    }

    const { data, error } = await supabase.rpc('mark_communication_as_clicked', {
      p_delivery_id: deliveryId,
    });
    if (error) {
      console.error('Failed to mark communication as clicked:', error);
      throw error;
    }
    return data === true;
  },
};
