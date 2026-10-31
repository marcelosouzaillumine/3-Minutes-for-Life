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
 *    (campo de resposta e legenda); a área segura tem folga extra além disso
 *    (320 / 420) e 150px nas laterais, longe da coluna de botões da direita.
 *  - Feed: a grade do perfil recorta as laterais (4:5 → 3:4), então 130px.
 *  - WhatsApp: o preview do link recorta no centro; 5% nas laterais e 10% no
 *    topo e na base (60 × 63), com folga.
 */
interface Safe { x: number; top: number; bottom: number }

const SAFE: Record<ShareFormat, Safe> = {
  story:    { x: 150, top: 320, bottom: 420 },
  feed:     { x: 130, top: 120, bottom: 120 },
  facebook: { x: 120, top: 100, bottom: 100 },
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

/**
 * As logos vêm com fundo branco e muita folga em volta. Recorta ao conteúdo
 * para que o tamanho desenhado seja o tamanho visível, e não o do arquivo.
 */
async function loadLogo(src: string): Promise<HTMLCanvasElement> {
  const img = await loadImg(src)
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const g = c.getContext('2d')!
  g.drawImage(img, 0, 0)
  try {
    const { data } = g.getImageData(0, 0, c.width, c.height)
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4
        if (data[i + 3] > 20 && (data[i] < 236 || data[i + 1] < 236 || data[i + 2] < 236)) {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
      }
    }
    if (x1 <= x0 || y1 <= y0) return c
    const pad = 2
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad)
    x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad)
    const out = document.createElement('canvas')
    out.width = x1 - x0 + 1
    out.height = y1 - y0 + 1
    out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
    return out
  } catch {
    return c
  }
}

