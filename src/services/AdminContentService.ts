import { supabase } from '../lib/supabase';
import { sanitizeHtml } from '../lib/sanitizer';

type TranslationPayload = {
  devotional_id: string;
  language: string;
  translation_source: 'manual' | 'ai';
  title: string;
  principle_statement?: string | null;
  scripture_reference?: string | null;
  scripture_text?: string | null;
  reflection: string;
  practical_application?: string | null;
  prayer?: string | null;
  content_tip?: string | null;
  content_tip_image_url?: string | null;
  support_message?: string | null;
  support_banner_url?: string | null;
  status: 'draft' | 'published';
};

const TRANSLATABLE_HTML_FIELDS = [
  'reflection',
  'practical_application',
  'prayer',
  'content_tip',
  'support_message',
] as const;

const sanitizeTranslation = (translation: Record<string, any>) => {
  const sanitized = { ...translation };

  for (const field of TRANSLATABLE_HTML_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = sanitizeHtml(sanitized[field]);
    }
  }

  return sanitized;
};

const normalizeNullableText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const hasTranslationContent = (translation: any): boolean => {
  if (!translation) return false;

  return Boolean(
    translation.title?.trim() ||
    translation.principle_statement?.trim() ||
    translation.reflection?.trim() ||
    translation.practical_application?.trim() ||
    translation.prayer?.trim() ||
    translation.scripture_reference?.trim() ||
    translation.scripture_text?.trim() ||
    translation.content_tip?.trim() ||
    translation.content_tip_image_url ||
    translation.support_message?.trim() ||
    translation.support_banner_url
  );
};

const buildTranslationPayload = (
  devotionalId: string,
  language: string,
  translation: any,
  status: 'draft' | 'published' = 'draft'
): TranslationPayload => {
  const sanitized = sanitizeTranslation(translation || {});

  return {
    devotional_id: devotionalId,
    language,
    translation_source: 'manual',

    title: sanitized.title?.trim() || '',

    principle_statement:
      normalizeNullableText(sanitized.principle_statement),

    scripture_reference:
      normalizeNullableText(sanitized.scripture_reference),

    scripture_text:
      normalizeNullableText(sanitized.scripture_text),

    reflection: sanitized.reflection || '',

    practical_application:
      normalizeNullableText(sanitized.practical_application),

    prayer:
      sanitized.prayer || null,

    content_tip:
      sanitized.content_tip || null,

    content_tip_image_url:
      normalizeNullableText(sanitized.content_tip_image_url),

    support_message:
      sanitized.support_message || null,

    support_banner_url:
      normalizeNullableText(sanitized.support_banner_url),

    status,
  };
};

const validatePublishedTranslation = (translation: any) => {
  if (!translation.title?.trim()) {
    throw new Error('O título é obrigatório para publicar a tradução.');
  }

  if (!translation.reflection?.trim()) {
    throw new Error('A reflexão é obrigatória para publicar a tradução.');
  }

  if (!translation.principle_statement?.trim()) {
    throw new Error(
      'O destaque (principle statement) é obrigatório para publicar a tradução.'
    );
  }
};

