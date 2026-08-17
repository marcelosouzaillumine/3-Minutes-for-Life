export interface Devotional {
  id: string; // UUID canonical
  title: string;
  reflection: string;
  practical_application?: string;
  scripture_reference?: string;
  scripture_text?: string;
  audio_url?: string;
  theme_id?: string;
  category_id?: string;
  categories?: { name: string } | null;
  share_quote?: string;
}

export interface LegacyDevotionalAdapter {
  legacy_id: number;
  devotional: Devotional;
}
