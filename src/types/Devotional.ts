export interface DevotionalTranslation {
  id: string;
  language: string;
  title: string;
  principle_statement?: string | null;
  reflection: string;
  practical_application?: string | null;
  prayer?: string | null;
  scripture_reference?: string | null;
  scripture_text?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  source_content_hash?: string;
  translation_source?: 'manual' | 'ai';
}

export interface DevotionalShareAsset {
  id: string;
  devotional_id: string;
  language_code: string;
  whatsapp_text: string | null;
  whatsapp_image_url: string | null;
  feed_image_url: string | null;
  story_image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ResolvedShareAsset {
  whatsapp_text: string | null;
  whatsapp_image_url: string | null;
  feed_image_url: string | null;
  story_image_url: string | null;
}

export interface Devotional {
  id: string;
  legacy_id?: number;
  publication_date?: string;
  title: string;
  principle_statement?: string | null;
  reflection: string;
  practical_application?: string | null;
  prayer?: string | null;
  scripture_reference?: string | null;
  scripture_text?: string | null;
  audio_url?: string;
  theme_id?: string;
  category_id?: string;
  categories?: { name: string } | null;
  share_quote?: string;
  content_hash?: string;
  share_assets?: ResolvedShareAsset | null;
  
  // i18n
  isLanguageFallback?: boolean;
  isCached?: boolean;
  source?: 'supabase' | 'indexeddb' | 'legacy';
  translationStatus?: 'available' | 'unavailable';
  requestedLanguage?: string;
  resolvedLanguage?: string;
  devotional_translations?: DevotionalTranslation[];
}

export interface LegacyDevotionalAdapter {
  legacy_id: number;
  devotional: Devotional;
}
