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
    scripture_reference?: string | null;
    scripture_text?: string | null;
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
      scripture_reference,
      scripture_text,
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

    const payload = {
      devotional_id,
      language,
      translation_source: 'manual',
      title: title?.trim() || '',
      principle_statement: principle_statement?.trim() || null,
      scripture_reference: scripture_reference?.trim() || null,
      scripture_text: scripture_text?.trim() || null,
      reflection: reflection ? sanitizeHtml(reflection) : '',
      practical_application: practical_application ? sanitizeHtml(practical_application) : null,
      prayer: prayer ? sanitizeHtml(prayer) : null,
      status,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('devotional_translations')
      .upsert(payload, { onConflict: 'devotional_id,language,translation_source' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─── Share Assets ──────────────────────────────────────────────────────────

  async getShareAssets(devotionalId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotional_share_assets')
      .select('*')
      .eq('devotional_id', devotionalId)
      .order('language_code', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async saveShareAsset(asset: {
    devotional_id: string;
    language_code: string;
    whatsapp_text?: string | null;
    whatsapp_image_url?: string | null;
    feed_image_url?: string | null;
    story_image_url?: string | null;
  }): Promise<any> {
    const payload = {
      devotional_id: asset.devotional_id,
      language_code: asset.language_code,
      whatsapp_text: asset.whatsapp_text ?? null,
      whatsapp_image_url: asset.whatsapp_image_url ?? null,
      feed_image_url: asset.feed_image_url ?? null,
      story_image_url: asset.story_image_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('devotional_share_assets')
      .upsert(payload, { onConflict: 'devotional_id,language_code' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadShareAsset(
    devotionalId: string,
    languageCode: string,
    type: 'feed' | 'story' | 'whatsapp',
    file: File
  ): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `${devotionalId}/${languageCode}/${type}-${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('share-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('share-assets').getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteShareAssetFile(url: string): Promise<void> {
    // Extract relative path: everything after /share-assets/
    const marker = '/share-assets/';
    const idx = url.indexOf(marker);
    if (idx === -1) throw new Error('URL inválida para o bucket share-assets.');

    const path = url.slice(idx + marker.length).split('?')[0]; // strip query string if present

    const { error } = await supabase.storage.from('share-assets').remove([path]);
    if (error) throw error;
  },
};
