import { sanitizeHtml } from '../lib/sanitizer';
import { illumineFetch } from '../lib/illumine';
import { uploadToStorage } from '../lib/storageUpload';

// ─── Languages (hardcoded from tenant config — pt-BR is source) ───────────────

const LANGUAGES = [
  { iso_code: 'pt-BR', name: 'Português (Brasil)', flag_emoji: '🇧🇷', is_source: true,  is_active: true, display_order: 1 },
  { iso_code: 'en',    name: 'English',             flag_emoji: '🇺🇸', is_source: false, is_active: true, display_order: 2 },
  { iso_code: 'es',    name: 'Spanish',             flag_emoji: '🇪🇸', is_source: false, is_active: true, display_order: 3 },
]

// ─── Field-name converters ────────────────────────────────────────────────────

function l1TransToSnake(t: any): any {
  if (!t) return t
  return {
    id: t.id,
    devotional_id: t.devotionalId,
    tenant_id: t.tenantId,
    language: t.language,
    translation_source: t.translationSource,
    title: t.title,
    principle_statement: t.principleStatement ?? null,
    scripture_reference: t.scriptureReference ?? null,
    scripture_text: t.scriptureText ?? null,
    reflection: t.reflection,
    practical_application: t.practicalApplication ?? null,
    prayer: t.prayer ?? null,
    content_tip: t.contentTip ?? null,
    content_tip_image_url: t.contentTipImageUrl ?? null,
    content_tip_url: t.contentTipUrl ?? null,
    support_message: t.supportMessage ?? null,
    support_banner_url: t.supportBannerUrl ?? null,
    support_link_url: t.supportLinkUrl ?? null,
    status: t.status,
    source_content_hash: t.sourceContentHash ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

function l1DevToSnake(d: any): any {
  if (!d) return d
  return {
    id: d.id,
    title: d.title,
    publication_date: d.publicationDate
      ? (typeof d.publicationDate === 'string'
          ? d.publicationDate.slice(0, 10)
          : new Date(d.publicationDate).toISOString().slice(0, 10))
      : null,
    status: d.status,
    principle_statement: d.principleStatement ?? null,
    scripture_reference: d.scriptureReference ?? null,
    scripture_text: d.scriptureText ?? null,
    reflection: d.reflection,
    practical_application: d.practicalApplication ?? null,
    prayer: d.prayer ?? null,
    content_tip: d.contentTip ?? null,
    content_tip_image_url: d.contentTipImageUrl ?? null,
    content_tip_url: d.contentTipUrl ?? null,
    support_message: d.supportMessage ?? null,
    support_banner_url: d.supportBannerUrl ?? null,
    support_link_url: d.supportLinkUrl ?? null,
    audio_url: d.audioUrl ?? null,
    category_id: d.categoryId ?? null,
    theme_id: d.themeId ?? null,
    legacy_id: d.legacyId ?? null,
    content_hash: d.contentHash ?? null,
    supabase_id: d.supabaseId ?? null,
    categories: d.category ?? null,
    devotional_translations: (d.translations ?? []).map(l1TransToSnake),
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

function snakeDevToL1Camel(devotional: Partial<any>): Record<string, any> {
  const {
    translations, devotional_translations, categories,
    publication_date, principle_statement, scripture_reference, scripture_text,
    practical_application, content_tip, content_tip_image_url, content_tip_url,
    support_message, support_banner_url, support_link_url, audio_url,
    category_id, theme_id, legacy_id, content_hash,
    created_at, updated_at, ...rest
  } = devotional
  return {
    ...rest,
    ...(publication_date !== undefined   && { publicationDate: publication_date }),
    ...(principle_statement !== undefined && { principleStatement: principle_statement }),
    ...(scripture_reference !== undefined && { scriptureReference: scripture_reference }),
    ...(scripture_text !== undefined      && { scriptureText: scripture_text }),
    ...(practical_application !== undefined && { practicalApplication: practical_application }),
    ...(content_tip !== undefined          && { contentTip: content_tip }),
    ...(content_tip_image_url !== undefined && { contentTipImageUrl: content_tip_image_url }),
    ...(content_tip_url !== undefined      && { contentTipUrl: content_tip_url }),
    ...(support_message !== undefined      && { supportMessage: support_message }),
    ...(support_banner_url !== undefined   && { supportBannerUrl: support_banner_url }),
    ...(support_link_url !== undefined     && { supportLinkUrl: support_link_url }),
    ...(audio_url !== undefined            && { audioUrl: audio_url }),
    ...(category_id !== undefined          && { categoryId: category_id }),
    ...(theme_id !== undefined             && { themeId: theme_id }),
    ...(legacy_id !== undefined            && { legacyId: legacy_id }),
    ...(content_hash !== undefined         && { contentHash: content_hash }),
  }
}

async function l1Get(path: string): Promise<any> {
  const res = await illumineFetch(path)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`L1 GET ${path} ${res.status}: ${JSON.stringify(body)}`)
  }
  return res.json()
}

async function l1Post(path: string, body: any): Promise<any> {
  const res = await illumineFetch(path, { method: 'POST', body: JSON.stringify(body) })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`L1 POST ${path} ${res.status}: ${JSON.stringify(b)}`)
  }
  return res.json()
}

