import { type ShareFormat, SHARE_DIMS } from './ShareImageCard'

const GOLD  = '#c8994f'
const NAVY  = '#1b2539'
const CREAM = '#f0e8dc'
const SERIF = '"Playfair Display", Georgia, serif'

interface DrawData {
  title: string
  principle: string
  scripture?: string
  logoDataUrl: string
  logoVerticalDataUrl: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function accentBar(ctx: CanvasRenderingContext2D, w: number) {
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0,    'transparent')
  g.addColorStop(0.4,  GOLD)
  g.addColorStop(0.7,  'rgba(200,153,79,0.4)')
  g.addColorStop(1,    'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, 4)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxW: number, lineH: number,
): number {
  const words = text.split(' ')
  let line = ''
  let curY  = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY)
      line = word
      curY += lineH
    } else {
      line = test
    }
  }
  if (line) { ctx.fillText(line, x, curY); curY += lineH }
  return curY
}

// canvas has no letter-spacing — draw char by char for labelled strings
function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  spacing: number,
) {
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  }
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function alpha(ctx: CanvasRenderingContext2D, a: number, fn: () => void) {
  ctx.save()
  ctx.globalAlpha = a
  fn()
  ctx.restore()
}

// ─── format renderers ─────────────────────────────────────────────────────────

async function drawOg(ctx: CanvasRenderingContext2D, w: number, h: number, d: DrawData) {
  const PAD_X = 80, PAD_Y = 60
  const LOGO_COL_W = 260
  const SEP_X  = PAD_X + LOGO_COL_W + 56
  const SEP_H  = 440
  const RIGHT_X = SEP_X + 2 + 56
  const RIGHT_W = w - RIGHT_X - PAD_X

  // Logo vertical (left column)
  const logo = await loadImg(d.logoVerticalDataUrl)
  const LOGO_W = 220
  const LOGO_H = Math.round(LOGO_W * logo.naturalHeight / logo.naturalWidth)
  const logoX  = PAD_X + (LOGO_COL_W - LOGO_W) / 2
  const logoY  = h / 2 - LOGO_H / 2
  ctx.drawImage(logo, logoX, logoY, LOGO_W, LOGO_H)

  // Separator
  alpha(ctx, 0.25, () => {
    ctx.fillStyle = GOLD
    ctx.fillRect(SEP_X, (h - SEP_H) / 2, 2, SEP_H)
  })

  // Right: DEVOCIONAL label
  let y = PAD_Y + 20
  ctx.font = `700 14px ${SERIF}`
  ctx.fillStyle = GOLD
  spacedText(ctx, 'DEVOCIONAL DO DIA', RIGHT_X, y, 6)
  y += 14 + 20

  // Title
  ctx.font = `800 68px ${SERIF}`
  ctx.fillStyle = CREAM
  y = wrapText(ctx, d.title, RIGHT_X, y, RIGHT_W, Math.round(68 * 1.05))
  y += 24

  // Gold divider
  ctx.fillStyle = GOLD
  ctx.fillRect(RIGHT_X, y, 48, 2)
  y += 2 + 24

  // Principle
  ctx.font = `italic 700 36px ${SERIF}`
  ctx.fillStyle = CREAM
  y = wrapText(ctx, d.principle, RIGHT_X, y, RIGHT_W, Math.round(36 * 1.4))

  // Scripture
  if (d.scripture) {
    y += 24
    ctx.font = `400 19px ${SERIF}`
    ctx.fillStyle = GOLD
    alpha(ctx, 0.75, () => spacedText(ctx, d.scripture!, RIGHT_X, y, 4))
  }
}

async function drawInstagram(
  ctx: CanvasRenderingContext2D,
  w: number, _h: number,
  d: DrawData,
  fontSize: { logo: number; title: number; principle: number; scripture: number; site: number },
  pad: { x: number; top: number; bot: number; afterLogo: number },
) {
  const { x: PX, top: PT, afterLogo: AL } = pad
  const IW = w - PX * 2
  let y = PT

  // Logo
  const logo = await loadImg(d.logoDataUrl)
  const LW = fontSize.logo
  const LH = Math.round(LW * logo.naturalHeight / logo.naturalWidth)
  ctx.drawImage(logo, PX, y, LW, LH)
  y += LH + AL

  // Label
  ctx.font      = `700 22px ${SERIF}`
  ctx.fillStyle = GOLD
  spacedText(ctx, 'DEVOCIONAL DO DIA', PX, y, 8)
  y += 22 + 40

  // Title
  ctx.font      = `800 ${fontSize.title}px ${SERIF}`
  ctx.fillStyle = CREAM
  y = wrapText(ctx, d.title, PX, y, IW, Math.round(fontSize.title * 1.06))
  y += 56

  // Gold divider
  ctx.fillStyle = GOLD
  ctx.fillRect(PX, y, 80, 3)
  y += 3 + 56

  // Principle
  ctx.font      = `italic 700 ${fontSize.principle}px ${SERIF}`
  ctx.fillStyle = GOLD
  y = wrapText(ctx, d.principle, PX, y, IW, Math.round(fontSize.principle * 1.45))
  y += 48

  // Scripture
  if (d.scripture) {
    ctx.font = `400 ${fontSize.scripture}px ${SERIF}`
    alpha(ctx, 0.75, () => {
      ctx.fillStyle = CREAM
      spacedText(ctx, d.scripture!, PX, y, 6)
    })
    y += fontSize.scripture + 32
  }

  // Website
  ctx.font = `400 ${fontSize.site}px ${SERIF}`
  alpha(ctx, 0.45, () => {
    ctx.fillStyle = GOLD
    spacedText(ctx, '3minutesforlife.com', PX, y, 4)
  })
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function createShareImage(
  format: ShareFormat,
  data: DrawData,
): Promise<Blob> {
  const { w, h } = SHARE_DIMS[format]

  // Pre-load Playfair Display if available
  await Promise.allSettled([
    document.fonts.load(`800 100px "Playfair Display"`),
    document.fonts.load(`italic 700 56px "Playfair Display"`),
  ])

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, w, h)

  // Accent bar
  accentBar(ctx, w)

  if (format === 'og') {
    await drawOg(ctx, w, h, data)
  } else if (format === 'story') {
    await drawInstagram(ctx, w, h, data,
      { logo: 456, title: 108, principle: 56, scripture: 28, site: 26 },
      { x: 110, top: 130, bot: 340, afterLogo: 120 },
    )
  } else if (format === 'feed') {
    await drawInstagram(ctx, w, h, data,
      { logo: 384, title: 86, principle: 46, scripture: 26, site: 22 },
      { x: 90, top: 100, bot: 100, afterLogo: 90 },
    )
  } else {
    // facebook
    await drawInstagram(ctx, w, h, data,
      { logo: 384, title: 84, principle: 44, scripture: 26, site: 22 },
      { x: 90, top: 90, bot: 90, afterLogo: 72 },
    )
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), 'image/png')
  )
}
