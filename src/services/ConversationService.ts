import { supabase } from '../lib/supabase';

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
   * Contador de não lidas. Chamado a cada carga do app, então é
   * barato de propósito — não traz conteúdo, só o número.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_my_unread_reply_count');
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    } catch (err) {
      // Falhar aqui não pode quebrar a tela: o contador é acessório.
      console.error('Failed to load unread count:', err);
      return 0;
    }
  },

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('get_my_conversations');
    if (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
    return (data || []) as Conversation[];
  },

  /**
   * Marca como lidas. Sem argumento, marca todas as pendentes.
   */
  async markAsRead(replyIds?: string[]): Promise<number> {
    const { data, error } = await supabase.rpc('mark_replies_as_read', {
      p_reply_ids: replyIds ?? null,
    });
    if (error) {
      console.error('Failed to mark replies as read:', error);
      throw error;
    }
    return typeof data === 'number' ? data : 0;
  },
};
