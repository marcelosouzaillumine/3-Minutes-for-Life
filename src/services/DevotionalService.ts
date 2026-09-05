import { supabase } from '../lib/supabase';
import { illumineFetch, illumineAuth } from '../lib/illumine';
import type { Devotional, DevotionalTranslation, DevotionalShareAsset, ResolvedShareAsset } from '../types/Devotional';
import { principles } from '../data/principles';
import { getTodayInSaoPaulo } from '../utils/date';
import { ContentCacheService } from './ContentCacheService';
import i18n from '../i18n/config';

// --- ILLUMINE → SUPABASE FORMAT MAPPER --- //
// Uses supabaseId as the canonical id so user state (favorites, status) stays consistent.
function mapIllumineToDevotional(d: any): any {
  return {
    id: d.supabaseId ?? d.id,
    legacy_id: d.legacyId,
    publication_date: d.publicationDate?.substring(0, 10),
    title: d.title,
    principle_statement: d.principleStatement ?? null,
    reflection: d.reflection,
    practical_application: d.practicalApplication ?? null,
    prayer: d.prayer ?? null,
    content_tip: d.contentTip ?? null,
    content_tip_image_url: d.contentTipImageUrl ?? null,
    content_tip_url: d.contentTipUrl ?? null,
    support_message: d.supportMessage ?? null,
    support_banner_url: d.supportBannerUrl ?? null,
    support_link_url: d.supportLinkUrl ?? null,
    scripture_reference: d.scriptureReference ?? null,
    scripture_text: d.scriptureText ?? null,
    audio_url: d.audioUrl ?? null,
    category_id: d.categoryId ?? null,
    theme_id: d.themeId ?? null,
    status: d.status,
    content_hash: d.contentHash ?? null,
    categories: d.category ? { name: d.category.name } : null,
    devotional_translations: (d.translations ?? []).map((t: any) => ({
      id: t.id,
      language: t.language,
      title: t.title,
      principle_statement: t.principleStatement ?? null,
      reflection: t.reflection,
      practical_application: t.practicalApplication ?? null,
      prayer: t.prayer ?? null,
      content_tip: t.contentTip ?? null,
      content_tip_image_url: t.contentTipImageUrl ?? null,
      content_tip_url: t.contentTipUrl ?? null,
      support_message: t.supportMessage ?? null,
      support_banner_url: t.supportBannerUrl ?? null,
      support_link_url: t.supportLinkUrl ?? null,
      scripture_reference: t.scriptureReference ?? null,
      scripture_text: t.scriptureText ?? null,
      status: t.status,
      source_content_hash: t.sourceContentHash ?? null,
      translation_source: t.translationSource ?? 'manual',
    })),
    devotional_share_assets: (d.shareAssets ?? []).map((a: any) => ({
      id: a.id,
      devotional_id: d.supabaseId ?? d.id,
      language_code: a.languageCode,
      whatsapp_text: a.whatsappText ?? null,
      whatsapp_image_url: a.whatsappImageUrl ?? null,
      feed_image_url: a.feedImageUrl ?? null,
      story_image_url: a.storyImageUrl ?? null,
    })),
  };
}

// --- AUTHORIZATION ERROR CHECKER --- //
function isAuthError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || err.status || '');
  return code === '42501' || code === '401' || code === '403' || code.startsWith('PGRST3');
}

