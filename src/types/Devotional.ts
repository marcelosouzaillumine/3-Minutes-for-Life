export interface DevotionalTranslation {
  id: string;
  language: string;
  title: string;
  subtitle?: string | null;
  principle_statement?: string | null;
  reflection: string;
  practical_application?: string | null;
  prayer?: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
}

export interface Devotional {
  id: string;
  legacy_id?: number;
  publication_date?: string;
  title: string;
  subtitle?: string | null;
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
  
  // i18n
  isLanguageFallback?: boolean;
  isCached?: boolean;
  source?: 'supabase' | 'indexeddb' | 'legacy';
  requestedLanguage?: string;
  resolvedLanguage?: string;
  devotional_translations?: DevotionalTranslation[];
}

export interface LegacyDevotionalAdapter {
  legacy_id: number;
  devotional: Devotional;
}