async function l1Patch(path: string, body: any): Promise<any> {
  const res = await illumineFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`L1 PATCH ${path} ${res.status}: ${JSON.stringify(b)}`)
  }
  return res.json()
}

async function l1Put(path: string, body: any): Promise<any> {
  const res = await illumineFetch(path, { method: 'PUT', body: JSON.stringify(body) })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`L1 PUT ${path} ${res.status}: ${JSON.stringify(b)}`)
  }
  return res.json()
}

async function l1Delete(path: string): Promise<void> {
  const res = await illumineFetch(path, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    const b = await res.json().catch(() => ({}))
    throw new Error(`L1 DELETE ${path} ${res.status}: ${JSON.stringify(b)}`)
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const AdminContentService = {
  async getLanguages(): Promise<any[]> {
    return LANGUAGES
  },

  async getTranslationJobsByDevotional(devotionalId: string): Promise<any[]> {
    const data = await l1Get(`/devotionals/translations/jobs?devotionalId=${encodeURIComponent(devotionalId)}`)
    return (Array.isArray(data) ? data : data?.jobs ?? []).map((j: any) => ({
      id: j.id,
      devotional_id: j.devotionalId,
      tenant_id: j.tenantId,
      source_language: j.sourceLanguage,
      target_language: j.targetLanguage,
      status: j.status,
      attempts: j.attempts,
      error_message: j.errorMessage ?? null,
      created_at: j.createdAt,
      updated_at: j.updatedAt,
    }))
  },

  async getDevotionals(): Promise<any[]> {
    const data = await l1Get('/devotionals?perPage=200')
    return (data?.devotionals ?? []).map(l1DevToSnake)
  },

  async getDevotional(id: string): Promise<any> {
    const d = await l1Get(`/devotionals/${encodeURIComponent(id)}`)
    return l1DevToSnake(d)
  },

  async createDevotional(devotional: Partial<any>): Promise<any> {
    const { translations, devotional_translations, categories, ...payload } = devotional
    if (payload.reflection) payload.reflection = sanitizeHtml(payload.reflection)
    if (payload.practical_application) payload.practical_application = sanitizeHtml(payload.practical_application)
    if (payload.prayer) payload.prayer = sanitizeHtml(payload.prayer)
    const l1Payload = snakeDevToL1Camel(payload)
    const d = await l1Post('/devotionals', l1Payload)
    return l1DevToSnake(d)
  },

  async updateDevotional(id: string, updates: Partial<any>): Promise<any> {
    const { translations, devotional_translations, categories, ...payload } = updates
    if (payload.reflection) payload.reflection = sanitizeHtml(payload.reflection)
    if (payload.practical_application) payload.practical_application = sanitizeHtml(payload.practical_application)
    if (payload.prayer) payload.prayer = sanitizeHtml(payload.prayer)
    const l1Payload = snakeDevToL1Camel(payload)
    const d = await l1Patch(`/devotionals/${encodeURIComponent(id)}`, l1Payload)
    return l1DevToSnake(d)
  },

  async deleteDevotional(id: string): Promise<void> {
    await l1Delete(`/devotionals/${encodeURIComponent(id)}`)
  },

  async getCategories(): Promise<any[]> {
    const cats = await l1Get('/devotionals/categories')
    return (Array.isArray(cats) ? cats : [])
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-BR', { sensitivity: 'base' }))
  },

  async createCategory(name: string): Promise<any> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return l1Post('/devotionals/categories', { name, slug })
  },

  async updateCategory(id: string, name: string): Promise<any> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return l1Patch(`/devotionals/categories/${encodeURIComponent(id)}`, { name, slug })
  },

  async deleteCategory(id: string): Promise<void> {
    await l1Delete(`/devotionals/categories/${encodeURIComponent(id)}`)
  },

  async getDevotionalsWithAllTranslations(): Promise<any[]> {
    const data = await l1Get('/devotionals?status=published&perPage=500')
    const devotionals = (data?.devotionals ?? []).map(l1DevToSnake)

    return devotionals.map((devotional: any) => {
      const langMap: Record<string, { manual: any; ai: any; state: string; isStale: boolean; isPossiblyStale: boolean }> = {}

      for (const t of devotional.devotional_translations || []) {
        const lang = t.language
        if (!langMap[lang]) langMap[lang] = { manual: null, ai: null, state: 'none', isStale: false, isPossiblyStale: false }
        if (t.translation_source === 'manual') langMap[lang].manual = t
        else langMap[lang].ai = t
      }

      for (const lang of Object.keys(langMap)) {
        const { manual, ai } = langMap[lang]
        let active: any = null
        if (manual?.status === 'published') { langMap[lang].state = 'manual_published'; active = manual }
        else if (manual?.status === 'draft') { langMap[lang].state = 'draft'; active = manual }
        else if (ai?.status === 'published') { langMap[lang].state = 'ai_published'; active = ai }
        else { langMap[lang].state = 'draft'; active = ai }

        // Desatualizada (confirmado): a tradução tem hash de origem gravado e
        // ele não bate mais com o hash atual do devocional.
        langMap[lang].isStale = !!(
          active?.source_content_hash &&
          devotional.content_hash &&
          active.source_content_hash !== devotional.content_hash
        )

        // Desatualizada (possível, não confirmada): tradução antiga, de antes
        // do hash de origem existir (source_content_hash nulo), então não dá
        // pra comparar com precisão. Usa data como indício: se o devocional
        // foi editado depois da última vez que a tradução foi salva, pode ter
        // ficado pra trás — mas qualquer edição (até de campo não traduzível)
        // bate esse sinal, então é heurística, não confirmação.
        langMap[lang].isPossiblyStale = !!(
          !langMap[lang].isStale &&
          active &&
          !active.source_content_hash &&
          devotional.updated_at &&
          active.updated_at &&
          new Date(devotional.updated_at).getTime() > new Date(active.updated_at).getTime()
        )
      }

      return { ...devotional, langMap }
    })
  },

  async getDevotionalsForManualTranslation(targetLanguage: string): Promise<any[]> {
    const data = await l1Get('/devotionals?status=published&perPage=500')
    const devotionals = (data?.devotionals ?? []).map(l1DevToSnake)

    return devotionals.map((devotional: any) => {
      const translations = devotional.devotional_translations || []
      const manualTrans = translations.find(
        (t: any) => t.language === targetLanguage && t.translation_source === 'manual'
      )
      const aiTrans = translations.find(
        (t: any) => t.language === targetLanguage && (t.translation_source === 'ai' || !t.translation_source)
      )

      let translationState: 'none' | 'draft' | 'ai_published' | 'manual_published' = 'none'
      if (manualTrans?.status === 'published') translationState = 'manual_published'
      else if (manualTrans?.status === 'draft') translationState = 'draft'
      else if (aiTrans?.status === 'published') translationState = 'ai_published'

      return { ...devotional, manualTranslation: manualTrans || null, aiTranslation: aiTrans || null, translationState }
    })
  },

  async saveManualTranslation(params: {
    devotional_id: string
    language: string
    title: string
    principle_statement?: string | null
    scripture_reference?: string | null
    scripture_text?: string | null
    reflection: string
    practical_application?: string | null
    prayer?: string | null
    content_tip?: string | null
    content_tip_image_url?: string | null
    content_tip_url?: string | null
    support_message?: string | null
    support_banner_url?: string | null
    support_link_url?: string | null
    status: 'draft' | 'published'
    source_content_hash?: string | null
  }): Promise<any> {
    if (params.status === 'published') {
      if (!params.title?.trim()) throw new Error('O título é obrigatório para publicar a tradução.')
      if (!params.reflection?.trim()) throw new Error('A reflexão é obrigatória para publicar a tradução.')
      if (!params.principle_statement?.trim()) throw new Error('O destaque (principle statement) é obrigatório para publicar a tradução.')
    }

    const l1Body = {
      language: params.language,
      translationSource: 'manual',
      title: params.title?.trim() || '',
      principleStatement: params.principle_statement?.trim() || undefined,
      scriptureReference: params.scripture_reference?.trim() || undefined,
      scriptureText: params.scripture_text?.trim() || undefined,
      reflection: params.reflection ? sanitizeHtml(params.reflection) : '',
      practicalApplication: params.practical_application ? sanitizeHtml(params.practical_application) : undefined,
      prayer: params.prayer ? sanitizeHtml(params.prayer) : undefined,
      contentTip: params.content_tip ? sanitizeHtml(params.content_tip) : undefined,
      contentTipImageUrl: params.content_tip_image_url || undefined,
      contentTipUrl: params.content_tip_url || undefined,
      supportMessage: params.support_message ? sanitizeHtml(params.support_message) : undefined,
      supportBannerUrl: params.support_banner_url || undefined,
      supportLinkUrl: params.support_link_url || undefined,
      status: params.status,
      sourceContentHash: params.source_content_hash || undefined,
    }

    const t = await l1Put(`/devotionals/${encodeURIComponent(params.devotional_id)}/translations`, l1Body)
    return l1TransToSnake({ ...t, devotionalId: params.devotional_id })
  },

  // ─── Share Assets ──────────────────────────────────────────────────────────

  async getShareAssets(devotionalId: string): Promise<any[]> {
    const data = await l1Get(`/devotionals/${encodeURIComponent(devotionalId)}/share-assets`)
    return (Array.isArray(data) ? data : []).map((a: any) => ({
      id: a.id,
      devotional_id: a.devotionalId,
      language_code: a.languageCode,
      whatsapp_text: a.whatsappText ?? null,
      whatsapp_image_url: a.whatsappImageUrl ?? null,
      feed_image_url: a.feedImageUrl ?? null,
      story_image_url: a.storyImageUrl ?? null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }))
  },

  async saveShareAsset(asset: {
    devotional_id: string
    language_code: string
    whatsapp_text?: string | null
    whatsapp_image_url?: string | null
    feed_image_url?: string | null
    story_image_url?: string | null
  }): Promise<any> {
    const l1Body = {
      languageCode: asset.language_code,
      whatsappText: asset.whatsapp_text ?? undefined,
      whatsappImageUrl: asset.whatsapp_image_url ?? undefined,
      feedImageUrl: asset.feed_image_url ?? undefined,
      storyImageUrl: asset.story_image_url ?? undefined,
    }
    const a = await l1Put(`/devotionals/${encodeURIComponent(asset.devotional_id)}/share-assets`, l1Body)
    return {
      id: a.id,
      devotional_id: a.devotionalId ?? asset.devotional_id,
      language_code: a.languageCode ?? asset.language_code,
      whatsapp_text: a.whatsappText ?? null,
      whatsapp_image_url: a.whatsappImageUrl ?? null,
      feed_image_url: a.feedImageUrl ?? null,
      story_image_url: a.storyImageUrl ?? null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }
  },

  async uploadShareAsset(
    devotionalId: string,
    languageCode: string,
    _type: 'feed' | 'story' | 'whatsapp',
    file: File
  ): Promise<string> {
    return uploadToStorage(file, `share-assets/${devotionalId}/${languageCode}`)
  },

  async uploadContentImage(
    devotionalId: string,
    languageCode: string,
    _field: 'content_tip_image' | 'support_banner',
    file: File
  ): Promise<string> {
    return uploadToStorage(file, `devotionals/${devotionalId}/${languageCode}`)
  },

  async listLibraryImages(): Promise<Array<{ name: string; url: string }>> {
    try {
      const res = await illumineFetch('/storage?folder=library')
      if (res.ok) {
        const result = await res.json()
        const files: any[] = result.files ?? result
        if (Array.isArray(files)) {
          return files.map((f: any) => ({
            name: f.name ?? (f.key as string)?.split('/').pop() ?? '',
            url: f.publicUrl ?? f.url ?? '',
          }))
        }
      }
    } catch (e) {
      console.warn('[Media] listLibraryImages failed:', e)
    }
    return []
  },

  async uploadLibraryImage(file: File): Promise<string> {
    return uploadToStorage(file, 'library')
  },

  async deleteShareAssetFile(url: string): Promise<void> {
    const res = await illumineFetch('/storage', {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`Falha ao deletar arquivo (${res.status}): ${body.error ?? ''}`)
    }
  },
}
