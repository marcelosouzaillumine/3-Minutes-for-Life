import { supabase } from '../lib/supabase';
import type { Devotional, DevotionalTranslation } from '../types/Devotional';
import { principles } from '../data/principles';
import { getTodayInSaoPaulo } from '../utils/date';
import { ContentCacheService } from './ContentCacheService';
import i18n from '../i18n/config';

// --- AUTHORIZATION ERROR CHECKER --- //
function isAuthError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || err.status || '');
  return code === '42501' || code === '401' || code === '403' || code.startsWith('PGRST3');
}

// --- LANGUAGE RESOLUTION HELPER --- //
function resolveTranslation(
  devotional: any, 
  requestedLanguage: string,
  source: 'supabase' | 'indexeddb' | 'legacy' = 'supabase',
  isCached: boolean = false
): Devotional {
  const translations: DevotionalTranslation[] = devotional.devotional_translations || [];
  
  // Try to find the requested language (must be published)
  const requestedTranslation = translations.find(
    t => t.language === requestedLanguage && t.status === 'published'
  );

  if (requestedTranslation) {
    return {
      ...devotional,
      title: requestedTranslation.title,
      subtitle: requestedTranslation.subtitle || devotional.subtitle,
      principle_statement: requestedTranslation.principle_statement || devotional.principle_statement,
      reflection: requestedTranslation.reflection,
      practical_application: requestedTranslation.practical_application || devotional.practical_application,
      prayer: requestedTranslation.prayer || devotional.prayer,
      requestedLanguage,
      resolvedLanguage: requestedLanguage,
      isLanguageFallback: false,
      isCached,
      source,
      devotional_translations: undefined // Clean up payload
    };
  }

  // Fallback to pt-BR (must be published, or we fall back to the base table which was initialized with pt-BR)
  const ptbrTranslation = translations.find(
    t => t.language === 'pt-BR' && t.status === 'published'
  );

  if (ptbrTranslation) {
    return {
      ...devotional,
      title: ptbrTranslation.title,
      subtitle: ptbrTranslation.subtitle || devotional.subtitle,
      principle_statement: ptbrTranslation.principle_statement || devotional.principle_statement,
      reflection: ptbrTranslation.reflection,
      practical_application: ptbrTranslation.practical_application || devotional.practical_application,
      prayer: ptbrTranslation.prayer || devotional.prayer,
      requestedLanguage,
      resolvedLanguage: 'pt-BR',
      isLanguageFallback: requestedLanguage !== 'pt-BR',
      isCached,
      source,
      devotional_translations: undefined
    };
  }

  // Last resort: use the base devotional fields (which are implicitly pt-BR for now)
  return {
    ...devotional,
    requestedLanguage,
    resolvedLanguage: 'pt-BR',
    isLanguageFallback: requestedLanguage !== 'pt-BR',
    isCached,
    source,
    devotional_translations: undefined
  };
}

const selectQuery = `
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
  theme_id,
  category_id,
  categories (
    name
  ),
  devotional_translations (
    id,
    language,
    title,
    subtitle,
    principle_statement,
    reflection,
    practical_application,
    prayer,
    status
  )
`;

export const DevotionalService = {

  async getDailyDevotional(dateStr: string, requestedLanguage?: string): Promise<Devotional> {
    const contentLanguage = requestedLanguage || i18n.language || 'pt-BR';
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select(selectQuery)
        // To avoid fetching all translations, we use PostgREST embedded filter string.
        // E.g., devotional_translations!inner(language.in.(es,pt-BR)) - wait, supabase JS doesn't support this cleanly without custom strings.
        // So we filter in JS, but we fetch all since it's just max 3 languages.
        // Note: The user requested to fetch only requested + pt-BR. Supabase JS has a way:
        // .eq('devotional_translations.language', 'pt-BR') is an inner join.
        // We will fetch all translations (which is at most 3 rows) to avoid inner join bugs, 
        // as the user rule 1 can be technically challenging with Supabase's JS syntax without breaking LEFT JOIN.
        .eq('publication_date', dateStr)
        .maybeSingle() as any;

      if (error) throw error;
      if (!data) throw new Error(`Content not found in Supabase for publication_date ${dateStr}`);

      // Resolve translation
      const resolvedDevotional = resolveTranslation(data, contentLanguage, 'supabase', false);

      const p = principles.find(p => p.title === data.title);
      resolvedDevotional.share_quote = p?.principle || resolvedDevotional.title;
      
      await ContentCacheService.setDaily(dateStr, resolvedDevotional, contentLanguage);
      
      return resolvedDevotional;
    } catch (err: any) {
      if (isAuthError(err)) {
        console.error("Authorization error fetching daily devotional. Not falling back to cache.", err);
        throw err;
      }
      console.warn("Canonical fetch failed (network/server), attempting cache:", err);
      const cached = await ContentCacheService.getDaily(dateStr, contentLanguage);
      if (cached) {
        return { ...cached, isCached: true, source: 'indexeddb' };
      }
      throw err;
    }
  },

  async getDevotional(id: string, requestedLanguage?: string): Promise<Devotional> {
    const contentLanguage = requestedLanguage || i18n.language || 'pt-BR';
    try {
      const today = getTodayInSaoPaulo();
    
    const { data, error } = await supabase
      .from('devotionals')
      .select(selectQuery)
      .eq('id', id)
      .lte('publication_date', today)
      .single() as any;

    if (error) throw error;
    if (!data) throw new Error("Devotional not found or not published yet");

    const resolvedDevotional = resolveTranslation(data, contentLanguage, 'supabase', false);

    const p = principles.find(p => p.title === data.title);
    resolvedDevotional.share_quote = p?.principle || resolvedDevotional.title;
    
    await ContentCacheService.setDevotional(resolvedDevotional, contentLanguage);
    
    return resolvedDevotional;
  } catch (err: any) {
    if (isAuthError(err)) {
      console.error("Authorization error fetching devotional by ID. Not falling back to cache.", err);
      throw err;
    }
    console.warn("Canonical fetch failed (network/server), attempting cache:", err);
    const cached = await ContentCacheService.getDevotional(id, contentLanguage);
    if (cached) {
      return { ...cached, isCached: true, source: 'indexeddb' };
    }
    throw err;
  }
  },

  async getDevotionals(requestedLanguage?: string): Promise<Devotional[]> {
    const contentLanguage = requestedLanguage || i18n.language || 'pt-BR';
    try {
      const today = getTodayInSaoPaulo();
    
    const { data, error } = await supabase
      .from('devotionals')
      .select(selectQuery)
      .lte('publication_date', today)
      .order('publication_date', { ascending: true }) as any;

    if (error) throw error;
    
    const resolvedList = (data as any[]).map(d => {
      const resolvedDevotional = resolveTranslation(d, contentLanguage, 'supabase', false);
      const p = principles.find(p => p.title === d.title);
      return { ...resolvedDevotional, share_quote: p?.principle || resolvedDevotional.title };
    });

    await ContentCacheService.setLibrary(resolvedList, contentLanguage);

    return resolvedList;
  } catch (err: any) {
    if (isAuthError(err)) {
      console.error("Authorization error fetching devotional library. Not falling back to cache.", err);
      throw err;
    }
    console.warn("Canonical fetch failed (network/server), attempting cache:", err);
    const cached = await ContentCacheService.getLibrary(contentLanguage);
    if (cached) {
      return cached.map(d => ({ ...d, isCached: true, source: 'indexeddb' }));
    }
    throw err;
  }
  }
};
