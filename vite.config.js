import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sonidos de la Pasión de Cristo',
        short_name: 'Sonidos Pasión',
        description: 'Landing page de audios de la Pasión de Cristo',
        theme_color: '#ae0714',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Sin caché de audio: los audios se cargan directamente desde la red/origen
        runtimeCaching: [
          {
            // Cachear recursos estáticos
            urlPattern: /\.(?:js|css|html|svg|png|jpg|jpeg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          },
          {
            // Fallback para navegación
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3
            }
          }
        ],
        // Precachear archivos importantes
        additionalManifestEntries: [
          { url: '/index.html', revision: null }
        ],
        // Asegurar que el Service Worker se active inmediatamente
        skipWaiting: true,
        clientsClaim: true,
        // Importar scripts de Workbox para mejor manejo offline
        importScripts: []
      },
      // Estrategia de actualización
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
