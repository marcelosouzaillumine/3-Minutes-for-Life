import { type ShareFormat, SHARE_DIMS } from './ShareImageCard'

const GOLD      = '#c8994f'   // linhas e detalhes
const GOLD_TEXT = '#8a6a35'   // texto dourado com contraste sobre o creme
const NAVY      = '#1b2539'
const PAPER     = '#faf6ef'
const SERIF     = '"Playfair Display", Georgia, serif'
const SANS      = 'system-ui, -apple-system, "Segoe UI", sans-serif'

interface DrawData {
  title: string
  principle: string
  scripture?: string
  /** Rótulo de destaque acima do título — "DEVOCIONAL DO DIA" ou a categoria,
   *  já traduzido e em caixa alta, calculado pelo chamador. */
  label: string
  /** Chamada para a ação ("Leia em 3 minutos"), já traduzida. */
  cta?: string
  /** Logo horizontal sobre fundo claro (Story, Feed, Facebook). */
  logoDataUrl: string
  /** Logo vertical sobre fundo claro — usado só no WhatsApp. */
  logoVerticalDataUrl?: string
}

/**
 * Áreas de segurança (px no tamanho real do arquivo). Tudo que for texto ou
 * logo fica dentro delas:
 *  - Story: o Instagram cobre ~250px no topo (perfil) e ~340px na base
 *    (campo de resposta e legenda).
 *  - Feed: a grade do perfil recorta as laterais (4:5 → 3:4), então 100px.
 *  - WhatsApp: o preview do link recorta no centro; 5% nas laterais e 10% no
 *    topo e na base (60 × 63), com folga.
 */
interface Safe { x: number; top: number; bottom: number }

const SAFE: Record<ShareFormat, Safe> = {
  story:    { x: 100, top: 250, bottom: 340 },
  feed:     { x: 100, top: 100, bottom: 100 },
  facebook: { x: 100, top: 90,  bottom: 90  },
  og:       { x: 80,  top: 70,  bottom: 70  },
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function accentBar(ctx: CanvasRenderingContext2D, w: number) {
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0,   'rgba(200,153,79,0)')
  g.addColorStop(0.3, GOLD)
  g.addColorStop(0.7, GOLD)
  g.addColorStop(1,   'rgba(200,153,79,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, 6)
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** As logos têm fundo branco: "multiply" o apaga sobre o creme. */
function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(img, x, y, w, h)
  ctx.restore()
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word }
    else line = test
  }
  if (line) lines.push(line)
  return lines
}

// canvas não tem letter-spacing confiável: desenha letra a letra
function spacedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let w = 0
  for (const ch of text) w += ctx.measureText(ch).width + spacing
  return w - spacing
}

function spacedCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  ctx.textAlign = 'left'
  let x = cx - spacedWidth(ctx, text, spacing) / 2
  for (const ch of text) {
    ctx.fillText(ch, x, y)
    x += ctx.measureText(ch).width + spacing
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

interface Block { h: number; draw: (y: number) => void }

// ─── Instagram / Facebook (centralizado) ──────────────────────────────────────

async function drawCentered(
  ctx: CanvasRenderingContext2D,
  format: ShareFormat,
  d: DrawData,
  base: { logo: number; title: number; principle: number },
) {
  const { w, h } = SHARE_DIMS[format]
  const safe = SAFE[format]
  const cx   = w / 2
  const IW   = w - safe.x * 2
  const availH = h - safe.top - safe.bottom

  const logo = await loadImg(d.logoDataUrl)
  const ratio = logo.naturalHeight / logo.naturalWidth

  const build = (s: number): Block[] => {
    const blocks: Block[] = []
    const gap = (n: number) => blocks.push({ h: Math.round(n * s), draw: () => {} })

    // Logo
    const LW = Math.round(base.logo * s)
    const LH = Math.round(LW * ratio)
    blocks.push({ h: LH, draw: y => drawLogo(ctx, logo, cx - LW / 2, y, LW, LH) })
    gap(40)

    // Rótulo
    const labelSize = Math.round(24 * s)
    blocks.push({
      h: labelSize,
      draw: y => {
        ctx.font = `700 ${labelSize}px ${SERIF}`
        ctx.fillStyle = GOLD_TEXT
        spacedCentered(ctx, d.label, cx, y, 7)
      },
    })
    gap(26)

    // Título
    const titleSize = Math.round(base.title * s)
    ctx.font = `800 ${titleSize}px ${SERIF}`
    const titleLines = wrapLines(ctx, d.title, IW)
    const titleLine = Math.round(titleSize * 1.12)
    blocks.push({
      h: titleLines.length * titleLine,
      draw: y => {
        ctx.font = `800 ${titleSize}px ${SERIF}`
        ctx.fillStyle = NAVY
        ctx.textAlign = 'center'
        titleLines.forEach((l, i) => ctx.fillText(l, cx, y + i * titleLine))
      },
    })
    gap(40)

    // Aspas
    const quoteH = Math.round(56 * s)
    blocks.push({
      h: quoteH,
      draw: y => {
        ctx.font = `700 ${Math.round(150 * s)}px ${SERIF}`
        ctx.fillStyle = GOLD
        ctx.textAlign = 'center'
        ctx.fillText('“', cx, y - Math.round(18 * s))
      },
    })
    gap(20)

    // Princípio (destaque)
    const princSize = Math.round(base.principle * s)
    ctx.font = `italic 700 ${princSize}px ${SERIF}`
    const princLines = wrapLines(ctx, d.principle, IW)
    const princLine = Math.round(princSize * 1.38)
    blocks.push({
      h: princLines.length * princLine,
      draw: y => {
        ctx.font = `italic 700 ${princSize}px ${SERIF}`
        ctx.fillStyle = NAVY
        ctx.textAlign = 'center'
        princLines.forEach((l, i) => ctx.fillText(l, cx, y + i * princLine))
      },
    })

    // Referência bíblica em etiqueta, sempre numa linha
    if (d.scripture) {
      gap(44)
      const sSize = Math.round(28 * s)
      const sPadX = Math.round(36 * s)
      const sPadY = Math.round(14 * s)
      ctx.font = `400 ${sSize}px ${SERIF}`
      const sW = Math.min(IW, spacedWidth(ctx, d.scripture, 5) + sPadX * 2)
      const sH = sSize + sPadY * 2
      blocks.push({
        h: sH,
        draw: y => {
          ctx.strokeStyle = GOLD_TEXT
          ctx.lineWidth = 2
          roundRectPath(ctx, cx - sW / 2, y, sW, sH, sH / 2)
          ctx.stroke()
          ctx.font = `400 ${sSize}px ${SERIF}`
          ctx.fillStyle = GOLD_TEXT
          spacedCentered(ctx, d.scripture!, cx, y + sPadY, 5)
        },
      })
    }

    // Rodapé: chamada + site
    gap(56)
    if (d.cta) {
      const cSize = Math.round(30 * s)
      const cPadX = Math.round(48 * s)
      const cPadY = Math.round(18 * s)
      ctx.font = `600 ${cSize}px ${SANS}`
      const cW = Math.min(IW, ctx.measureText(d.cta).width + cPadX * 2)
      const cH = cSize + cPadY * 2
      blocks.push({
        h: cH,
        draw: y => {
          ctx.fillStyle = NAVY
          roundRectPath(ctx, cx - cW / 2, y, cW, cH, cH / 2)
          ctx.fill()
          ctx.font = `600 ${cSize}px ${SANS}`
          ctx.fillStyle = PAPER
          ctx.textAlign = 'center'
          ctx.fillText(d.cta!, cx, y + cPadY)
        },
      })
      gap(22)
    }
    const siteSize = Math.round(24 * s)
    blocks.push({
      h: siteSize,
      draw: y => {
        ctx.font = `400 ${siteSize}px ${SERIF}`
        ctx.fillStyle = GOLD_TEXT
        spacedCentered(ctx, '3minutesforlife.com', cx, y, 4)
      },
    })
    return blocks
  }

  // Reduz a escala até o conjunto caber dentro da área de segurança
  let s = 1
  let blocks = build(s)
  while (blocks.reduce((a, b) => a + b.h, 0) > availH && s > 0.45) {
    s = Math.round((s - 0.04) * 100) / 100
    blocks = build(s)
  }

  const totalH = blocks.reduce((a, b) => a + b.h, 0)
  let y = safe.top + Math.round((availH - totalH) / 2)
  for (const b of blocks) { b.draw(y); y += b.h }
}

// ─── WhatsApp (1200 × 630) ────────────────────────────────────────────────────

async function drawOg(ctx: CanvasRenderingContext2D, d: DrawData) {
  const { w, h } = SHARE_DIMS.og
  const safe  = SAFE.og
  const IW    = w - safe.x * 2
  const availH = h - safe.top - safe.bottom

  const logo  = await loadImg(d.logoVerticalDataUrl || d.logoDataUrl)
  const LW    = 270
  const LH    = Math.round(LW * logo.naturalHeight / logo.naturalWidth)
  const GAP   = 48
  const textMaxW = IW - LW - GAP * 2 - 2 - 48

  // Título: até 2 linhas, reduzindo a fonte se preciso
  let titleSize = 62
  let titleLines: string[] = []
  for (; titleSize >= 40; titleSize -= 2) {
    ctx.font = `800 ${titleSize}px ${SERIF}`
    titleLines = wrapLines(ctx, d.title, textMaxW)
    if (titleLines.length <= 2) break
  }
  ctx.font = `800 ${titleSize}px ${SERIF}`
  const titleLine = Math.round(titleSize * 1.12)

  // Referência bíblica: sempre inteira numa linha
  let scripSize = 30
  if (d.scripture) {
    for (; scripSize >= 18; scripSize -= 1) {
      ctx.font = `400 ${scripSize}px ${SERIF}`
      if (spacedWidth(ctx, d.scripture, 5) <= textMaxW) break
    }
  }

  const labelSize = 17
  ctx.font = `700 ${labelSize}px ${SERIF}`
  const labelW = spacedWidth(ctx, d.label, 6)
  ctx.font = `800 ${titleSize}px ${SERIF}`
  const titleW = Math.max(...titleLines.map(l => ctx.measureText(l).width))
  ctx.font = `400 ${scripSize}px ${SERIF}`
  const scripW = d.scripture ? spacedWidth(ctx, d.scripture, 5) : 0
  const ctaSize = 24
  ctx.font = `600 ${ctaSize}px ${SANS}`
  const ctaText = d.cta ? `${d.cta} →` : ''
  const ctaW = ctaText ? ctx.measureText(ctaText).width : 0

  const textW = Math.min(textMaxW, Math.max(labelW, titleW, scripW, ctaW))
  const groupW = LW + GAP + 2 + GAP + textW
  const x0 = Math.round((w - groupW) / 2)
  const textCx = x0 + LW + GAP + 2 + GAP + textW / 2

  // Coluna de texto: altura total para centralizar verticalmente
  const textH = labelSize + 22 + titleLines.length * titleLine + 22 + 3
    + (d.scripture ? 22 + scripSize : 0) + (ctaText ? 30 + ctaSize : 0)
  const colH = Math.max(LH, textH, 0)
  const top = safe.top + Math.round((availH - Math.min(colH, availH)) / 2)

  drawLogo(ctx, logo, x0, top + Math.round((colH - LH) / 2), LW, LH)

  ctx.fillStyle = 'rgba(184,134,58,0.45)'
  ctx.fillRect(x0 + LW + GAP, top + Math.round((colH - Math.min(colH, 300)) / 2), 2, Math.min(colH, 300))

  let y = top + Math.round((colH - textH) / 2)

  ctx.font = `700 ${labelSize}px ${SERIF}`
  ctx.fillStyle = GOLD_TEXT
  spacedCentered(ctx, d.label, textCx, y, 6)
  y += labelSize + 22

  ctx.font = `800 ${titleSize}px ${SERIF}`
  ctx.fillStyle = NAVY
  ctx.textAlign = 'center'
  titleLines.forEach((l, i) => ctx.fillText(l, textCx, y + i * titleLine))
  y += titleLines.length * titleLine + 22

  ctx.fillStyle = GOLD
  ctx.fillRect(textCx - 24, y, 48, 3)
  y += 3

  if (d.scripture) {
    y += 22
    ctx.font = `400 ${scripSize}px ${SERIF}`
    ctx.fillStyle = GOLD_TEXT
    spacedCentered(ctx, d.scripture, textCx, y, 5)
    y += scripSize
  }

  if (ctaText) {
    y += 30
    ctx.font = `600 ${ctaSize}px ${SANS}`
    ctx.fillStyle = NAVY
    ctx.textAlign = 'center'
    ctx.fillText(ctaText, textCx, y)
  }
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

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)
  accentBar(ctx, w)

  // y = topo do texto em todos os draws (evita sobreposição com baseline default)
  ctx.textBaseline = 'top'

  if (format === 'og') {
    await drawOg(ctx, data)
  } else if (format === 'story') {
    await drawCentered(ctx, format, data, { logo: 640, title: 72, principle: 78 })
  } else if (format === 'feed') {
    await drawCentered(ctx, format, data, { logo: 500, title: 58, principle: 60 })
  } else {
    await drawCentered(ctx, format, data, { logo: 420, title: 48, principle: 50 })
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), 'image/png')
  )
}
