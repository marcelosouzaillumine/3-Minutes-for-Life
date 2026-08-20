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
  },

  async getDevotionalsForManualTranslation(targetLanguage: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        legacy_id,
        title,
        principle_statement,
        reflection,
        practical_application,
        prayer,
        scripture_reference,
        scripture_text,
        publication_date,
        status,
        content_hash,
        category_id,
        categories (id, name),
        devotional_translations (*)
      `)
      .eq('status', 'published')
      .order('publication_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(devotional => {
      const translations = devotional.devotional_translations || [];
      const manualTrans = translations.find(
        (t: any) => t.language === targetLanguage && t.translation_source === 'manual'
      );
      const aiTrans = translations.find(
        (t: any) => t.language === targetLanguage && (t.translation_source === 'ai' || !t.translation_source)
      );

      // Determine active status and origin for this devotional in the target language
      let translationState: 'none' | 'draft' | 'ai_published' | 'manual_published' = 'none';
      if (manualTrans?.status === 'published') {
        translationState = 'manual_published';
      } else if (manualTrans?.status === 'draft') {
        translationState = 'draft';
      } else if (aiTrans?.status === 'published') {
        translationState = 'ai_published';
      }

      return {
        ...devotional,
        manualTranslation: manualTrans || null,
        aiTranslation: aiTrans || null,
        translationState
      };
    });
  },

  async saveManualTranslation(params: {
    devotional_id: string;
    language: string;
    title: string;
    principle_statement?: string | null;
    reflection: string;
    practical_application?: string | null;
    prayer?: string | null;
    status: 'draft' | 'published';
  }): Promise<any> {
    const {
      devotional_id,
      language,
      title,
      principle_statement,
      reflection,
      practical_application,
      prayer,
      status
    } = params;

    // Validation for publishing
    if (status === 'published') {
      if (!title || !title.trim()) throw new Error('O título é obrigatório para publicar a tradução.');
      if (!reflection || !reflection.trim()) throw new Error('A reflexão é obrigatória para publicar a tradução.');
      if (!principle_statement || !principle_statement.trim()) {
        throw new Error('O destaque (principle statement) é obrigatório para publicar a tradução.');
      }
    }

    const payload: Record<string, any> = {
      devotional_id,
      language,
      translation_source: 'manual',
      title: title?.trim() || '',
      principle_statement: principle_statement?.trim() || null,
      reflection: reflection ? sanitizeHtml(reflection) : '',
      practical_application: practical_application ? sanitizeHtml(practical_application) : null,
      prayer: prayer ? sanitizeHtml(prayer) : null,
      status
    };

    // Check if an existing manual translation record exists for this devotional & language
    const { data: existing } = await supabase
      .from('devotional_translations')
      .select('id')
      .eq('devotional_id', devotional_id)
      .eq('language', language)
      .eq('translation_source', 'manual')
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('devotional_translations')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('devotional_translations')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};
