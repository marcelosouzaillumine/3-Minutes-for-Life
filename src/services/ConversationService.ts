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
  /**
   * Contador de não lidas. O gateway não tem campo readAt em PastoralReply,
   * então retorna 0 graciosamente — sem quebrar a tela.
   */
  async getUnreadCount(): Promise<number> {
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

  /**
   * Marca como lidas. O gateway não tem readAt, então tenta Supabase
   * como best-effort e retorna 0 silenciosamente em caso de falha.
   */
  async markAsRead(replyIds?: string[]): Promise<number> {
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
