import { supabase } from '../lib/supabase';
import type { PrayerRequest, PrayerRequestInsert } from '../types/PrayerRequest';
import { AnalyticsService } from './AnalyticsService';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizePrayerRequest(p: any): PrayerRequest {
  return {
    id: p.id,
    user_id: p.userId ?? p.user_id,
    devotional_id: p.devotionalId ?? p.devotional_id ?? null,
    language: p.language ?? 'pt-BR',
    request: p.request,
    status: p.status,
    created_at: p.createdAt ?? p.created_at,
    updated_at: p.updatedAt ?? p.updated_at,
  };
}

export const PrayerRequestService = {
  async createPrayerRequest(data: PrayerRequestInsert): Promise<PrayerRequest> {
    const validDevotionalId = (data.devotional_id && UUID_REGEX.test(data.devotional_id))
      ? data.devotional_id
      : null;

    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/pastoral/prayer-requests', {
          method: 'POST',
          body: JSON.stringify({
            request: data.request,
            language: data.language || 'pt-BR',
            devotionalId: validDevotionalId,
          }),
        });
        if (res.ok) {
          const p = await res.json();
          AnalyticsService.trackEvent('prayer_request_submitted', { devotional_id: data.devotional_id });
          return normalizePrayerRequest(p);
        }
      } catch (e) {
        console.warn('[PrayerRequest] Illumine create failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error('User not authenticated');

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

    if (error) throw error;
    AnalyticsService.trackEvent('prayer_request_submitted', { devotional_id: data.devotional_id });
    return prayerRequest as PrayerRequest;
  },

  async getUserPrayerRequests(): Promise<PrayerRequest[]> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/pastoral/me/prayer-requests');
        if (res.ok) {
          const rows = await res.json();
          return (rows as any[]).map(normalizePrayerRequest);
        }
      } catch (e) {
        console.warn('[PrayerRequest] Illumine list failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PrayerRequest[];
  }
};