/** "multiply" apaga o fundo branco da logo sobre o creme. */
function drawLogo(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number) {
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
//
// Hierarquia (do maior para o menor): frase do princípio (herói) › título ›
// referência › chamada › rótulo e site. Logo ancorada no topo da área segura,
// chamada ancorada na base, frase centralizada no espaço entre as duas.

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

  const logo  = await loadLogo(d.logoDataUrl)
  const ratio = logo.height / logo.width

  const sum = (bs: Block[]) => bs.reduce((a, b) => a + b.h, 0)

  const build = (s: number) => {
    const top: Block[] = []
    const mid: Block[] = []
    const foot: Block[] = []
    const gap = (to: Block[], n: number) => to.push({ h: Math.round(n * s), draw: () => {} })

    // Topo: logo, rótulo, título, filete
    const LW = Math.round(base.logo * s)
    const LH = Math.round(LW * ratio)
    top.push({ h: LH, draw: y => drawLogo(ctx, logo, cx - LW / 2, y, LW, LH) })
    gap(top, 44)

    const labelSize = Math.round(22 * s)
    top.push({
      h: labelSize,
      draw: y => {
        ctx.font = `700 ${labelSize}px ${SERIF}`
        ctx.fillStyle = GOLD_TEXT
        spacedCentered(ctx, d.label, cx, y, 7)
      },
    })
    gap(top, 18)

    const titleSize = Math.round(base.title * s)
    ctx.font = `700 ${titleSize}px ${SERIF}`
    const titleLines = wrapLines(ctx, d.title, IW)
    const titleLine = Math.round(titleSize * 1.15)
    top.push({
      h: titleLines.length * titleLine,
      draw: y => {
        ctx.font = `700 ${titleSize}px ${SERIF}`
        ctx.fillStyle = NAVY
        ctx.textAlign = 'center'
        titleLines.forEach((l, i) => ctx.fillText(l, cx, y + i * titleLine))
      },
    })
    gap(top, 26)
    top.push({
      h: 3,
      draw: y => { ctx.fillStyle = GOLD; ctx.fillRect(cx - 32, y, 64, 3) },
    })

    // Meio: aspas, frase, referência
    const quoteH = Math.round(50 * s)
    mid.push({
      h: quoteH,
      draw: y => {
        ctx.font = `700 ${Math.round(140 * s)}px ${SERIF}`
        ctx.fillStyle = GOLD
        ctx.textAlign = 'center'
        ctx.fillText('\u201C', cx, y - Math.round(18 * s))
      },
    })
    gap(mid, 14)

    const princSize = Math.round(base.principle * s)
    ctx.font = `italic 700 ${princSize}px ${SERIF}`
    const princLines = wrapLines(ctx, d.principle, IW)
    const princLine = Math.round(princSize * 1.28)
    mid.push({
      h: princLines.length * princLine,
      draw: y => {
        ctx.font = `italic 700 ${princSize}px ${SERIF}`
        ctx.fillStyle = NAVY
        ctx.textAlign = 'center'
        princLines.forEach((l, i) => ctx.fillText(l, cx, y + i * princLine))
      },
    })

    if (d.scripture) {
      gap(mid, 48)
      const sSize = Math.round(30 * s)
      const sPadX = Math.round(40 * s)
      const sPadY = Math.round(15 * s)
      ctx.font = `400 ${sSize}px ${SERIF}`
      const sW = Math.min(IW, spacedWidth(ctx, d.scripture, 5) + sPadX * 2)
      const sH = sSize + sPadY * 2
      mid.push({
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

    // Base: chamada + site
    if (d.cta) {
      const cSize = Math.round(32 * s)
      const cPadX = Math.round(54 * s)
      const cPadY = Math.round(20 * s)
      ctx.font = `600 ${cSize}px ${SANS}`
      const cW = Math.min(IW, ctx.measureText(d.cta).width + cPadX * 2)
      const cH = cSize + cPadY * 2
      foot.push({
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
      gap(foot, 22)
    }
    const siteSize = Math.round(24 * s)
    foot.push({
      h: Math.round(siteSize * 1.3),
      draw: y => {
        ctx.font = `400 ${siteSize}px ${SERIF}`
        ctx.fillStyle = GOLD_TEXT
        spacedCentered(ctx, '3minutesforlife.com', cx, y, 4)
      },
    })
    return { top, mid, foot, minGap: Math.round(60 * s) }
  }

  // Reduz a escala até caber, deixando respiro mínimo entre os três grupos
  let s = 1
  let L = build(s)
  while (sum(L.top) + sum(L.mid) + sum(L.foot) + L.minGap * 2 > availH && s > 0.45) {
    s = Math.round((s - 0.04) * 100) / 100
    L = build(s)
  }

  const draw = (bs: Block[], y: number) => { for (const b of bs) { b.draw(y); y += b.h } }
  const topH = sum(L.top), midH = sum(L.mid), footH = sum(L.foot)
  const footY = safe.top + availH - footH
  const midY  = safe.top + topH + Math.round((footY - (safe.top + topH) - midH) / 2)
  draw(L.top, safe.top)
  draw(L.mid, midY)
  draw(L.foot, footY)
}

// ─── WhatsApp (1200 × 630) ────────────────────────────────────────────────────

async function drawOg(ctx: CanvasRenderingContext2D, d: DrawData) {
  const { w, h } = SHARE_DIMS.og
  const safe  = SAFE.og
  const IW    = w - safe.x * 2
  const availH = h - safe.top - safe.bottom

  const logo  = await loadLogo(d.logoVerticalDataUrl || d.logoDataUrl)
  const LW    = 330
  const LH    = Math.round(LW * logo.height / logo.width)
  const GAP   = 46
  const textMaxW = IW - LW - GAP * 2 - 2 - 40

  // Título: até 2 linhas, reduzindo a fonte se preciso
  let titleSize = 76
  let titleLines: string[] = []
  for (; titleSize >= 44; titleSize -= 2) {
    ctx.font = `800 ${titleSize}px ${SERIF}`
    titleLines = wrapLines(ctx, d.title, textMaxW)
    if (titleLines.length <= 2) break
  }
  ctx.font = `800 ${titleSize}px ${SERIF}`
  const titleLine = Math.round(titleSize * 1.12)

  // Referência bíblica: sempre inteira numa linha
  let scripSize = 34
  if (d.scripture) {
    for (; scripSize >= 18; scripSize -= 1) {
      ctx.font = `400 ${scripSize}px ${SERIF}`
      if (spacedWidth(ctx, d.scripture, 5) <= textMaxW) break
    }
  }

  const labelSize = 20
  ctx.font = `700 ${labelSize}px ${SERIF}`
  const labelW = spacedWidth(ctx, d.label, 6)
  ctx.font = `800 ${titleSize}px ${SERIF}`
  const titleW = Math.max(...titleLines.map(l => ctx.measureText(l).width))
  ctx.font = `400 ${scripSize}px ${SERIF}`
  const scripW = d.scripture ? spacedWidth(ctx, d.scripture, 5) : 0
  const ctaSize = 28
  ctx.font = `600 ${ctaSize}px ${SANS}`
  const ctaText = d.cta ? `${d.cta} \u2192` : ''
  const ctaW = ctaText ? ctx.measureText(ctaText).width : 0

  const textW = Math.min(textMaxW, Math.max(labelW, titleW, scripW, ctaW))
  const groupW = LW + GAP + 2 + GAP + textW
  const x0 = Math.round((w - groupW) / 2)
  const textCx = x0 + LW + GAP + 2 + GAP + textW / 2

  const textH = labelSize + 26 + titleLines.length * titleLine + 26 + 3
    + (d.scripture ? 26 + scripSize : 0) + (ctaText ? 34 + ctaSize : 0)
  const colH = Math.min(Math.max(LH, textH), availH)
  const top = safe.top + Math.round((availH - colH) / 2)

  drawLogo(ctx, logo, x0, top + Math.round((colH - LH) / 2), LW, LH)

  const sepH = Math.min(colH, Math.max(LH, textH))
  ctx.fillStyle = 'rgba(184,134,58,0.45)'
  ctx.fillRect(x0 + LW + GAP, top + Math.round((colH - sepH) / 2), 2, sepH)

  let y = top + Math.round((colH - textH) / 2)

  ctx.font = `700 ${labelSize}px ${SERIF}`
  ctx.fillStyle = GOLD_TEXT
  spacedCentered(ctx, d.label, textCx, y, 6)
  y += labelSize + 26

  ctx.font = `800 ${titleSize}px ${SERIF}`
  ctx.fillStyle = NAVY
  ctx.textAlign = 'center'
  titleLines.forEach((l, i) => ctx.fillText(l, textCx, y + i * titleLine))
  y += titleLines.length * titleLine + 26

  ctx.fillStyle = GOLD
  ctx.fillRect(textCx - 28, y, 56, 3)
  y += 3

  if (d.scripture) {
    y += 26
    ctx.font = `400 ${scripSize}px ${SERIF}`
    ctx.fillStyle = GOLD_TEXT
    spacedCentered(ctx, d.scripture, textCx, y, 5)
    y += scripSize
  }

  if (ctaText) {
    y += 34
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
    await drawCentered(ctx, format, data, { logo: 640, title: 50, principle: 84 })
  } else if (format === 'feed') {
    await drawCentered(ctx, format, data, { logo: 520, title: 42, principle: 66 })
  } else {
    await drawCentered(ctx, format, data, { logo: 440, title: 38, principle: 54 })
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), 'image/png')
  )
}
