import { supabase } from '../lib/supabase';

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

export const CommunicationInboxService = {
  async getMessages(): Promise<InAppCommunicationMessage[]> {
    const { data, error } = await supabase.rpc(
      'get_my_in_app_messages'
    );

    if (error) {
      console.error(
        'Failed to load in-app communication messages:',
        error
      );
      throw error;
    }

    return (data || []) as InAppCommunicationMessage[];
  },

  async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc(
        'get_my_unread_communication_count'
      );

      if (error) throw error;

      return typeof data === 'number' ? data : 0;
    } catch (err) {
      console.error(
        'Failed to load unread communication count:',
        err
      );

      return 0;
    }
  },

  async markAsOpened(deliveryIds: string[]): Promise<number> {
    if (deliveryIds.length === 0) {
      return 0;
    }

    const { data, error } = await supabase.rpc(
      'mark_communication_as_opened',
      {
        p_delivery_ids: deliveryIds,
      }
    );

    if (error) {
      console.error(
        'Failed to mark communications as opened:',
        error
      );
      throw error;
    }

    return typeof data === 'number' ? data : 0;
  },

  async markAsClicked(deliveryId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc(
      'mark_communication_as_clicked',
      {
        p_delivery_id: deliveryId,
      }
    );

    if (error) {
      console.error(
        'Failed to mark communication as clicked:',
        error
      );
      throw error;
    }

    return data === true;
  },
};
