import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { illumineAuth } from './lib/illumine'
import { initBranding } from './lib/branding'
import { ErrorBoundary } from './components/ErrorBoundary'

// Sem VITE_SENTRY_DSN configurada (nenhuma até hoje — auditoria 360°
// encontrou zero observabilidade de produção no 3ML), Sentry.init() com
// enabled:false é um no-op seguro: não faz request nenhuma, não muda
// comportamento. Ativar é só configurar a env var no Vercel.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN,
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

if (!GOOGLE_CLIENT_ID) {
  console.warn('VITE_GOOGLE_CLIENT_ID não configurado. Login com Google indisponível.')
}

// Initialize Illumine tokens from storage before rendering (async, non-blocking)
illumineAuth.init().catch(e => console.warn('[Illumine] init warning:', e))
// Fetch tenant branding and apply CSS variables (fire-and-forget; falls back to hardcoded CSS)
initBranding().catch(() => {})

// Quando uma versão nova do app assume (service worker novo), atualiza: sem isso uma janela aberta há dias
// continua com telas antigas, mesmo depois do deploy. No meio da leitura em família não recarrega à força:
// mostra um aviso e atualiza quando a pessoa tocar nele ou sair da leitura.
const UPDATE_TEXT: Record<string, [string, string]> = {
  pt: ['Nova versão disponível', 'Atualizar'], en: ['New version available', 'Update'], es: ['Nueva versión disponible', 'Actualizar'],
  fr: ['Nouvelle version disponible', 'Mettre à jour'], it: ['Nuova versione disponibile', 'Aggiorna'],
}
function offerUpdate() {
  if (!document.querySelector('.ritual')) { window.location.reload(); return }
  if (document.getElementById('update-banner')) return
  const [msg, action] = UPDATE_TEXT[(navigator.language || 'pt').slice(0, 2)] ?? UPDATE_TEXT.pt
  const bar = document.createElement('div')
  bar.id = 'update-banner'
  bar.setAttribute('role', 'status')
  bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 8px);z-index:9999;display:flex;gap:12px;align-items:center;padding:8px 8px 8px 16px;border-radius:999px;background:#1F2430;color:#fff;font:500 13px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2)'
  const text = document.createElement('span')
  text.textContent = msg
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = action
  btn.style.cssText = 'border:0;border-radius:999px;padding:6px 14px;background:#fff;color:#1F2430;font:inherit;cursor:pointer'
  btn.onclick = () => window.location.reload()
  bar.append(text, btn)
  document.body.appendChild(bar)
  const watch = new MutationObserver(() => { if (!document.querySelector('.ritual')) window.location.reload() })
  watch.observe(document.body, { childList: true, subtree: true })
}
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let notified = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (notified) return
    notified = true
    offerUpdate()
  })
  // App instalado fica aberto em segundo plano e não navega: ao voltar para ele, procura versão nova.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GoogleOAuthProvider>
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
)