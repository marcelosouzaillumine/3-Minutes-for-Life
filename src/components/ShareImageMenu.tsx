import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { type ShareFormat } from './ShareImageCard'
import { createShareImage } from './createShareImage'
import { AnalyticsService } from '../services/AnalyticsService'

interface Props {
  title?: string
  principle?: string
  category?: string
  scripture?: string
  devotionalId?: string
  /** true para o devocional do dia (rótulo "DEVOCIONAL DO DIA"); caso
   *  contrário mostra a categoria do devocional, ambos traduzidos. */
  isDaily?: boolean
}

const FORMATS: { key: ShareFormat; label: string; dim: string; icon: string }[] = [
  { key: 'story',    label: 'Story / Reels',    dim: '1080×1920', icon: '📱' },
  { key: 'feed',     label: 'Feed Instagram',   dim: '1080×1350', icon: '📷' },
  { key: 'facebook', label: 'Feed Facebook',    dim: '1080×1080', icon: '🔵' },
  { key: 'og',       label: 'WhatsApp',         dim: '1200×630',  icon: '💬' },
]

const canWebShare = typeof navigator !== 'undefined' && !!navigator.share

/**
 * Converte uma URL de imagem em data URL via fetch + blob + canvas.
 * O createObjectURL(blob) é tratado como same-origin pelo canvas, evitando
 * o problema de "canvas tainted" sem depender de headers CORS do servidor.
 */
async function toDataUrl(src: string, maxWidth = 600): Promise<string> {
  try {
    const res = await fetch(src)
    if (!res.ok) return src
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    return await new Promise<string>(resolve => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objUrl)
        try {
          const ratio = img.naturalHeight / img.naturalWidth
          const w     = Math.min(maxWidth, img.naturalWidth)
          const h     = Math.round(w * ratio)
          const canvas = document.createElement('canvas')
          canvas.width  = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(src); return }
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/png'))
        } catch { resolve(src) }
      }
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(src) }
      img.src = objUrl
    })
  } catch {
    return src
  }
}

async function buildOgUrl(devotionalId: string | undefined, lang: string): Promise<string> {
  const fallback = devotionalId
    ? `https://www.3minutesforlife.com/r/3MIN?d=${devotionalId}&lang=${lang}`
    : 'https://3minutesforlife.com/app'
  if (!devotionalId) return fallback
  try {
    const { illumineFetch } = await import('../lib/illumine')
    const res = await illumineFetch('/referrals/me')
    if (res.ok) {
      const u = await res.json()
      if (u?.referralCode) {
        const base = window.location.hostname === 'localhost'
          ? window.location.origin
          : 'https://www.3minutesforlife.com'
        return `${base}/r/${u.referralCode}?d=${devotionalId}&lang=${lang}`
      }
    }
  } catch { /* use fallback */ }
  return fallback
}

export function ShareImageMenu({ title = '', principle = '', category = '', scripture = '', devotionalId, isDaily = false }: Props) {
  const { t, i18n }           = useTranslation('common')
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<ShareFormat | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const logoRef               = useRef<string>('')

  // Rótulo em destaque no topo da imagem: "DEVOCIONAL DO DIA" só quando é
  // de fato o devocional de hoje; caso contrário, a categoria do devocional
  // selecionado (biblioteca) — os dois já traduzidos para o idioma ativo.
  const imageLabel = (
    isDaily
      ? t('shareActions.dailyLabel', 'Devocional do Dia')
      : t(`categories.${category}`, category || t('categories.Devocional', 'Devocional'))
  ).toUpperCase()

  // Pre-fetch logo on mount into ref (não precisa de state / re-render)
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    toDataUrl(`${origin}/branding/logo-on-dark.png`).then(v => { logoRef.current = v })
  }, [])

  const share = async (format: ShareFormat) => {
    if (loading) return
    setLoading(format)
    setError(null)

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      // Garantir que logo está como data URL
      if (!logoRef.current.startsWith('data:'))
        logoRef.current = await toDataUrl(`${origin}/branding/logo-on-dark.png`)

      // Gerar imagem via Canvas 2D (funciona em iOS Safari)
      const blob = await createShareImage(format, {
        title,
        principle,
        scripture,
        label: imageLabel,
        logoDataUrl: logoRef.current,
      })

      const filename = `devocional-${format}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      const shareText = format === 'og'
        ? `Você tem 3 minutos para uma reflexão que pode mudar o seu dia?\n\nLeia o devocional completo:\n${await buildOgUrl(devotionalId, i18n.language)}`
        : t('shareActions.shareText', 'Compartilhe este devocional')

      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '3 Minutes For Life', text: shareText })
        // Só conta depois que o usuário conclui: cancelar rejeita com AbortError
        // e cai no catch. O download de fallback (abaixo) não conta — não dá
        // para saber se a imagem chegou a ser enviada.
        AnalyticsService.trackEvent('content_shared', {
          devotional_id: devotionalId,
          channel: format,
          has_editorial_image: true,
          language: i18n.language,
          is_daily: isDaily,
        })
        setOpen(false)
      } else {
        const objUrl = URL.createObjectURL(blob)
        const link   = document.createElement('a')
        link.href     = objUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(objUrl)
        setOpen(false)
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[ShareImageMenu]', err)
        setError(err?.message || 'Erro ao gerar imagem')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          className="action-btn"
          aria-label={t('shareActions.share', 'Compartilhar')}
          onClick={() => { setOpen(v => !v); setError(null) }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="action-label">
            {t('shareActions.share', 'Compartilhar')}
          </span>
        </button>

        {open && (
          <div
            className="share-guest-cta-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
          >
            <div
              className="share-guest-cta-card"
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: '2rem' }}
            >
              <button
                type="button"
                className="share-guest-cta-close"
                aria-label={t('close', 'Fechar')}
                onClick={() => setOpen(false)}
              >×</button>

              <p className="share-guest-cta-text" style={{ marginBottom: '1.25rem' }}>
                {t('shareActions.chooseFormat', 'Escolha o formato para compartilhar')}
              </p>

              {error && (
                <p style={{ fontSize: '0.8rem', color: '#e07070', marginBottom: '0.75rem', textAlign: 'center' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {FORMATS.map(f => (
                  <button
                    key={f.key}
                    type="button"
                    disabled={!!loading}
                    onClick={() => share(f.key)}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '0.85rem 1.25rem',
                      borderRadius:   '12px',
                      border:         '1px solid var(--color-border, rgba(255,255,255,0.1))',
                      background:     'transparent',
                      color:          'var(--color-text)',
                      cursor:         loading ? 'wait' : 'pointer',
                      width:          '100%',
                      textAlign:      'left',
                      opacity:        loading && loading !== f.key ? 0.4 : 1,
                      transition:     'opacity 0.2s',
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{f.icon} {f.label}</span>
                      <span style={{ fontSize: '0.78rem', opacity: 0.5, letterSpacing: '0.5px' }}>{f.dim} px</span>
                    </span>
                    {loading === f.key ? (
                      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Gerando…</span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
