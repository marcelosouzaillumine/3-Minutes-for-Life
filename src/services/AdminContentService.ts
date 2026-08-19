import { supabase } from '../lib/supabase';
import { sanitizeHtml } from '../lib/sanitizer';

export const AdminContentService = {
  async getLanguages(): Promise<any[]> {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTranslationJobsByDevotional(devotionalId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('devotional_id', devotionalId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getDevotionals(): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        title,
        principle_statement,
        reflection,
        practical_application,
        prayer,
        scripture_reference,
        scripture_text,
        audio_url,
        publication_date,
        status,
        category_id,
        categories (id, name),
        devotional_translations (*)
      `)
      .order('publication_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDevotional(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('devotionals')
      .select('*, devotional_translations(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createDevotional(devotional: Partial<any>): Promise<any> {
    const { translations, devotional_translations, ...payload } = devotional;
    
    if (payload.reflection) payload.reflection = sanitizeHtml(payload.reflection);
    if (payload.practical_application) payload.practical_application = sanitizeHtml(payload.practical_application);
    if (payload.prayer) payload.prayer = sanitizeHtml(payload.prayer);

    const { data: newDevotional, error } = await supabase
      .from('devotionals')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;


    return newDevotional;
  },

  async updateDevotional(id: string, updates: Partial<any>): Promise<any> {
    const { translations, devotional_translations, ...payload } = updates;
    
    if (payload.reflection) payload.reflection = sanitizeHtml(payload.reflection);
    if (payload.practical_application) payload.practical_application = sanitizeHtml(payload.practical_application);
    if (payload.prayer) payload.prayer = sanitizeHtml(payload.prayer);

    const { data: updatedDevotional, error } = await supabase
      .from('devotionals')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;



    return updatedDevotional;
  },

  async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createCategory(name: string): Promise<any> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
