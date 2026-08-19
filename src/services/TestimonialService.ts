import { supabase } from '../lib/supabase';
import type { Testimonial, TestimonialInsert, TestimonialUserUpdate } from '../types/Testimonial';
import { AnalyticsService } from './AnalyticsService';

export const TestimonialService = {
  async createTestimonial(data: TestimonialInsert): Promise<Testimonial> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert([{
        user_id: userData.user.id,
        devotional_id: data.devotional_id,
        content: data.content,
        // Status is inherently 'pending' by default in DB, no need to send it.
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
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user testimonials:", error);
      throw error;
    }

    return data as Testimonial[];
  },

  async updatePendingTestimonial(id: string, data: TestimonialUserUpdate): Promise<Testimonial> {
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(data)
      .eq('id', id)
      .eq('status', 'pending') // Only pending
      .select()
      .single();

    if (error) {
      console.error("Error updating testimonial:", error);
      throw error;
    }

    return testimonial as Testimonial;
  },

  async deletePendingTestimonial(id: string): Promise<void> {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)
      .eq('status', 'pending'); // Only pending

    if (error) {
      console.error("Error deleting testimonial:", error);
      throw error;
    }
  }
};
