import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toPng } from 'html-to-image'
import { ShareImageCard, type ShareFormat, SHARE_DIMS } from './ShareImageCard'

interface Props {
  title?: string
  principle?: string
  category?: string
  scripture?: string
  url?: string
}

const FORMATS: { key: ShareFormat; label: string; dim: string; icon: string }[] = [
  { key: 'story', label: 'Story / Reels',      dim: '1080×1920', icon: '📱' },
  { key: 'feed',  label: 'Feed Instagram',      dim: '1080×1080', icon: '⬜' },
  { key: 'og',    label: 'WhatsApp / Facebook', dim: '1200×630',  icon: '🔗' },
]

const FONT_CSS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,700&display=block');`

const canWebShare = typeof navigator !== 'undefined' && !!navigator.share

export function ShareImageMenu({ title = '', principle = '', category = '', scripture = '', url = '' }: Props) {
  const { t }                   = useTranslation('common')
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState<ShareFormat | null>(null)
  const [activeFormat, setActiveFormat] = useState<ShareFormat>('feed')
  const [error, setError]       = useState<string | null>(null)
  const cardRef                 = useRef<HTMLDivElement>(null)

  const share = async (format: ShareFormat) => {
    if (loading) return
    setLoading(format)
    setActiveFormat(format)
    setError(null)

    // Wait one frame for the card to render with the new format
    await new Promise(r => requestAnimationFrame(r))

    try {
      if (!cardRef.current) throw new Error('Card não encontrado')

      // Wait for all <img> tags inside the card to finish loading
      await Promise.all(
        Array.from(cardRef.current.querySelectorAll('img')).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.addEventListener('load',  () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              })
        )
      )
      // Extra frame to let the browser paint after images settle
      await new Promise(r => setTimeout(r, 80))

      const { w, h } = SHARE_DIMS[format]

      const dataUrl = await toPng(cardRef.current, {
        width:        w,
        height:       h,
        pixelRatio:   1,
        fontEmbedCSS: FONT_CSS,
        cacheBust:    true,
        style: {
          position: 'static',
          left:     '0',
          top:      '0',
        },
      })

      const res   = await fetch(dataUrl)
      const blob  = await res.blob()
      const filename = `devocional-${format}.png`
      const file  = new File([blob], filename, { type: 'image/png' })

      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '3 Minutes For Life',
          text:  t('shareActions.shareText', 'Compartilhe este devocional'),
        })
      } else {
        const objUrl = URL.createObjectURL(blob)
        const link   = document.createElement('a')
        link.href     = objUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(objUrl)
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
      {/* Off-screen card for capture — always rendered while menu is open */}
      {open && (
        <ShareImageCard
          cardRef={cardRef}
          format={activeFormat}
          title={title}
          principle={principle}
          category={category}
          scripture={scripture}
          url={url}
        />
      )}

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          className="action-btn"
          aria-label={t('shareActions.downloadImage', 'Compartilhar imagem')}
          onClick={() => { setOpen(v => !v); setError(null) }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="action-label">
            {t('shareActions.downloadImage', 'Imagem')}
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
                {canWebShare
                  ? t('shareActions.chooseFormatShare', 'Escolha o formato para compartilhar')
                  : t('shareActions.chooseFormat',      'Escolha o formato da imagem')}
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
                        {canWebShare
                          ? <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>
                          : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>
                        }
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {!canWebShare && (
                <p style={{ fontSize: '0.72rem', opacity: 0.4, textAlign: 'center', marginTop: '1rem' }}>
                  No celular, abre o painel de compartilhamento nativo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
