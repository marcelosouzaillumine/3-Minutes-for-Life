import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { illumineAuth } from './lib/illumine'
import { initBranding } from './lib/branding'

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
  </StrictMode>,
)