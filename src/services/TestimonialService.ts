import { supabase } from '../lib/supabase';
import type { Testimonial, TestimonialInsert, TestimonialUserUpdate } from '../types/Testimonial';
import { AnalyticsService } from './AnalyticsService';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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

    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/pastoral/testimonials', {
          method: 'POST',
          body: JSON.stringify({ content: data.content, devotionalId: validDevotionalId }),
        });
        if (res.ok) {
          const t = await res.json();
          AnalyticsService.trackEvent('testimonial_submitted', { devotional_id: data.devotional_id });
          return normalizeTestimonial(t);
        }
      } catch (e) {
        console.warn('[Testimonial] Illumine create failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error('User not authenticated');

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert([{ user_id: user.id, devotional_id: validDevotionalId, content: data.content }])
      .select()
      .single();

    if (error) throw error;
    AnalyticsService.trackEvent('testimonial_submitted', { devotional_id: data.devotional_id });
    return testimonial as Testimonial;
  },

  async getUserTestimonials(): Promise<Testimonial[]> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch('/pastoral/me/testimonials');
        if (res.ok) {
          const rows = await res.json();
          return (rows as any[]).map(normalizeTestimonial);
        }
      } catch (e) {
        console.warn('[Testimonial] Illumine list failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Testimonial[];
  },

  async updatePendingTestimonial(id: string, data: TestimonialUserUpdate): Promise<Testimonial> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/pastoral/me/testimonials/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...(data.content !== undefined ? { content: data.content } : {}),
            ...(data.devotional_id !== undefined ? { devotional_id: data.devotional_id } : {}),
          }),
        });
        if (res.ok) return normalizeTestimonial(await res.json());
      } catch (e) {
        console.warn('[Testimonial] Illumine update failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error('User not authenticated');

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return testimonial as Testimonial;
  },

  async deletePendingTestimonial(id: string): Promise<void> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/pastoral/me/testimonials/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) return;
      } catch (e) {
        console.warn('[Testimonial] Illumine delete failed, falling back:', e);
      }
    }

    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
  }
};
