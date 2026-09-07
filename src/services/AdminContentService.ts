import { supabase } from '../lib/supabase';
import { sanitizeHtml } from '../lib/sanitizer';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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
        content_tip,
        content_tip_image_url,
        content_tip_url,
        support_message,
        support_banner_url,
        support_link_url,
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
    // BUGFIX: 'categories' vem embutido pelo select relacional
    // (categories(id,name)) usado em getDevotional()/getDevotionals(), mas
    // não é uma coluna real de `devotionals` — enviá-la no payload de
    // insert/update faz o PostgREST rejeitar com "Could not find the
    // 'categories' column of 'devotionals' in the schema cache".
    const { translations, devotional_translations, categories, ...payload } = devotional;
    
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
    // BUGFIX: ver nota equivalente em createDevotional().
    const { translations, devotional_translations, categories, ...payload } = updates;
    
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

  async updateCategory(id: string, name: string): Promise<any> {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteDevotional(id: string): Promise<void> {
    const { error } = await supabase
      .from('devotionals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDevotionalsWithAllTranslations(): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id, legacy_id, title, publication_date, status, content_hash,
        principle_statement, reflection, practical_application, prayer,
        scripture_reference, scripture_text, content_tip, content_tip_image_url,
        content_tip_url, support_message, support_banner_url, support_link_url,
        category_id, categories(id, name),
        devotional_translations (*)
      `)
      .eq('status', 'published')
      .order('publication_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(devotional => {
      const langMap: Record<string, { manual: any; ai: any; state: string }> = {};

      for (const t of devotional.devotional_translations || []) {
        const lang = t.language;
        if (!langMap[lang]) langMap[lang] = { manual: null, ai: null, state: 'none' };
        if (t.translation_source === 'manual') langMap[lang].manual = t;
        else langMap[lang].ai = t;
      }

      for (const lang of Object.keys(langMap)) {
        const { manual, ai } = langMap[lang];
        if (manual?.status === 'published') langMap[lang].state = 'manual_published';
        else if (manual?.status === 'draft') langMap[lang].state = 'draft';
        else if (ai?.status === 'published') langMap[lang].state = 'ai_published';
        else langMap[lang].state = 'draft';
      }

      return { ...devotional, langMap };
    });
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
        content_tip,
        content_tip_image_url,
        content_tip_url,
        support_message,
        support_banner_url,
        support_link_url,
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
    content_tip?: string | null;
    content_tip_image_url?: string | null;
    content_tip_url?: string | null;
    support_message?: string | null;
    support_banner_url?: string | null;
    support_link_url?: string | null;
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
      content_tip,
      content_tip_image_url,
      content_tip_url,
      support_message,
      support_banner_url,
      support_link_url,
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
      content_tip: content_tip ? sanitizeHtml(content_tip) : null,
      content_tip_image_url: content_tip_image_url || null,
    content_tip_url: content_tip_url || null,
      support_message: support_message ? sanitizeHtml(support_message) : null,
      support_banner_url: support_banner_url || null,
    support_link_url: support_link_url || null,
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
    if (illumineAuth.isAuthenticated()) {
      try {
        const urlRes = await illumineFetch('/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: `share-assets/${devotionalId}/${languageCode}` }),
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          return publicUrl;
        }
      } catch (e) {
        console.warn('[Upload] Illumine uploadShareAsset failed, falling back:', e);
      }
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${devotionalId}/${languageCode}/${type}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('share-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    return supabase.storage.from('share-assets').getPublicUrl(path).data.publicUrl;
  },

  /**
   * Upload de imagens editoriais opcionais do próprio devocional
   * (imagem da "Dica de conteúdo" e banner do "Apoio ao projeto").
   * Reaproveita o mesmo bucket de storage usado pelos assets de compartilhamento,
   * mas NÃO grava na tabela devotional_share_assets — a URL resultante deve ser
   * salva pelo chamador no campo correspondente do devocional/tradução
   * (content_tip_image_url / support_banner_url) via handleSave normal.
   */
  async uploadContentImage(
    devotionalId: string,
    languageCode: string,
    field: 'content_tip_image' | 'support_banner',
    file: File
  ): Promise<string> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const urlRes = await illumineFetch('/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: `devotionals/${devotionalId}/${languageCode}` }),
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          return publicUrl;
        }
      } catch (e) {
        console.warn('[Upload] Illumine uploadContentImage failed, falling back:', e);
      }
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${devotionalId}/${languageCode}/${field}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('share-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    return supabase.storage.from('share-assets').getPublicUrl(path).data.publicUrl;
  },

  async listLibraryImages(): Promise<Array<{ name: string; url: string }>> {
    const { data, error } = await supabase.storage
      .from('share-assets')
      .list('library', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;
    return (data || [])
      .filter(f => f.id !== null)
      .map(f => ({
        name: f.name,
        url: supabase.storage.from('share-assets').getPublicUrl(`library/${f.name}`).data.publicUrl,
      }));
  },

  async uploadLibraryImage(file: File): Promise<string> {
    if (illumineAuth.isAuthenticated()) {
      try {
        const urlRes = await illumineFetch('/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, mimeType: file.type, folder: 'library' }),
        });
        if (urlRes.ok) {
          const { uploadUrl, publicUrl } = await urlRes.json();
          await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          return publicUrl;
        }
      } catch (e) {
        console.warn('[Upload] Illumine uploadLibraryImage failed, falling back:', e);
      }
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `library/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('share-assets')
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from('share-assets').getPublicUrl(path).data.publicUrl;
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
