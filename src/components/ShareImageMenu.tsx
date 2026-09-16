import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  devotionalId: string
  lang: string
}

type Format = 'feed' | 'story' | 'og'

const FORMATS: { key: Format; label: string; dim: string; icon: string }[] = [
  { key: 'story', label: 'Story / Reels', dim: '1080×1920',  icon: '📱' },
  { key: 'feed',  label: 'Feed Instagram', dim: '1080×1080', icon: '⬜' },
  { key: 'og',    label: 'WhatsApp / Facebook', dim: '1200×630', icon: '🔗' },
]

const BASE = import.meta.env.VITE_BASE_URL || window.location.origin

export function ShareImageMenu({ devotionalId, lang }: Props) {
  const { t } = useTranslation('common')
  const [open, setOpen]             = useState(false)
  const [loading, setLoading]       = useState<Format | null>(null)

  const download = async (format: Format) => {
    if (loading) return
    setLoading(format)
    try {
      const url = `${BASE}/api/og/${devotionalId}?format=${format}&lang=${lang}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Falha ao gerar imagem')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `devocional-${format}.png`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('[ShareImageMenu] download error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="action-btn"
        aria-label={t('shareActions.downloadImage', 'Baixar imagem')}
        onClick={() => setOpen(v => !v)}
      >
        {/* Image icon */}
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
              {t('shareActions.chooseFormat', 'Escolha o formato da imagem')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              {FORMATS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  disabled={loading === f.key}
                  onClick={() => download(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
                    background: 'transparent',
                    color: 'var(--color-text)',
                    cursor: loading === f.key ? 'wait' : 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    opacity: loading && loading !== f.key ? 0.5 : 1,
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
