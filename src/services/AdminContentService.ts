import { supabase } from '../lib/supabase';
import { sanitizeHtml } from '../lib/sanitizer';

export const AdminContentService = {
  async getDevotionals(): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        title,
        subtitle,
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

    if (translations) {
      const translationPayloads = ['en', 'es'].map(lang => {
        const trans = translations[lang];
        if (!trans) return null;
        return {
          devotional_id: newDevotional.id,
          language: lang,
          title: trans.title || '',
          subtitle: trans.subtitle || null,
          principle_statement: trans.principle_statement || null,
          reflection: sanitizeHtml(trans.reflection || ''),
          practical_application: sanitizeHtml(trans.practical_application || ''),
          prayer: sanitizeHtml(trans.prayer || ''),
          status: newDevotional.status || 'draft'
        };
      }).filter(Boolean);

      if (translationPayloads.length > 0) {
        const { error: transError } = await supabase
          .from('devotional_translations')
          .upsert(translationPayloads, { onConflict: 'devotional_id,language' });
        
        if (transError) console.error('Error saving translations:', transError);
      }
    }

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

    if (translations) {
      const translationPayloads = ['en', 'es'].map(lang => {
        const trans = translations[lang];
        if (!trans) return null;
        return {
          devotional_id: id,
          language: lang,
          title: trans.title || '',
          subtitle: trans.subtitle || null,
          principle_statement: trans.principle_statement || null,
          reflection: sanitizeHtml(trans.reflection || ''),
          practical_application: sanitizeHtml(trans.practical_application || ''),
          prayer: sanitizeHtml(trans.prayer || ''),
          status: updatedDevotional.status || 'draft'
        };
      }).filter(Boolean);

      if (translationPayloads.length > 0) {
        const { error: transError } = await supabase
          .from('devotional_translations')
          .upsert(translationPayloads, { onConflict: 'devotional_id,language' });
        
        if (transError) console.error('Error saving translations:', transError);
      }
    }

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
