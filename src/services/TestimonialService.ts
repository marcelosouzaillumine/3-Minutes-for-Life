import type { Testimonial, TestimonialInsert, TestimonialUserUpdate } from '../types/Testimonial';
import { AnalyticsService } from './AnalyticsService';
import { illumineFetch } from '../lib/illumine';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeTestimonial(t: any): Testimonial {
  return {
    id: t.id,
    user_id: t.userId ?? t.user_id,
    devotional_id: t.devotionalId ?? t.devotional_id ?? null,
    content: t.content,
    status: t.status,
    created_at: t.createdAt ?? t.created_at,
    updated_at: t.updatedAt ?? t.updated_at,
  };
}

export const TestimonialService = {
  async createTestimonial(data: TestimonialInsert): Promise<Testimonial> {
    const validDevotionalId = (data.devotional_id && UUID_REGEX.test(data.devotional_id))
      ? data.devotional_id
      : null;

    const res = await illumineFetch('/pastoral/testimonials', {
      method: 'POST',
      body: JSON.stringify({ content: data.content, devotionalId: validDevotionalId }),
    });

    if (!res.ok) throw new Error('Failed to create testimonial');

    const t = await res.json();
    AnalyticsService.trackEvent('testimonial_submitted', { devotional_id: data.devotional_id });
    return normalizeTestimonial(t);
  },

  async getUserTestimonials(): Promise<Testimonial[]> {
    const res = await illumineFetch('/pastoral/me/testimonials');
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows as any[]).map(normalizeTestimonial);
  },

  async updatePendingTestimonial(id: string, data: TestimonialUserUpdate): Promise<Testimonial> {
    const res = await illumineFetch(`/pastoral/me/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.devotional_id !== undefined ? { devotional_id: data.devotional_id } : {}),
      }),
    });
    if (!res.ok) throw new Error('Failed to update testimonial');
    return normalizeTestimonial(await res.json());
  },

  async deletePendingTestimonial(id: string): Promise<void> {
    const res = await illumineFetch(`/pastoral/me/testimonials/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete testimonial');
  },
};