export const AdminContentService = {
  // ===========================================================================
  // LANGUAGES
  // ===========================================================================

  async getLanguages(): Promise<any[]> {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data || [];
  },

  // ===========================================================================
  // TRANSLATION JOBS
  // ===========================================================================

  async getTranslationJobsByDevotional(
    devotionalId: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('devotional_id', devotionalId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  // ===========================================================================
  // DEVOTIONALS
  // ===========================================================================

  async getDevotionals(): Promise<any[]> {
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
        support_message,
        support_banner_url,
        scripture_reference,
        scripture_text,
        audio_url,
        publication_date,
        status,
        category_id,
        theme_id,
        categories (
          id,
          name
        ),
        devotional_translations (*)
      `)
      .order('publication_date', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  async getDevotional(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        *,
        devotional_translations (*),
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  },

  // ===========================================================================
  // CREATE DEVOTIONAL
  // ===========================================================================

  async createDevotional(devotional: Partial<any>): Promise<any> {
    const {
      translations,
      devotional_translations,
      ...rawPayload
    } = devotional;

    const payload = { ...rawPayload };

    if (payload.reflection) {
      payload.reflection = sanitizeHtml(payload.reflection);
    }

    if (payload.practical_application) {
      payload.practical_application = sanitizeHtml(
        payload.practical_application
      );
    }

    if (payload.prayer) {
      payload.prayer = sanitizeHtml(payload.prayer);
    }

    if (payload.content_tip) {
      payload.content_tip = sanitizeHtml(payload.content_tip);
    }

    if (payload.support_message) {
      payload.support_message = sanitizeHtml(payload.support_message);
    }

    if (!payload.category_id) {
      payload.category_id = null;
    }

    if (!payload.theme_id) {
      payload.theme_id = null;
    }

    if (!payload.principle_statement) {
      payload.principle_statement = null;
    }

    if (!payload.prayer) {
      payload.prayer = null;
    }

    if (!payload.content_tip) {
      payload.content_tip = null;
    }

    if (!payload.content_tip_image_url) {
      payload.content_tip_image_url = null;
    }

    if (!payload.support_message) {
      payload.support_message = null;
    }

    if (!payload.support_banner_url) {
      payload.support_banner_url = null;
    }

    const { data: newDevotional, error } = await supabase
      .from('devotionals')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Persist manually edited/entered translations.
    if (translations) {
      await this.saveTranslations(
        newDevotional.id,
        translations
      );
    }

    return this.getDevotional(newDevotional.id);
  },

  // ===========================================================================
  // UPDATE DEVOTIONAL
  // ===========================================================================

  async updateDevotional(
    id: string,
    updates: Partial<any>
  ): Promise<any> {
    const {
      translations,
      devotional_translations,
      ...rawPayload
    } = updates;

    const payload = { ...rawPayload };

    if (payload.reflection) {
      payload.reflection = sanitizeHtml(payload.reflection);
    }

    if (payload.practical_application) {
      payload.practical_application = sanitizeHtml(
        payload.practical_application
      );
    }

    if (payload.prayer) {
      payload.prayer = sanitizeHtml(payload.prayer);
    }

    if (payload.content_tip) {
      payload.content_tip = sanitizeHtml(payload.content_tip);
    }

    if (payload.support_message) {
      payload.support_message = sanitizeHtml(payload.support_message);
    }

    if (!payload.category_id) {
      payload.category_id = null;
    }

    if (!payload.theme_id) {
      payload.theme_id = null;
    }

    if (!payload.principle_statement) {
      payload.principle_statement = null;
    }

    if (!payload.prayer) {
      payload.prayer = null;
    }

    if (!payload.content_tip) {
      payload.content_tip = null;
    }

    if (!payload.content_tip_image_url) {
      payload.content_tip_image_url = null;
    }

    if (!payload.support_message) {
      payload.support_message = null;
    }

    if (!payload.support_banner_url) {
      payload.support_banner_url = null;
    }

    const { data: updatedDevotional, error } = await supabase
      .from('devotionals')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Persist translations independently from the base devotional.
    if (translations) {
      await this.saveTranslations(id, translations);
    }

    return this.getDevotional(updatedDevotional.id);
  },

  // ===========================================================================
  // TRANSLATIONS
  // ===========================================================================

  async saveTranslations(
    devotionalId: string,
    translations: Record<string, any>
  ): Promise<any[]> {
    const languages = Object.entries(translations);

    const records: TranslationPayload[] = [];

    for (const [language, translation] of languages) {
      if (!translation || !hasTranslationContent(translation)) {
        continue;
      }

      const status: 'draft' | 'published' =
        translation.status === 'published'
          ? 'published'
          : 'draft';

      if (status === 'published') {
        validatePublishedTranslation(translation);
      }

      records.push(
        buildTranslationPayload(
          devotionalId,
          language,
          translation,
          status
        )
      );
    }

    if (records.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('devotional_translations')
      .upsert(records, {
        onConflict:
          'devotional_id,language,translation_source',
      })
      .select();

    if (error) throw error;

    return data || [];
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
    support_message?: string | null;
    support_banner_url?: string | null;
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
      support_message,
      support_banner_url,
      status,
    } = params;

    const translation = {
      title,
      principle_statement,
      scripture_reference,
      scripture_text,
      reflection,
      practical_application,
      prayer,
      content_tip,
      content_tip_image_url,
      support_message,
      support_banner_url,
    };

    if (status === 'published') {
      validatePublishedTranslation(translation);
    }

    const payload = buildTranslationPayload(
      devotional_id,
      language,
      translation,
      status
    );

    const { data, error } = await supabase
      .from('devotional_translations')
      .upsert(payload, {
        onConflict:
          'devotional_id,language,translation_source',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // ===========================================================================
  // MANUAL TRANSLATION WORKFLOW
  // ===========================================================================

  async getDevotionalsForManualTranslation(
    targetLanguage: string
  ): Promise<any[]> {
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
        support_message,
        support_banner_url,
        scripture_reference,
        scripture_text,
        publication_date,
        status,
        content_hash,
        category_id,
        categories (
          id,
          name
        ),
        devotional_translations (*)
      `)
      .eq('status', 'published')
      .order('publication_date', {
        ascending: false,
      });

    if (error) throw error;

    return (data || []).map(devotional => {
      const translations =
        devotional.devotional_translations || [];

      const manualTrans = translations.find(
        (translation: any) =>
          translation.language === targetLanguage &&
          translation.translation_source === 'manual'
      );

      const aiTrans = translations.find(
        (translation: any) =>
          translation.language === targetLanguage &&
          translation.translation_source === 'ai'
      );

      let translationState:
        | 'none'
        | 'draft'
        | 'ai_published'
        | 'manual_published' = 'none';

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
        translationState,
      };
    });
  },

  // ===========================================================================
  // CATEGORIES
  // ===========================================================================

  async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', {
        ascending: true,
      });

    if (error) throw error;

    return data || [];
  },

  async createCategory(name: string): Promise<any> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error('O nome da categoria é obrigatório.');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: normalizedName }])
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // ===========================================================================
  // SHARE ASSETS
  // ===========================================================================

  async getShareAssets(
    devotionalId: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('devotional_share_assets')
      .select('*')
      .eq('devotional_id', devotionalId)
      .order('language_code', {
        ascending: true,
      });

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
      whatsapp_image_url:
        asset.whatsapp_image_url ?? null,
      feed_image_url:
        asset.feed_image_url ?? null,
      story_image_url:
        asset.story_image_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('devotional_share_assets')
      .upsert(payload, {
        onConflict:
          'devotional_id,language_code',
      })
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
    const ext =
      file.name.split('.').pop()?.toLowerCase() ||
      'jpg';

    const timestamp = Date.now();

    const path =
      `${devotionalId}/${languageCode}/` +
      `${type}-${timestamp}.${ext}`;

    const { error: uploadError } =
      await supabase.storage
        .from('share-assets')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from('share-assets')
        .getPublicUrl(path);

    return data.publicUrl;
  },

  // ===========================================================================
  // EDITORIAL IMAGES
  // ===========================================================================

  async uploadContentImage(
    devotionalId: string,
    languageCode: string,
    field:
      | 'content_tip_image'
      | 'support_banner',
    file: File
  ): Promise<string> {
    const ext =
      file.name.split('.').pop()?.toLowerCase() ||
      'jpg';

    const timestamp = Date.now();

    const path =
      `${devotionalId}/${languageCode}/` +
      `${field}-${timestamp}.${ext}`;

    const { error: uploadError } =
      await supabase.storage
        .from('share-assets')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from('share-assets')
        .getPublicUrl(path);

    return data.publicUrl;
  },

  // ===========================================================================
  // STORAGE DELETE
  // ===========================================================================

  async deleteShareAssetFile(
    url: string
  ): Promise<void> {
    const marker = '/share-assets/';
    const idx = url.indexOf(marker);

    if (idx === -1) {
      throw new Error(
        'URL inválida para o bucket share-assets.'
      );
    }

    const path = url
      .slice(idx + marker.length)
      .split('?')[0];

    const { error } =
      await supabase.storage
        .from('share-assets')
        .remove([path]);

    if (error) throw error;
  },
};