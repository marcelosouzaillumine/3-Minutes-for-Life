import type { CSSProperties } from 'react'

export type ShareFormat = 'feed' | 'story' | 'og'

export const SHARE_DIMS: Record<ShareFormat, { w: number; h: number }> = {
  feed:  { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  og:    { w: 1200, h: 630  },
}

interface CardProps {
  format: ShareFormat
  title: string
  principle: string
  category?: string
  scripture?: string
  cardRef: React.RefObject<HTMLDivElement | null>
}

const GOLD    = '#c8994f'
const NAVY    = '#1b2539'
const CREAM   = '#f0e8dc'
const CREAM2  = '#e8dece'
const GREY    = '#7a7060'
const DIMGREY = '#4a5568'
const FONT    = "'Playfair Display', Georgia, serif"

// Diamond logo in pure SVG (no stroke-width camelCase issues)
function Logo({ size }: { size: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
      <path d="M60 6 L114 60 L60 114 L6 60Z"  stroke={GOLD} strokeWidth="4"   fill="none" />
      <path d="M60 24 L96 60 L60 96 L24 60Z"  stroke={GOLD} strokeWidth="3"   fill="none" />
      <path d="M60 42 L78 60 L60 78 L42 60Z"  stroke={GOLD} strokeWidth="2.5" fill="none" />
    </svg>
  )
}

function px(n: number): string { return `${n}px` }

export function ShareImageCard({ format, title, principle, category, scripture, cardRef }: CardProps) {
  const { w, h } = SHARE_DIMS[format]
  const isStory  = format === 'story'
  const isOg     = format === 'og'

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

  if (isOg) {
    return (
      <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '60px 80px' }}>
        {/* Accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, rgba(200,153,79,0.4) 70%, transparent 100%)` }} />

        {/* Left: logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: px(280), flexShrink: 0 }}>
          <Logo size={80} />
          <span style={{ fontSize: px(24), color: CREAM2, fontWeight: 700, letterSpacing: '5px', marginTop: px(20) }}>3 MINUTES</span>
          <span style={{ fontSize: px(16), color: GOLD,   letterSpacing: '12px', marginTop: px(4) }}>FOR LIFE</span>
          <div style={{ width: px(48), height: px(2), background: GOLD, marginTop: px(20), borderRadius: px(1) }} />
          <span style={{ fontSize: px(11), color: '#5a5040', letterSpacing: '4px', marginTop: px(16) }}>PARE • REFLITA • PRATIQUE</span>
        </div>

        {/* Separator */}
        <div style={{ width: px(1), height: px(420), background: 'rgba(200,153,79,0.18)', margin: '0 64px', flexShrink: 0 }} />

        {/* Right: content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {category ? <span style={{ fontSize: px(14), color: GOLD, letterSpacing: '6px', fontWeight: 700, marginBottom: px(18) }}>{category.toUpperCase()}</span> : null}
          <span style={{ fontSize: px(68), color: CREAM, fontWeight: 800, lineHeight: 1.05, marginBottom: px(28) }}>{title}</span>
          <span style={{ fontSize: px(30), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, marginBottom: px(28) }}>{principle}</span>
          {scripture ? <span style={{ fontSize: px(14), color: DIMGREY, letterSpacing: '6px' }}>{scripture}</span> : null}
        </div>
      </div>
    )
  }

  // Feed or Story (vertical)
  const padX      = isStory ? 110 : 90
  const padTop    = isStory ? 130 : 90
  const padBot    = isStory ? 120 : 90
  const logoGap   = isStory ? 130 : 80
  const titleSize = isStory ? 112 : 86
  const prinSize  = isStory ? 58  : 46
  const logoSize  = isStory ? 90  : 72

  return (
    <div ref={cardRef} style={{ ...base, display: 'flex', flexDirection: 'column',
      padding: `${padTop}px ${padX}px ${padBot}px` }}>
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, rgba(200,153,79,0.4) 70%, transparent 100%)` }} />

      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: px(28), marginBottom: px(logoGap) }}>
        <Logo size={logoSize} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: px(6) }}>
          <span style={{ fontSize: px(isStory ? 32 : 26), color: CREAM2, fontWeight: 700, letterSpacing: '6px' }}>3 MINUTES</span>
          <span style={{ fontSize: px(isStory ? 20 : 16), color: GOLD,   letterSpacing: '14px' }}>FOR LIFE</span>
          <span style={{ fontSize: px(isStory ? 13 : 11), color: GREY,   letterSpacing: '5px', marginTop: px(2) }}>PARE • REFLITA • PRATIQUE</span>
        </div>
      </div>

      {category ? <span style={{ fontSize: px(20), color: GOLD, letterSpacing: '8px', fontWeight: 700, marginBottom: px(36) }}>{category.toUpperCase()}</span> : null}

      <span style={{ fontSize: px(titleSize), color: CREAM, fontWeight: 800, lineHeight: 1.06, marginBottom: px(56) }}>{title}</span>

      <div style={{ width: px(80), height: px(3), background: GOLD, borderRadius: px(2), marginBottom: px(56) }} />

      <span style={{ fontSize: px(prinSize), color: GOLD, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: px(64) }}>{principle}</span>

      <span style={{ fontSize: px(22), color: DIMGREY, letterSpacing: '8px' }}>{scripture}</span>
    </div>
  )
}
