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
  logoSrc?: string          // data URL resolved at share time (avoids html-to-image fetch issues)
  cardRef: React.RefObject<HTMLDivElement | null>
}

const GOLD    = '#c8994f'
const NAVY    = '#1b2539'
const CREAM   = '#f0e8dc'
const DIMGREY = '#4a5568'
const FONT    = "'Playfair Display', Georgia, serif"

const DEFAULT_LOGO = '/branding/logo-on-dark.png'

function px(n: number) { return `${n}px` }

const accentBar: CSSProperties = {
  position:   'absolute',
  top:        '0',
  left:       '0',
  right:      '0',
  height:     '4px',
  background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, rgba(200,153,79,0.4) 70%, transparent 100%)`,
}

export function ShareImageCard({ format, title, principle, scripture, logoSrc, cardRef }: CardProps) {
  const { w, h } = SHARE_DIMS[format]
  const logo = logoSrc || DEFAULT_LOGO

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

  // ── OG / WhatsApp (1200 × 630) ─────────────────────────────────────────────
  if (format === 'og') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '60px 80px' }}>
        <div style={accentBar} />

        {/* Left: full logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: px(300), flexShrink: 0 }}>
          <img src={logo} alt="3 Minutes for Life"
            style={{ width: px(260), height: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Separator */}
        <div style={{ width: px(2), height: px(440), background: 'rgba(200,153,79,0.25)', margin: '0 56px', flexShrink: 0 }} />

        {/* Right: content */}
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

  // ── Facebook (1080 × 1080) — square ────────────────────────────────────────
  if (format === 'facebook') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '90px' }}>
        <div style={accentBar} />

        <img src={logo} alt="3 Minutes for Life"
          style={{ width: px(320), height: 'auto', objectFit: 'contain', marginBottom: px(80) }} />

        <span style={{ fontSize: px(20), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(36) }}>
          DEVOCIONAL DO DIA
        </span>

        <span style={{ fontSize: px(86), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(52) }}>{title}</span>

        <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(52) }} />

        <span style={{ fontSize: px(46), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(48) }}>{principle}</span>

        <span style={{ fontSize: px(22), color: DIMGREY, letterSpacing: '8px' }}>{scripture}</span>
      </div>
    )
  }

  // ── Feed Instagram (1080 × 1350) — portrait 4:5 ────────────────────────────
  if (format === 'feed') {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '100px 90px 100px' }}>
        <div style={accentBar} />

        <img src={logo} alt="3 Minutes for Life"
          style={{ width: px(320), height: 'auto', objectFit: 'contain', marginBottom: px(90) }} />

        <span style={{ fontSize: px(20), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(40) }}>
          DEVOCIONAL DO DIA
        </span>

        <span style={{ fontSize: px(86), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(56) }}>{title}</span>

        <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(56) }} />

        <span style={{ fontSize: px(46), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(56) }}>{principle}</span>

        <span style={{ fontSize: px(22), color: DIMGREY, letterSpacing: '8px', marginBottom: px(24) }}>{scripture}</span>

        <span style={{ fontSize: px(18), color: GOLD, letterSpacing: '3px', opacity: 0.6 }}>
          3minutesforlife.com
        </span>
      </div>
    )
  }

  // ── Story (1080 × 1920) ────────────────────────────────────────────────────
  // padBot = 340 to clear Instagram's "Adicione uma legenda" bar (~300px)
  return (
    <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column', padding: '130px 110px 340px' }}>
      <div style={accentBar} />

      <img src={logo} alt="3 Minutes for Life"
        style={{ width: px(380), height: 'auto', objectFit: 'contain', marginBottom: px(130) }} />

      <span style={{ fontSize: px(22), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(40) }}>
        DEVOCIONAL DO DIA
      </span>

      <span style={{ fontSize: px(108), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(56) }}>{title}</span>

      <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(56) }} />

      <span style={{ fontSize: px(56), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(60) }}>{principle}</span>

      {scripture ? (
        <span style={{ fontSize: px(24), color: DIMGREY, letterSpacing: '6px', marginBottom: px(28) }}>{scripture}</span>
      ) : null}

      <span style={{ fontSize: px(22), color: GOLD, letterSpacing: '4px', opacity: 0.7 }}>
        3minutesforlife.com
      </span>
    </div>
  )
}
