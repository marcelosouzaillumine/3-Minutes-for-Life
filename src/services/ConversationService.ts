import { illumineFetch } from '../lib/illumine';

export interface Conversation {
  id: string;
  relationship_type: 'testimonial' | 'prayer_request';
  relationship_id: string;
  message: string;
  sent_at: string;
  read_at: string | null;
  original_message: string | null;
  original_sent_at: string | null;
}

export const ConversationService = {
  async getUnreadCount(): Promise<number> {
    try {
      const res = await illumineFetch('/pastoral/me/replies');
      if (res.ok) {
        const convs: Conversation[] = await res.json();
        return convs.filter(c => !c.read_at).length;
      }
    } catch {}
    return 0;
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await illumineFetch('/pastoral/me/replies');
    if (!res.ok) throw new Error('Failed to load conversations');
    return (await res.json()) as Conversation[];
  },

  async markAsRead(replyIds?: string[]): Promise<number> {
    const res = await illumineFetch('/pastoral/me/replies/read', {
      method: 'POST',
      body: JSON.stringify({ replyIds: replyIds ?? null }),
    });
    if (!res.ok) return 0;
    const body = await res.json();
    return typeof body.marked === 'number' ? body.marked : 0;
  },
};
