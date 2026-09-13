import type { PrayerRequest, PrayerRequestInsert } from '../types/PrayerRequest';
import { AnalyticsService } from './AnalyticsService';
import { illumineFetch } from '../lib/illumine';

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

    const res = await illumineFetch('/pastoral/prayer-requests', {
      method: 'POST',
      body: JSON.stringify({
        request: data.request,
        language: data.language || 'pt-BR',
        devotionalId: validDevotionalId,
      }),
    });

    if (!res.ok) throw new Error('Failed to create prayer request');

    const p = await res.json();
    AnalyticsService.trackEvent('prayer_request_submitted', { devotional_id: data.devotional_id });
    return normalizePrayerRequest(p);
  },

  async getUserPrayerRequests(): Promise<PrayerRequest[]> {
    const res = await illumineFetch('/pastoral/me/prayer-requests');
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows as any[]).map(normalizePrayerRequest);
  },
};