// --- LANGUAGE RESOLUTION HELPER --- //
export function normalizeLanguage(lang?: string): string {
  if (!lang) return 'pt-BR';
  if (lang === 'pt-BR' || lang === 'pt' || lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  return lang;
}

export function resolveShareAssets(
  requestedLanguage: string,
  assets: DevotionalShareAsset[]
): ResolvedShareAsset {
  const targetLang = normalizeLanguage(requestedLanguage);
  const shareAssetsList = assets || [];

  const targetAsset = shareAssetsList.find(sa => sa.language_code === targetLang);

  return {
    whatsapp_text: targetAsset?.whatsapp_text || null,
    whatsapp_image_url: targetAsset?.whatsapp_image_url || null,
    feed_image_url: targetAsset?.feed_image_url || null,
    story_image_url: targetAsset?.story_image_url || null
  };
}

export function resolveTranslation(
  devotional: any, 
  requestedLanguage: string,
  source: 'supabase' | 'indexeddb' | 'legacy' = 'supabase',
  isCached: boolean = false
): Devotional {
  const translations: DevotionalTranslation[] = devotional.devotional_translations || [];
  const targetLang = normalizeLanguage(requestedLanguage);

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
        content_tip: requestedTranslation.content_tip || null,
        content_tip_image_url: requestedTranslation.content_tip_image_url || null,
        content_tip_url: requestedTranslation.content_tip_url || null,
        support_message: requestedTranslation.support_message || null,
        support_banner_url: requestedTranslation.support_banner_url || null,
        support_link_url: requestedTranslation.support_link_url || null,
        scripture_reference: (requestedTranslation.scripture_reference !== undefined && requestedTranslation.scripture_reference !== null)
          ? requestedTranslation.scripture_reference
          : (devotional.scripture_reference || null),
        scripture_text: (requestedTranslation.scripture_text !== undefined && requestedTranslation.scripture_text !== null)
          ? requestedTranslation.scripture_text
          : (devotional.scripture_text || null),
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

// Lightweight select for browse/explore — no heavy HTML content, no share_assets
const selectQueryBrowse = `
  id,
  title,
  principle_statement,
  publication_date,
  categories (
    name
  ),
  devotional_translations (
    id,
    language,
    title,
    principle_statement,
    status,
    translation_source
  )
`;

const selectQuery = `
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
  theme_id,
  category_id,
  content_hash,
  categories (
    name
  ),
  devotional_share_assets (
    id,
    language_code,
    whatsapp_text,
    whatsapp_image_url,
    feed_image_url,
    story_image_url
  ),
  devotional_translations (
    id,
    language,
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
    status,
    source_content_hash,
    translation_source
  )
`;

export const DevotionalService = {

  async getDailyDevotional(dateStr: string, requestedLanguage?: string): Promise<Devotional> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);

    // 1. Try Illumine OS (Railway) first
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/devotionals/date/${dateStr}`);
        if (res.ok) {
          const raw = await res.json();
          const data = mapIllumineToDevotional(raw);
          const resolved = resolveTranslation(data, contentLanguage, 'supabase', false);
          resolved.share_assets = resolveShareAssets(contentLanguage, data.devotional_share_assets || []);
          delete (resolved as any).devotional_share_assets;
          const p = principles.find(p => p.title === data.title);
          resolved.share_quote = contentLanguage === 'pt-BR'
            ? (p?.principle || resolved.principle_statement || resolved.title)
            : (resolved.principle_statement || resolved.title);
          await ContentCacheService.setDaily(dateStr, resolved, contentLanguage);
          return resolved;
        }
      } catch (e) {
        console.warn('[Devotional] Illumine fetch failed, falling back to Supabase:', e);
      }
    }

    // 2. Fall back to Supabase
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select(selectQuery)
        .eq('status', 'published')
        .eq('publication_date', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      if (error) throw error;
      if (!data) throw new Error(`Content not found in Supabase for publication_date ${dateStr}`);

      const resolvedDevotional = resolveTranslation(data, contentLanguage, 'supabase', false);
      resolvedDevotional.share_assets = resolveShareAssets(contentLanguage, data.devotional_share_assets || []);
      delete (resolvedDevotional as any).devotional_share_assets;

      const p = principles.find(p => p.title === data.title);
      resolvedDevotional.share_quote = contentLanguage === 'pt-BR'
        ? (p?.principle || resolvedDevotional.principle_statement || resolvedDevotional.title)
        : (resolvedDevotional.principle_statement || resolvedDevotional.title);

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
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);
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
      resolvedDevotional.share_assets = resolveShareAssets(contentLanguage, data.devotional_share_assets || []);
      delete (resolvedDevotional as any).devotional_share_assets;

      const p = principles.find(p => p.title === data.title);
      resolvedDevotional.share_quote = contentLanguage === 'pt-BR'
        ? (p?.principle || resolvedDevotional.principle_statement || resolvedDevotional.title)
        : (resolvedDevotional.principle_statement || resolvedDevotional.title);
      
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
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);
    const today = getTodayInSaoPaulo();

    // 1. Try Illumine OS (Railway) first
    if (illumineAuth.isAuthenticated()) {
      try {
        const res = await illumineFetch(`/devotionals?status=published&perPage=200`);
        if (res.ok) {
          const json = await res.json();
          const items: any[] = json.devotionals ?? json;
          const resolved = items
            .filter(d => d.publicationDate?.substring(0, 10) <= today)
            .sort((a, b) => (a.publicationDate ?? '').localeCompare(b.publicationDate ?? ''))
            .map(d => {
              const mapped = mapIllumineToDevotional(d);
              const r = resolveTranslation(mapped, contentLanguage, 'supabase', false);
              r.share_assets = resolveShareAssets(contentLanguage, mapped.devotional_share_assets || []);
              delete (r as any).devotional_share_assets;
              const p = principles.find(p => p.title === mapped.title);
              r.share_quote = contentLanguage === 'pt-BR'
                ? (p?.principle || r.principle_statement || r.title)
                : (r.principle_statement || r.title);
              return r;
            });
          await ContentCacheService.setLibrary(resolved, contentLanguage);
          return resolved;
        }
      } catch (e) {
        console.warn('[Devotional] Illumine list failed, falling back to Supabase:', e);
      }
    }

    // 2. Fall back to Supabase
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select(selectQuery)
        .eq('status', 'published')
        .lte('publication_date', today)
        .order('publication_date', { ascending: true }) as any;

      if (error) throw error;

      const resolvedList = (data as any[]).map(d => {
        const resolvedDevotional = resolveTranslation(d, contentLanguage, 'supabase', false);
        resolvedDevotional.share_assets = resolveShareAssets(contentLanguage, d.devotional_share_assets || []);
        delete (resolvedDevotional as any).devotional_share_assets;
        const p = principles.find(p => p.title === d.title);
        const quote = contentLanguage === 'pt-BR'
          ? (p?.principle || resolvedDevotional.principle_statement || resolvedDevotional.title)
          : (resolvedDevotional.principle_statement || resolvedDevotional.title);
        return { ...resolvedDevotional, share_quote: quote };
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
  },

  // Lightweight fetch for category browsing — no heavy HTML content or share_assets
  async getDevotionalsForBrowse(requestedLanguage?: string): Promise<Pick<Devotional, 'id' | 'title' | 'principle_statement' | 'publication_date' | 'categories'>[]> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);
    const today = getTodayInSaoPaulo();

    const { data, error } = await supabase
      .from('devotionals')
      .select(selectQueryBrowse)
      .eq('status', 'published')
      .lte('publication_date', today)
      .order('publication_date', { ascending: true }) as any;

    if (error) throw error;

    return (data as any[]).map(d => {
      const resolved = resolveTranslation(d, contentLanguage, 'supabase', false);
      return {
        id: resolved.id,
        title: resolved.title,
        principle_statement: resolved.principle_statement,
        publication_date: d.publication_date,
        categories: d.categories,
      };
    });
  },

  // Fetch only specific devotionals by ID — used by Favorites to avoid loading the full library
  async getDevotionalsByIds(ids: string[], requestedLanguage?: string): Promise<Devotional[]> {
    if (!ids.length) return [];
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);

    const { data, error } = await supabase
      .from('devotionals')
      .select(selectQuery)
      .in('id', ids)
      .eq('status', 'published') as any;

    if (error) throw error;

    return (data as any[]).map(d => {
      const resolved = resolveTranslation(d, contentLanguage, 'supabase', false);
      resolved.share_assets = resolveShareAssets(contentLanguage, d.devotional_share_assets || []);
      delete (resolved as any).devotional_share_assets;
      return resolved;
    });
  },
};
