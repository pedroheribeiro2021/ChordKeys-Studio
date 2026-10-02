import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Instalável no celular e funciona offline. No iPhone, só o app instalado na
    // tela inicial escapa da limpeza automática de dados do Safari (importante
    // para as cifras salvas).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ChordKeys Studio',
        short_name: 'ChordKeys',
        description: 'Veja e ouça os acordes de qualquer cifra.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#121216',
        theme_color: '#e5383b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // O leitor de PDF (~1,7 MB) fica fora da instalação: é guardado na primeira
        // vez que alguém abre um PDF e depois funciona offline.
        globIgnores: ['**/pdf-*.js', '**/pdf.worker*'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/pdf[-.].*\.m?js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'pdf-reader' },
          },
        ],
      },
    }),
  ],
})
