import { supabase } from '../lib/supabase';
import type { Testimonial, TestimonialInsert, TestimonialUserUpdate } from '../types/Testimonial';
import { AnalyticsService } from './AnalyticsService';
import { authService } from './authService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TestimonialService = {
  async createTestimonial(data: TestimonialInsert): Promise<Testimonial> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const validDevotionalId = (data.devotional_id && UUID_REGEX.test(data.devotional_id)) 
      ? data.devotional_id 
      : null;

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert([{
        user_id: user.id,
        devotional_id: validDevotionalId,
        content: data.content,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating testimonial:", error);
      throw error;
    }

    AnalyticsService.trackEvent('testimonial_submitted', { devotional_id: data.devotional_id });

    return testimonial as Testimonial;
  },

  async getUserTestimonials(): Promise<Testimonial[]> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user testimonials:", error);
      throw error;
    }

    return (data || []) as Testimonial[];
  },

  async updatePendingTestimonial(id: string, data: TestimonialUserUpdate): Promise<Testimonial> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error("User not authenticated");

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error("Error updating testimonial:", error);
      throw error;
    }

    return testimonial as Testimonial;
  },

  async deletePendingTestimonial(id: string): Promise<void> {
    const session = await authService.getSession();
    const user = session?.user;
    if (!user?.id) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error("Error deleting testimonial:", error);
      throw error;
    }
  }
};
