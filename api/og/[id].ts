import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const GATEWAY = process.env.VITE_ILLUMINE_URL || 'https://splendid-nourishment-production-8e84.up.railway.app'
const TENANT  = process.env.VITE_TENANT_SLUG   || '3minutes'

type Format = 'feed' | 'story' | 'og'

const DIMS: Record<Format, { width: number; height: number }> = {
  feed:  { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  og:    { width: 1200, height: 630  },
}

// Font cache — warm across Edge invocations
let fontRegular:     ArrayBuffer | null = null
let fontBold:        ArrayBuffer | null = null
let fontBoldItalic:  ArrayBuffer | null = null

async function loadFonts() {
  if (fontBold) return

  // Fetch Playfair Display via Google Fonts CSS (subset: latin)
  const cssRes = await fetch(
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700',
    { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' } }
  )
  const css = await cssRes.text()
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1])

  // urls[0] = regular 700, urls[1] = regular 800, urls[2] = italic 700
  const [r0, r1, r2] = await Promise.all(urls.slice(0, 3).map(u => fetch(u).then(r => r.arrayBuffer())))
  fontRegular    = r0
  fontBold       = r1
  fontBoldItalic = r2
}

async function fetchDevotional(id: string, lang: string) {
  try {
    const res = await fetch(`${GATEWAY}/devotionals/${id}?lang=${lang}`, {
      headers: { 'x-tenant-slug': TENANT },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ─── Logo SVG (diamond) ───────────────────────────────────────────────────────
function LogoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <path d="M60 6 L114 60 L60 114 L6 60Z"  stroke="#c8994f" stroke-width="4" fill="none" />
      <path d="M60 24 L96 60 L60 96 L24 60Z"  stroke="#c8994f" stroke-width="3" fill="none" />
      <path d="M60 42 L78 60 L60 78 L42 60Z"  stroke="#c8994f" stroke-width="2.5" fill="none" />
    </svg>
  )
}

// ─── Dots pattern ─────────────────────────────────────────────────────────────
function Dots({ opacity = 0.18 }: { opacity?: number }) {
  const dots: { cx: number; cy: number; r: number; o: number }[] = []
  const cols = 10, rows = 14, gap = 38
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = (r / rows) * 0.6 + (c / cols) * 0.4
      if (Math.random() < t * 0.8) {
        dots.push({ cx: c * gap + 16, cy: r * gap + 16, r: 3 + Math.random() * 3, o: 0.15 + t * 0.55 })
      }
    }
  }
  return (
    <svg
      style={{ position: 'absolute', bottom: 0, right: 0, opacity }}
      width="380" height="540"
      viewBox="0 0 380 540"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#4a6080" opacity={d.o} />
      ))}
    </svg>
  )
}

// ─── Vertical layout (feed 1:1 and story 9:16) ───────────────────────────────
function VerticalCard({
  format, title, principle, category, scripture,
}: {
  format: 'feed' | 'story'
  title: string; principle: string; category: string; scripture: string
}) {
  const isStory   = format === 'story'
  const px        = isStory ? 110 : 90
  const pt        = isStory ? 130 : 90
  const pb        = isStory ? 120 : 90
  const logoGap   = isStory ? 130 : 80
  const titleSize = isStory ? 112 : 86
  const prinSize  = isStory ? 58  : 46

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100%',
        background: '#1b2539',
        padding: `${pt}px ${px}px ${pb}px`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent 0%, #c8994f 40%, rgba(200,153,79,0.4) 70%, transparent 100%)',
      }} />

      {/* Dots */}
      <Dots opacity={0.2} />

      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: logoGap }}>
        <LogoIcon size={isStory ? 90 : 72} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: isStory ? 32 : 26, color: '#e8dece', fontWeight: 700, letterSpacing: 6, fontFamily: 'Playfair Display' }}>
            3 MINUTES
          </span>
          <span style={{ fontSize: isStory ? 20 : 16, color: '#c8994f', letterSpacing: 14, fontWeight: 400 }}>
            FOR LIFE
          </span>
          <span style={{ fontSize: isStory ? 13 : 11, color: '#7a7060', letterSpacing: 5, fontWeight: 300, marginTop: 2 }}>
            PARE • REFLITA • PRATIQUE
          </span>
        </div>
      </div>

      {/* Category */}
      {category ? (
        <span style={{ fontSize: 20, color: '#c8994f', letterSpacing: 8, fontWeight: 600, marginBottom: 36, fontFamily: 'Playfair Display' }}>
          {category.toUpperCase()}
        </span>
      ) : null}

      {/* Title */}
      <span style={{
        fontSize: titleSize, color: '#f0e8dc', fontWeight: 800,
        lineHeight: 1.06, marginBottom: 56,
        fontFamily: 'Playfair Display',
      }}>
        {title}
      </span>

      {/* Divider */}
      <div style={{ width: 80, height: 3, background: '#c8994f', borderRadius: 2, marginBottom: 56, opacity: 0.8 }} />

      {/* Principle */}
      <span style={{
        fontSize: prinSize, color: '#c8994f', fontStyle: 'italic', fontWeight: 700,
        lineHeight: 1.45, flex: 1, marginBottom: 64,
        fontFamily: 'Playfair Display',
      }}>
        {principle}
      </span>

      {/* Scripture */}
      <span style={{ fontSize: 22, color: '#4a5568', letterSpacing: 8, fontWeight: 300 }}>
        {scripture}
      </span>
    </div>
  )
}

