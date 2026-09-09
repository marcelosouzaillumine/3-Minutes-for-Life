import { supabase } from '../lib/supabase';
import { illumineFetch } from '../lib/illumine';

export interface Conversation {
  id: string;
  relationship_type: 'testimonial' | 'prayer_request';
  relationship_id: string;
  /** Resposta da equipe */
  message: string;
  sent_at: string;
  read_at: string | null;
  /** O que a própria pessoa escreveu, para dar contexto à resposta */
  original_message: string | null;
  original_sent_at: string | null;
}

/**
 * Respostas que a pessoa recebeu dentro do app.
 *
 * Só lida com o canal in_app: respostas enviadas por WhatsApp/e-mail
 * ficam fora daqui, porque a pessoa já as recebeu no canal dela.
 */
export const ConversationService = {
  async getUnreadCount(): Promise<number> {
    try {
      const res = await illumineFetch('/pastoral/me/replies');
      if (res.ok) {
        const convs: Conversation[] = await res.json();
        return convs.filter(c => !c.read_at).length;
      }
    } catch {
      // ignore
    }
    return 0;
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await illumineFetch('/pastoral/me/replies');
      if (res.ok) {
        return (await res.json()) as Conversation[];
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    try {
      const { data, error } = await supabase.rpc('get_my_conversations');
      if (error) throw error;
      return (data || []) as Conversation[];
    } catch (err) {
      console.error('Failed to load conversations:', err);
      throw err;
    }
  },

  async markAsRead(replyIds?: string[]): Promise<number> {
    // Illumine-first
    try {
      const res = await illumineFetch('/pastoral/me/replies/read', {
        method: 'POST',
        body: JSON.stringify({ replyIds: replyIds ?? null }),
      });
      if (res.ok) {
        const body = await res.json();
        return typeof body.marked === 'number' ? body.marked : 0;
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    try {
      const { data, error } = await supabase.rpc('mark_replies_as_read', {
        p_reply_ids: replyIds ?? null,
      });
      if (!error) return typeof data === 'number' ? data : 0;
    } catch {
      // ignore
    }
    return 0;
  },
};
