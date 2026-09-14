import { illumineFetch } from '../lib/illumine';
import type { Devotional, DevotionalTranslation, DevotionalShareAsset, ResolvedShareAsset } from '../types/Devotional';
import { principles, allPrinciples } from '../data/principles';
import { getTodayInSaoPaulo } from '../utils/date';
import { ContentCacheService } from './ContentCacheService';
import i18n from '../i18n/config';

// --- LOCAL FALLBACK: mapeia data → princípio quando L1 está indisponível --- //
const REF_MONDAY = new Date('2024-01-08T00:00:00Z'); // semana de referência

function principleForDate(dateStr: string) {
  const target = new Date(dateStr + 'T12:00:00Z');
  const daysDiff = Math.floor((target.getTime() - REF_MONDAY.getTime()) / 86400000);
  const weekIdx = Math.floor(daysDiff / 7);
  const pool = allPrinciples;
  return pool[((weekIdx % pool.length) + pool.length) % pool.length];
}

function principleToDevotional(p: ReturnType<typeof principleForDate>, dateStr: string): Devotional {
  const emptyAssets: ResolvedShareAsset = { whatsapp_text: null, whatsapp_image_url: null, feed_image_url: null, story_image_url: null };
  return {
    id: String(p.id),
    legacy_id: p.id,
    publication_date: dateStr,
    title: p.title,
    principle_statement: p.principle ?? null,
    reflection: p.reflection,
    practical_application: p.application ?? null,
    prayer: p.prayer ?? null,
    content_tip: null,
    content_tip_image_url: null,
    content_tip_url: null,
    support_message: null,
    support_banner_url: null,
    support_link_url: null,
    scripture_reference: p.reference?.citation ?? null,
    scripture_text: p.reference?.text ?? null,
    audio_url: p.audio?.url,
    category_id: undefined,
    theme_id: undefined,
    status: 'published',
    content_hash: undefined,
    categories: { name: p.category },
    devotional_translations: [],
    share_assets: emptyAssets,
    share_quote: p.principle,
    source: 'legacy' as const,
    isCached: false,
  };
}

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

  // Fallback (or if requested pt-BR directly): use the base devotional fields
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

