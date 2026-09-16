import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  devotionalId: string
  lang: string
}

type Format = 'feed' | 'story' | 'og'

const FORMATS: { key: Format; label: string; dim: string; icon: string; shareLabel: string }[] = [
  { key: 'story', label: 'Story / Reels',       dim: '1080×1920', icon: '📱', shareLabel: 'Story (1080×1920)' },
  { key: 'feed',  label: 'Feed Instagram',       dim: '1080×1080', icon: '⬜', shareLabel: 'Feed (1080×1080)' },
  { key: 'og',    label: 'WhatsApp / Facebook',  dim: '1200×630',  icon: '🔗', shareLabel: 'Link (1200×630)'  },
]

const canWebShare = typeof navigator !== 'undefined' && !!navigator.share

export function ShareImageMenu({ devotionalId, lang }: Props) {
  const { t } = useTranslation('common')
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<Format | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const share = async (format: Format) => {
    if (loading) return
    setLoading(format)
    setError(null)

    try {
      const url = `/api/og/${devotionalId}?format=${format}&lang=${lang}`
      const res = await fetch(url)

      if (!res.ok) {
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('html')) throw new Error('API indisponível — tente mais tarde')
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) {
        throw new Error('Resposta inválida — esperado image/png')
      }

      const filename = `devocional-${format}.png`
      const file     = new File([blob], filename, { type: 'image/png' })

      // Web Share API — abre painel nativo (WhatsApp, Instagram, etc.)
      if (canWebShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title:  '3 Minutes For Life',
          text:   t('shareActions.shareText', 'Compartilhe este devocional'),
        })
      } else {
        // Fallback: download direto
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
      // AbortError = usuário fechou o painel de compartilhamento — não é um erro
      if (err?.name !== 'AbortError') {
        console.error('[ShareImageMenu]', err)
        setError(err?.message || 'Erro ao gerar imagem')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    cursor: loading ? 'wait' : 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    opacity: loading && loading !== f.key ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {f.icon} {f.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', opacity: 0.5, letterSpacing: '0.5px' }}>
                      {f.dim} px
                    </span>
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
                No desktop, a imagem é baixada. No celular, abre o painel de compartilhamento.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
