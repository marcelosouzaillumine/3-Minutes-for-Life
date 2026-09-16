/** @jsxImportSource react */
/// <reference types="node" />

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ImageResponse } from '@vercel/og'

const GATEWAY = process.env.VITE_ILLUMINE_URL || 'https://splendid-nourishment-production-8e84.up.railway.app'
const TENANT  = process.env.VITE_TENANT_SLUG  || '3minutes'

type Format = 'feed' | 'story' | 'og'

const DIMS: Record<Format, { width: number; height: number }> = {
  feed:  { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  og:    { width: 1200, height: 630  },
}

// Font cache — warm across invocations
let fontBold:       ArrayBuffer | null = null
let fontBoldItalic: ArrayBuffer | null = null

async function loadFonts() {
  if (fontBold) return
  const cssRes = await fetch(
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,700',
    { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' } }
  )
  const css = await cssRes.text()
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1])
  const [r0, r1] = await Promise.all(urls.slice(0, 2).map((u: string) => fetch(u).then(r => r.arrayBuffer())))
  fontBold       = r0
  fontBoldItalic = r1
}

// ─── Components ──────────────────────────────────────────────────────────────

function LogoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <path d="M60 6 L114 60 L60 114 L6 60Z"  stroke="#c8994f" stroke-width="4" fill="none" />
      <path d="M60 24 L96 60 L60 96 L24 60Z"  stroke="#c8994f" stroke-width="3" fill="none" />
      <path d="M60 42 L78 60 L60 78 L42 60Z"  stroke="#c8994f" stroke-width="2.5" fill="none" />
    </svg>
  )
}

function VerticalCard({ format, title, principle, category, scripture }: {
  format: 'feed' | 'story'; title: string; principle: string; category: string; scripture: string
}) {
  const isStory   = format === 'story'
  const px        = isStory ? 110 : 90
  const pt        = isStory ? 130 : 90
  const pb        = isStory ? 120 : 90
  const logoGap   = isStory ? 130 : 80
  const titleSize = isStory ? 112 : 86
  const prinSize  = isStory ? 58  : 46

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      background: '#1b2539',
      padding: `${pt}px ${px}px ${pb}px`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent 0%, #c8994f 40%, rgba(200,153,79,0.4) 70%, transparent 100%)',
      }} />

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
          <span style={{ fontSize: isStory ? 13 : 11, color: '#7a7060', letterSpacing: 5, fontWeight: 400, marginTop: 2 }}>
            PARE • REFLITA • PRATIQUE
          </span>
        </div>
      </div>

      {/* Category */}
      {category ? (
        <span style={{ fontSize: 20, color: '#c8994f', letterSpacing: 8, fontWeight: 700, marginBottom: 36, fontFamily: 'Playfair Display' }}>
          {category.toUpperCase()}
        </span>
      ) : null}

      {/* Title */}
      <span style={{ fontSize: titleSize, color: '#f0e8dc', fontWeight: 800, lineHeight: 1.06, marginBottom: 56, fontFamily: 'Playfair Display' }}>
        {title}
      </span>

      {/* Divider */}
      <div style={{ width: 80, height: 3, background: '#c8994f', borderRadius: 2, marginBottom: 56 }} />

      {/* Principle */}
      <span style={{ fontSize: prinSize, color: '#c8994f', fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, flex: 1, marginBottom: 64, fontFamily: 'Playfair Display' }}>
        {principle}
      </span>

      {/* Scripture */}
      <span style={{ fontSize: 22, color: '#4a5568', letterSpacing: 8, fontWeight: 400 }}>
        {scripture}
      </span>
    </div>
  )
}

function OgCard({ title, principle, category, scripture }: {
  title: string; principle: string; category: string; scripture: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row',
      width: '100%', height: '100%',
      background: '#1b2539',
      alignItems: 'center',
      padding: '60px 80px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent 0%, #c8994f 40%, rgba(200,153,79,0.4) 70%, transparent 100%)',
      }} />

      {/* Left: logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 280, flexShrink: 0 }}>
        <LogoIcon size={80} />
        <span style={{ fontSize: 24, color: '#e8dece', fontWeight: 700, letterSpacing: 5, marginTop: 20, fontFamily: 'Playfair Display' }}>
          3 MINUTES
        </span>
        <span style={{ fontSize: 16, color: '#c8994f', letterSpacing: 12, marginTop: 4 }}>FOR LIFE</span>
        <div style={{ width: 48, height: 2, background: '#c8994f', marginTop: 20, borderRadius: 1 }} />
        <span style={{ fontSize: 11, color: '#5a5040', letterSpacing: 4, marginTop: 16 }}>
          PARE • REFLITA • PRATIQUE
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 420, background: 'rgba(200,153,79,0.18)', margin: '0 64px', flexShrink: 0 }} />

      {/* Right: content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {category ? (
          <span style={{ fontSize: 14, color: '#c8994f', letterSpacing: 6, fontWeight: 700, marginBottom: 18 }}>
            {category.toUpperCase()}
          </span>
        ) : null}
        <span style={{ fontSize: 68, color: '#f0e8dc', fontWeight: 800, lineHeight: 1.05, marginBottom: 28, fontFamily: 'Playfair Display' }}>
          {title}
        </span>
        <span style={{ fontSize: 30, color: '#c8994f', fontStyle: 'italic', fontWeight: 700, lineHeight: 1.45, marginBottom: 28, fontFamily: 'Playfair Display' }}>
          {principle}
        </span>
        {scripture ? (
          <span style={{ fontSize: 14, color: '#4a5568', letterSpacing: 6, fontWeight: 400 }}>
            {scripture}
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ─── Handler (Node.js serverless) ────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id     = (req.query.id as string) || ''
  const format = (req.query.format as Format) ?? 'og'
  const lang   = (req.query.lang as string)   ?? 'pt-BR'

  const { width, height } = DIMS[format] ?? DIMS.og

  await loadFonts()

  let data: any = null
  try {
    const r = await fetch(`${GATEWAY}/devotionals/${id}?lang=${lang}`, {
      headers: { 'x-tenant-slug': TENANT },
    })
    if (r.ok) data = await r.json()
  } catch { /* best-effort */ }

  const title     = data?.title              ?? '3 Minutes For Life'
  const principle = data?.principle_statement ?? data?.principleStatement ?? ''
  const category  = data?.category           ?? ''
  const scripture = data?.scripture_reference ?? data?.scriptureReference  ?? ''

  const jsx = format === 'og'
    ? <OgCard title={title} principle={principle} category={category} scripture={scripture} />
    : <VerticalCard format={format as 'feed' | 'story'} title={title} principle={principle} category={category} scripture={scripture} />

  const imageResponse = new ImageResponse(jsx, {
    width,
    height,
    fonts: [
      { name: 'Playfair Display', data: fontBold!,       weight: 800, style: 'normal' },
      { name: 'Playfair Display', data: fontBoldItalic!, weight: 700, style: 'italic' },
    ],
  })

  const buffer = Buffer.from(await imageResponse.arrayBuffer())
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  res.status(200).end(buffer)
}