export const DevotionalService = {

  async getDailyDevotional(dateStr: string, requestedLanguage?: string): Promise<Devotional> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);

    // 1. Serve from IndexedDB cache immediately (cache-first)
    const cached = await ContentCacheService.getDaily(dateStr, contentLanguage);
    if (cached) {
      // Refresh in the background so next open gets fresh content
      this._refreshDailyInBackground(dateStr, contentLanguage);
      return { ...cached, isCached: true, source: 'indexeddb' };
    }

    // 2. No cache — fetch from network
    return this._fetchDailyFromNetwork(dateStr, contentLanguage);
  },

  async _refreshDailyInBackground(dateStr: string, contentLanguage: string): Promise<void> {
    try {
      await this._fetchDailyFromNetwork(dateStr, contentLanguage);
    } catch {
      // silent — cache is still valid
    }
  },

  async _fetchDailyFromNetwork(dateStr: string, contentLanguage: string): Promise<Devotional> {
    try {
      const res = await illumineFetch(`/devotionals/date/${dateStr}`);

      // 404 = nenhum devocional publicado para esta data — não faz fallback
      if (res.status === 404) {
        const e = new Error('DEVOTIONAL_NOT_AVAILABLE') as Error & { code: string };
        e.code = 'DEVOTIONAL_NOT_AVAILABLE';
        throw e;
      }

      if (!res.ok) throw new Error(`L1 status ${res.status}`);

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
    } catch (err: any) {
      // Re-lança erros esperados (sem devocional hoje) sem fallback
      if (err?.code === 'DEVOTIONAL_NOT_AVAILABLE') throw err;

      console.warn('[DevotionalService] L1 indisponível, usando dados locais:', err);
      const local = principleToDevotional(principleForDate(dateStr), dateStr);
      return local;
    }
  },

  async getDevotional(id: string, requestedLanguage?: string): Promise<Devotional> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);

    try {
      const res = await illumineFetch(`/devotionals/${id}`);
      if (!res.ok) throw new Error(`L1 /devotionals/${id} falhou com status ${res.status}`);
      const raw = await res.json();
      const data = mapIllumineToDevotional(raw);
      const resolved = resolveTranslation(data, contentLanguage, 'supabase', false);
      resolved.share_assets = resolveShareAssets(contentLanguage, data.devotional_share_assets || []);
      delete (resolved as any).devotional_share_assets;
      const p = principles.find(p => p.title === data.title);
      resolved.share_quote = contentLanguage === 'pt-BR'
        ? (p?.principle || resolved.principle_statement || resolved.title)
        : (resolved.principle_statement || resolved.title);
      await ContentCacheService.setDevotional(resolved, contentLanguage);
      return resolved;
    } catch (err: any) {
      console.warn('[DevotionalService] getDevotional network failed, attempting cache:', err);
      const cached = await ContentCacheService.getDevotional(id, contentLanguage);
      if (cached) return { ...cached, isCached: true, source: 'indexeddb' };
      throw err;
    }
  },

  async getDevotionals(requestedLanguage?: string): Promise<Devotional[]> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);
    const today = getTodayInSaoPaulo();

    // 1. Serve from IndexedDB cache immediately (cache-first)
    const cachedLibrary = await ContentCacheService.getLibrary(contentLanguage);
    if (cachedLibrary) {
      // Refresh in the background so next open gets fresh content
      this._fetchLibraryFromNetwork(contentLanguage, today).catch(() => {});
      return cachedLibrary.map(d => ({ ...d, isCached: true, source: 'indexeddb' as const }));
    }

    // 2. No cache — fetch from network
    return this._fetchLibraryFromNetwork(contentLanguage, today);
  },

  async _fetchLibraryFromNetwork(contentLanguage: string, today: string): Promise<Devotional[]> {
    try {
      const res = await illumineFetch(`/devotionals?status=published&perPage=200`);
      if (!res.ok) throw new Error(`L1 status ${res.status}`);
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
    } catch (err: any) {
      console.warn('[DevotionalService] _fetchLibraryFromNetwork failed, attempting cache:', err);
      const cached = await ContentCacheService.getLibrary(contentLanguage);
      if (cached) return cached.map(d => ({ ...d, isCached: true, source: 'indexeddb' as const }));
      // Fallback: usa dados locais
      console.warn('[DevotionalService] Usando biblioteca local como fallback');
      return allPrinciples.map(p => principleToDevotional(p, today));
    }
  },

  // Lightweight fetch for category browsing — no heavy HTML content or share_assets
  async getDevotionalsForBrowse(requestedLanguage?: string): Promise<Pick<Devotional, 'id' | 'title' | 'principle_statement' | 'publication_date' | 'categories'>[]> {
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);
    const today = getTodayInSaoPaulo();

    const res = await illumineFetch(`/devotionals?status=published&perPage=200`);
    if (!res.ok) throw new Error(`[DevotionalService] L1 /devotionals falhou com status ${res.status}`);

    const json = await res.json();
    const items: any[] = json.devotionals ?? json;
    return items
      .filter(d => d.publicationDate?.substring(0, 10) <= today)
      .map(d => {
        const mapped = mapIllumineToDevotional(d);
        const resolved = resolveTranslation(mapped, contentLanguage, 'supabase', false);
        return {
          id: resolved.id,
          title: resolved.title,
          principle_statement: resolved.principle_statement,
          publication_date: mapped.publication_date,
          categories: mapped.categories,
        };
      });
  },

  // Fetch only specific devotionals by ID — used by Favorites
  async getDevotionalsByIds(ids: string[], requestedLanguage?: string): Promise<Devotional[]> {
    if (!ids.length) return [];
    const rawLanguage = requestedLanguage || i18n.language || 'pt-BR';
    const contentLanguage = normalizeLanguage(rawLanguage);

    const results = await Promise.allSettled(
      ids.map(id => illumineFetch(`/devotionals/${id}`).then(async res => {
        if (!res.ok) throw new Error(`L1 /devotionals/${id} falhou com status ${res.status}`);
        return mapIllumineToDevotional(await res.json());
      }))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => {
        const resolved = resolveTranslation(r.value, contentLanguage, 'supabase', false);
        resolved.share_assets = resolveShareAssets(contentLanguage, r.value.devotional_share_assets || []);
        delete (resolved as any).devotional_share_assets;
        return resolved;
      });
  },
};
