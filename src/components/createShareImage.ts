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

function countLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): number {
  const words = text.split(' ')
  let line = '', count = 1
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) { count++; line = word }
    else { line = test }
  }
  return count
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
  const PAD_X      = 80
  const IW         = w - PAD_X * 2
  const AFTER_LOGO = Math.round(20  * 1.2)  // +20% → 24
  const LABEL_SIZE = Math.round(13  * 1.15) // +15% → 15px
  const LABEL_GAP  = 16
  const TITLE_LINE = Math.round(58 * 1.06)
  const PRINC_SIZE = Math.round(30  * 1.25) // +25% → 38px
  const PRINC_LINE = Math.round(PRINC_SIZE * 1.4)
  const SCRIP_SIZE = Math.round(17  * 1.2)
  const SCRIP_GAP  = Math.round(16  * 1.1)  // +10% → 18

  const logo = await loadImg(d.logoDataUrl)
  const LW   = Math.round(280 * 1.15)  // +15% → ~322px
  const LH   = Math.round(LW * logo.naturalHeight / logo.naturalWidth)

  // Measure total content height for vertical centering
  ctx.font = `800 58px ${SERIF}`
  const titleH = countLines(ctx, d.title, IW) * TITLE_LINE
  ctx.font = `700 ${PRINC_SIZE}px ${SERIF}`
  const princH = countLines(ctx, d.principle, IW) * PRINC_LINE
  const scripH = d.scripture ? SCRIP_GAP + SCRIP_SIZE : 0
  //           logo       gap   label                  title  gap  divider  gap   principle  scripture
  const totalH = LH + AFTER_LOGO + (LABEL_SIZE + LABEL_GAP) + titleH + 18 + 2 + 18 + princH + scripH
  let y = Math.round((h - totalH) / 2)

  // Logo — centered horizontally
  ctx.drawImage(logo, (w - LW) / 2, y, LW, LH)
  y += LH + AFTER_LOGO

  // DEVOCIONAL DO DIA label
  ctx.font = `700 ${LABEL_SIZE}px ${SERIF}`
  ctx.fillStyle = GOLD
  spacedText(ctx, 'DEVOCIONAL DO DIA', PAD_X, y, 6)
  y += LABEL_SIZE + LABEL_GAP

  // Title
  ctx.font = `800 58px ${SERIF}`
  ctx.fillStyle = CREAM
  y = wrapText(ctx, d.title, PAD_X, y, IW, TITLE_LINE)
  y += 18

  // Gold divider
  ctx.fillStyle = GOLD
  ctx.fillRect(PAD_X, y, 48, 2)
  y += 2 + 18

  // Principle (sem itálico)
  ctx.font = `700 ${PRINC_SIZE}px ${SERIF}`
  ctx.fillStyle = GOLD
  y = wrapText(ctx, d.principle, PAD_X, y, IW, PRINC_LINE)

  // Scripture
  if (d.scripture) {
    y += SCRIP_GAP
    ctx.font = `400 ${SCRIP_SIZE}px ${SERIF}`
    ctx.fillStyle = CREAM
    spacedText(ctx, d.scripture!, PAD_X, y, 4)
  }
}

async function drawInstagram(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  d: DrawData,
  fontSize: { logo: number; title: number; principle: number; scripture: number; site: number },
  pad: { x: number; top: number; bot: number; afterLogo: number; afterLabel?: number },
) {
  const { x: PX, afterLogo: AL, afterLabel: ALGAP = 40 } = pad
  const IW         = w - PX * 2
  const LABEL_SIZE = Math.round(22 * 1.1)                  // +10% → 24px
  const TITLE_LINE = Math.round(fontSize.title * 1.06)
  const PRINC_LINE = Math.round(fontSize.principle * 1.45)
  const SCRIP_SIZE = Math.round(fontSize.scripture * 1.3)  // +30%
  const SITE_SIZE  = Math.round(fontSize.site      * 1.15) // +15%

  const logo = await loadImg(d.logoDataUrl)
  const LW = fontSize.logo
  const LH = Math.round(LW * logo.naturalHeight / logo.naturalWidth)

  // Measure total content height for vertical centering
  ctx.font = `800 ${fontSize.title}px ${SERIF}`
  const titleH = countLines(ctx, d.title, IW) * TITLE_LINE
  ctx.font = `700 ${fontSize.principle}px ${SERIF}`
  const princH = countLines(ctx, d.principle, IW) * PRINC_LINE
  const scripH = d.scripture ? SCRIP_SIZE + 32 : 0
  //          logo  gap  label                  title  gap  divider  gap   principle  gap  scripture  site
  const totalH = LH + AL + (LABEL_SIZE + ALGAP) + titleH + 56 + 3 + 56 + princH + 48 + scripH + SITE_SIZE
  let y = Math.round((h - totalH) / 2)

  // Logo
  ctx.drawImage(logo, PX, y, LW, LH)
  y += LH + AL

  // Label
  ctx.font      = `700 ${LABEL_SIZE}px ${SERIF}`
  ctx.fillStyle = GOLD
  spacedText(ctx, 'DEVOCIONAL DO DIA', PX, y, 8)
  y += LABEL_SIZE + ALGAP

  // Title
  ctx.font      = `800 ${fontSize.title}px ${SERIF}`
  ctx.fillStyle = CREAM
  y = wrapText(ctx, d.title, PX, y, IW, TITLE_LINE)
  y += 56

  // Gold divider
  ctx.fillStyle = GOLD
  ctx.fillRect(PX, y, 80, 3)
  y += 3 + 56

  // Principle (sem itálico)
  ctx.font      = `700 ${fontSize.principle}px ${SERIF}`
  ctx.fillStyle = GOLD
  y = wrapText(ctx, d.principle, PX, y, IW, PRINC_LINE)
  y += 48

  // Scripture
  if (d.scripture) {
    ctx.font = `400 ${SCRIP_SIZE}px ${SERIF}`
    ctx.fillStyle = CREAM
    spacedText(ctx, d.scripture!, PX, y, 6)
    y += SCRIP_SIZE + 32
  }

  // Website
  ctx.font = `400 ${SITE_SIZE}px ${SERIF}`
  alpha(ctx, 0.65, () => {
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

  // y = topo do texto em todos os draws (evita sobreposição com baseline default)
  ctx.textBaseline = 'top'

  if (format === 'og') {
    await drawOg(ctx, w, h, data)
  } else if (format === 'story') {
    await drawInstagram(ctx, w, h, data,
      { logo: 456, title: 108, principle: 56, scripture: 28, site: 26 },
      { x: 110, top: 130, bot: 180, afterLogo: 150, afterLabel: 60 },
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
