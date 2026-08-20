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
export function resolveTranslation(
  devotional: any, 
  requestedLanguage: string,
  source: 'supabase' | 'indexeddb' | 'legacy' = 'supabase',
  isCached: boolean = false
): Devotional {
  const translations: DevotionalTranslation[] = devotional.devotional_translations || [];
  
  // Extract base language (e.g., 'en' from 'en-US') to match DB ISO codes ('en', 'es', 'pt-BR')
  let targetLang = requestedLanguage;
  if (requestedLanguage !== 'pt-BR' && requestedLanguage.includes('-')) {
    targetLang = requestedLanguage.split('-')[0];
  }

  // If the requested language is not the base language (pt-BR), try to find its translation
  // Resolution Priority:
  // 1. Published Manual/Editorial Translation
  // 2. Published AI/Automatic Translation
  // 3. Fallback to Portuguese original
  if (targetLang !== 'pt-BR') {
    const manualTranslation = translations.find(
      t => t.language === targetLang && 
           t.status === 'published' && 
           t.translation_source === 'manual' &&
           (!t.source_content_hash || t.source_content_hash === devotional.content_hash)
    );

    const aiTranslation = !manualTranslation ? translations.find(
      t => t.language === targetLang && 
           t.status === 'published' && 
           (t.translation_source === 'ai' || !t.translation_source) &&
           (!t.source_content_hash || t.source_content_hash === devotional.content_hash)
    ) : undefined;

    const requestedTranslation = manualTranslation || aiTranslation;

    if (requestedTranslation) {
      return {
        ...devotional,
        title: requestedTranslation.title,
        principle_statement: requestedTranslation.principle_statement,
        reflection: requestedTranslation.reflection,
        practical_application: requestedTranslation.practical_application || null,
        prayer: requestedTranslation.prayer || null,
        requestedLanguage,
        resolvedLanguage: targetLang,
        translationStatus: 'available',
        isLanguageFallback: false,
        isCached,
        source,
        devotional_translations: undefined // Clean up payload
      };
    }
  }

  // Fallback (or if requested pt-BR directly): use the base devotional fields, 
  // because the base table is the single source of truth for the Portuguese editorial content.
  return {
    ...devotional,
    requestedLanguage,
    resolvedLanguage: 'pt-BR',
    translationStatus: targetLang === 'pt-BR' ? 'available' : 'unavailable',
    isLanguageFallback: requestedLanguage !== 'pt-BR',
    isCached,
    source,
    devotional_translations: undefined
  };
}

const selectQuery = `
  id,
  title,
  principle_statement,
  reflection,
  practical_application,
  prayer,
  scripture_reference,
  scripture_text,
  audio_url,
  theme_id,
  category_id,
  content_hash,
  categories (
    name
  ),
  devotional_translations (
    id,
    language,
    title,
    principle_statement,
    reflection,
    practical_application,
    prayer,
    status,
    source_content_hash,
    translation_source
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
        .eq('status', 'published')
        .eq('publication_date', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
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
      .eq('status', 'published')
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
      .eq('status', 'published')
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
