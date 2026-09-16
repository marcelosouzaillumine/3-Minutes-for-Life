/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'

const GATEWAY  = process.env.VITE_ILLUMINE_URL || 'https://splendid-nourishment-production-8e84.up.railway.app'
const TENANT   = process.env.VITE_TENANT_SLUG  || '3minutes'
const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://www.3minutesforlife.com'

const BOT_UA = /whatsapp|facebookexternalhit|facebookcatalog|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|iframely|embedly|outbrain|pinterest|vkshare|w3c_validator|baiduspider|yandexbot/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = (req.headers['user-agent'] || '') as string
  const isBot = BOT_UA.test(ua)

  const code        = (req.query.code as string) || ''
  const devotionalId = (req.query.d    as string) || ''
  const lang        = (req.query.lang  as string) || 'pt-BR'

  // ── Para usuários normais: serve o SPA ──────────────────────────────────────
  if (!isBot) {
    try {
      const indexRes = await fetch(`${BASE_URL}/index.html`)
      const html = await indexRes.text()
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(200).send(html)
    } catch {
      // fallback: redireciona para a URL original (sem rewrite)
      return res.redirect(302, `/r/${code}?d=${devotionalId}&lang=${lang}`)
    }
  }

  // ── Para bots: busca dados e retorna og:html ────────────────────────────────
  let title       = '3 Minutes For Life'
  let description = 'Três minutos que mudam um dia.'
  let scripture   = ''
  let senderName  = ''

  try {
    if (devotionalId) {
      const devRes = await fetch(`${GATEWAY}/devotionals/${devotionalId}?lang=${lang}`, {
        headers: { 'x-tenant-slug': TENANT },
      })
      if (devRes.ok) {
        const data = await devRes.json() as any
        title       = data.title || title
        description = data.principle_statement || data.principleStatement || description
        scripture   = data.scripture_reference || data.scriptureReference || ''
      }
    }

    if (code && code !== 'DEVOC') {
      const refRes = await fetch(`${GATEWAY}/referrals/${encodeURIComponent(code)}`, {
        headers: { 'x-tenant-slug': TENANT },
      })
      if (refRes.ok) {
        const refData = await refRes.json() as any
        const first = (refData.name ?? '').trim().split(/\s+/)[0]
        if (first) senderName = first
      }
    }
  } catch { /* best-effort */ }

  const ogImageUrl  = `${BASE_URL}/og-preview.png`
  const canonicalUrl = `${BASE_URL}/r/${code}?d=${devotionalId}&lang=${lang}`
  const ogTitle     = senderName
    ? `${senderName} compartilhou: ${title}`
    : title
  const ogDesc      = [description, scripture].filter(Boolean).join(' · ')

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(ogTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="article" />
  <meta property="og:url"         content="${escHtml(canonicalUrl)}" />
  <meta property="og:title"       content="${escHtml(ogTitle)}" />
  <meta property="og:description" content="${escHtml(ogDesc)}" />
  <meta property="og:image"       content="${escHtml(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height"content="630" />
  <meta property="og:site_name"   content="3 Minutes For Life" />
  <meta property="og:locale"      content="${lang.replace('-', '_')}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${escHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escHtml(ogDesc)}" />
  <meta name="twitter:image"       content="${escHtml(ogImageUrl)}" />

  <!-- WhatsApp reads og: tags above -->
  <link rel="canonical" href="${escHtml(canonicalUrl)}" />
</head>
<body>
  <p>${escHtml(ogTitle)}</p>
  <p>${escHtml(description)}</p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).send(html)
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
