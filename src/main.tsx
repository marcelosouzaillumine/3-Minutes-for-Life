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