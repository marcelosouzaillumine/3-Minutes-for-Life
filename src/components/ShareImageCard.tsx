import type { CSSProperties } from 'react'

export type ShareFormat = 'story' | 'feed' | 'facebook' | 'og'

export const SHARE_DIMS: Record<ShareFormat, { w: number; h: number }> = {
  story:    { w: 1080, h: 1920 },
  feed:     { w: 1080, h: 1350 }, // Instagram 4:5 portrait
  facebook: { w: 1080, h: 1080 }, // Facebook square
  og:       { w: 1200, h: 630  }, // WhatsApp
}

interface CardProps {
  format: ShareFormat
  title: string
  principle: string
  category?: string
  scripture?: string
  url?: string
  logoSrc?: string          // horizontal logo (story / feed / facebook)
  logoVerticalSrc?: string  // vertical logo — used exclusively for OG/WhatsApp
  cardRef: React.RefObject<HTMLDivElement | null>
}

const GOLD  = '#c8994f'
const NAVY  = '#1b2539'
const CREAM = '#f0e8dc'
const FONT  = "'Playfair Display', Georgia, serif"

const DEFAULT_LOGO          = '/branding/logo-on-dark.png'
const DEFAULT_LOGO_VERTICAL = '/branding/logo-on-dark-vertical.png'

function px(n: number) { return `${n}px` }

const accentBar: CSSProperties = {
  position:   'absolute',
  top:        '0',
  left:       '0',
  right:      '0',
  height:     '4px',
  background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, rgba(200,153,79,0.4) 70%, transparent 100%)`,
}

export function ShareImageCard({ format, title, principle, scripture, logoSrc, logoVerticalSrc, cardRef }: CardProps) {
  const { w, h } = SHARE_DIMS[format]
  const logo         = logoSrc         || DEFAULT_LOGO
  const logoVertical = logoVerticalSrc || DEFAULT_LOGO_VERTICAL

  const base: CSSProperties = {
    position:   'fixed',
    left:       '-9999px',
    top:        '0',
    width:      px(w),
    height:     px(h),
    background: NAVY,
    overflow:   'hidden',
    fontFamily: FONT,
    boxSizing:  'border-box',
  }

  // ── OG / WhatsApp (1200 × 630) — logo-on-dark-vertical exclusivo ───────────
  if (format === 'og') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '60px 80px' }}>
        <div style={accentBar} />

        {/* Coluna esquerda: logo vertical (exclusiva para WhatsApp/OG) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: px(260), flexShrink: 0 }}>
          <img src={logoVertical} alt="3 Minutes for Life"
            style={{ width: px(220), height: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Separador */}
        <div style={{ width: px(2), height: px(440), background: 'rgba(200,153,79,0.25)', margin: '0 56px', flexShrink: 0 }} />

        {/* Coluna direita: conteúdo */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: px(14), color: GOLD, letterSpacing: '6px', fontWeight: 700, marginBottom: px(20) }}>
            DEVOCIONAL DO DIA
          </span>
          <span style={{ fontSize: px(68), color: CREAM, fontWeight: 800, lineHeight: 1.05, marginBottom: px(24) }}>{title}</span>
          <div style={{ width: px(48), height: px(2), background: GOLD, borderRadius: px(1), marginBottom: px(24) }} />
          <span style={{ fontSize: px(36), color: CREAM, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.4, flex: 1 }}>{principle}</span>
          {scripture ? <span style={{ fontSize: px(19), color: GOLD, letterSpacing: '4px', opacity: 0.75, marginTop: px(24) }}>{scripture}</span> : null}
        </div>
      </div>
    )
  }

  // ── Facebook (1080 × 1080) — quadrado ──────────────────────────────────────
  if (format === 'facebook') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '90px' }}>
        <div style={accentBar} />

        <img src={logo} alt="3 Minutes for Life"
          style={{ width: px(384), height: 'auto', objectFit: 'contain', marginBottom: px(72) }} />

        <span style={{ fontSize: px(20), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(32) }}>
          DEVOCIONAL DO DIA
        </span>

        <span style={{ fontSize: px(84), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(44) }}>{title}</span>

        <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(44) }} />

        <span style={{ fontSize: px(44), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(36) }}>{principle}</span>

        <span style={{ fontSize: px(26), color: CREAM, letterSpacing: '8px', opacity: 0.75, marginBottom: px(24) }}>{scripture}</span>

        <span style={{ fontSize: px(22), color: GOLD, letterSpacing: '3px', opacity: 0.45 }}>
          3minutesforlife.com
        </span>
      </div>
    )
  }

  // ── Feed Instagram (1080 × 1350) — retrato 4:5 ─────────────────────────────
  if (format === 'feed') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '100px 90px 100px' }}>
        <div style={accentBar} />

        <img src={logo} alt="3 Minutes for Life"
          style={{ width: px(384), height: 'auto', objectFit: 'contain', marginBottom: px(90) }} />

        <span style={{ fontSize: px(20), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(40) }}>
          DEVOCIONAL DO DIA
        </span>

        <span style={{ fontSize: px(86), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(56) }}>{title}</span>

        <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(56) }} />

        <span style={{ fontSize: px(46), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(48) }}>{principle}</span>

        <span style={{ fontSize: px(26), color: CREAM, letterSpacing: '8px', opacity: 0.75, marginBottom: px(28) }}>{scripture}</span>

        <span style={{ fontSize: px(22), color: GOLD, letterSpacing: '3px', opacity: 0.45 }}>
          3minutesforlife.com
        </span>
      </div>
    )
  }

  // ── Story (1080 × 1920) ────────────────────────────────────────────────────
  // padBot = 340 para cobrir a barra "Adicione uma legenda" do Instagram (~300px)
  return (
    <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '130px 110px 340px' }}>
      <div style={accentBar} />

      <img src={logo} alt="3 Minutes for Life"
        style={{ width: px(456), height: 'auto', objectFit: 'contain', marginBottom: px(120) }} />

      <span style={{ fontSize: px(22), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(40) }}>
        DEVOCIONAL DO DIA
      </span>

      <span style={{ fontSize: px(108), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(56) }}>{title}</span>

      <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(56) }} />

      <span style={{ fontSize: px(56), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(52) }}>{principle}</span>

      {scripture ? (
        <span style={{ fontSize: px(28), color: CREAM, letterSpacing: '6px', opacity: 0.75, marginBottom: px(32) }}>{scripture}</span>
      ) : null}

      <span style={{ fontSize: px(26), color: GOLD, letterSpacing: '4px', opacity: 0.45 }}>
        3minutesforlife.com
      </span>
    </div>
  )
}
