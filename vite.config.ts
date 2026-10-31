import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identifica a versão publicada (commit do deploy) para mostrar em Configurações.
const APP_VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'dev').slice(0, 7)

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['branding/pwa-icon-192x192.png', 'branding/pwa-icon-512x512.png'],
      manifest: {
        name: '3 Minutes for Life',
        short_name: '3 Minutes',
        description: 'Três minutos para parar, refletir e viver melhor.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'branding/pwa-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'branding/pwa-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
