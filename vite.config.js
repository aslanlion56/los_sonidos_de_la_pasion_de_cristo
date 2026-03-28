import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'audios/**/*.mp3'],
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
        // Fallback de navegación: servir index.html para que la app funcione 100% offline
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/.*/],
        runtimeCaching: [
          {
            // Respaldo si alguna petición no cae en el precache; MP3 suele ir con Range → 206
            urlPattern: /\/audios\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audios-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200, 206] },
              rangeRequests: true
            }
          },
          {
            // No interceptar documento (navegación); solo js, css, imágenes
            urlPattern: ({ request }) =>
              request.destination !== 'document' &&
              /\.(?:js|css|svg|png|jpg|jpeg|gif|webp)$/.test(new URL(request.url).pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          }
        ],
        additionalManifestEntries: [
          { url: '/index.html', revision: null }
        ],
        skipWaiting: true,
        clientsClaim: true,
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
