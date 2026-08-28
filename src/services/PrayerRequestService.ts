import { supabase } from '../lib/supabase';
import type { PrayerRequest, PrayerRequestInsert } from '../types/PrayerRequest';
import { AnalyticsService } from './AnalyticsService';
import { authService } from './authService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PrayerRequestService = {
  async createPrayerRequest(data: PrayerRequestInsert): Promise<PrayerRequest> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const validDevotionalId = (data.devotional_id && UUID_REGEX.test(data.devotional_id)) 
      ? data.devotional_id 
      : null;

    const { data: prayerRequest, error } = await supabase
      .from('prayer_requests')
      .insert([{
        user_id: user.id,
        devotional_id: validDevotionalId,
        language: data.language || 'pt-BR',
        request: data.request,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating prayer request:", error);
      throw error;
    }

    AnalyticsService.trackEvent('prayer_request_submitted', { devotional_id: data.devotional_id });

    return prayerRequest as PrayerRequest;
  },

  async getUserPrayerRequests(): Promise<PrayerRequest[]> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user prayer requests:", error);
      throw error;
    }

    return (data || []) as PrayerRequest[];
  }
};