// ─── OG landscape layout (1200×630) ──────────────────────────────────────────
function OgCard({
  title, principle, category, scripture,
}: {
  title: string; principle: string; category: string; scripture: string
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'row',
        width: '100%', height: '100%',
        background: '#1b2539',
        alignItems: 'center',
        padding: '60px 80px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent 0%, #c8994f 40%, rgba(200,153,79,0.4) 70%, transparent 100%)',
      }} />

      {/* Dots bottom right */}
      <svg style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.15 }} width="280" height="280" viewBox="0 0 280 280">
        {Array.from({ length: 48 }, (_, i) => {
          const c = i % 8, r = Math.floor(i / 8)
          return <circle key={i} cx={c * 32 + 16} cy={r * 32 + 16} r={3 + (c + r) * 0.3} fill="#4a6080" opacity={0.2 + (c + r) * 0.04} />
        })}
      </svg>

      {/* Left: logo column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 280, flexShrink: 0 }}>
        <LogoIcon size={80} />
        <span style={{ fontSize: 24, color: '#e8dece', fontWeight: 700, letterSpacing: 5, marginTop: 20, fontFamily: 'Playfair Display' }}>
          3 MINUTES
        </span>
        <span style={{ fontSize: 16, color: '#c8994f', letterSpacing: 12, marginTop: 4 }}>
          FOR LIFE
        </span>
        <div style={{ width: 48, height: 2, background: '#c8994f', marginTop: 20, borderRadius: 1 }} />
        <span style={{ fontSize: 11, color: '#5a5040', letterSpacing: 4, marginTop: 16, lineHeight: 1.8 }}>
          PARE • REFLITA • PRATIQUE
        </span>
      </div>

      {/* Vertical separator */}
      <div style={{ width: 1, height: 420, background: 'rgba(200,153,79,0.18)', margin: '0 64px', flexShrink: 0 }} />

      {/* Right: content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0, minWidth: 0 }}>
        {category ? (
          <span style={{ fontSize: 14, color: '#c8994f', letterSpacing: 6, fontWeight: 600, marginBottom: 18 }}>
            {category.toUpperCase()}
          </span>
        ) : null}
        <span style={{
          fontSize: 68, color: '#f0e8dc', fontWeight: 800,
          lineHeight: 1.05, marginBottom: 28,
          fontFamily: 'Playfair Display',
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 30, color: '#c8994f', fontStyle: 'italic', fontWeight: 700,
          lineHeight: 1.45, marginBottom: 28,
          fontFamily: 'Playfair Display',
        }}>
          {principle}
        </span>
        {scripture ? (
          <span style={{ fontSize: 14, color: '#4a5568', letterSpacing: 6, fontWeight: 300 }}>
            {scripture}
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(request: Request) {
  const url    = new URL(request.url)
  const parts  = url.pathname.replace(/\/$/, '').split('/')
  const id     = parts[parts.length - 1]
  const format = (url.searchParams.get('format') as Format) ?? 'og'
  const lang   = url.searchParams.get('lang') ?? 'pt-BR'

  const { width, height } = DIMS[format] ?? DIMS.og

  await loadFonts()

  const data = await fetchDevotional(id, lang)

  const title     = data?.title             ?? '3 Minutes For Life'
  const principle = data?.principle_statement ?? data?.principleStatement ?? ''
  const category  = data?.category           ?? ''
  const scripture = data?.scripture_reference ?? data?.scriptureReference  ?? ''

  const jsx = format === 'og'
    ? <OgCard title={title} principle={principle} category={category} scripture={scripture} />
    : <VerticalCard format={format as 'feed' | 'story'} title={title} principle={principle} category={category} scripture={scripture} />

  return new ImageResponse(jsx, {
    width,
    height,
    fonts: [
      { name: 'Playfair Display', data: fontRegular!,    weight: 700, style: 'normal'  },
      { name: 'Playfair Display', data: fontBold!,       weight: 800, style: 'normal'  },
      { name: 'Playfair Display', data: fontBoldItalic!, weight: 700, style: 'italic'  },
    ],
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
