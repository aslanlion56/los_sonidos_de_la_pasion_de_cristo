import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isNative = process.env.BUILD_NATIVE === '1'

// `base: './'` permite cargar la misma build desde Electron (file://) y Capacitor sin rutas rotas.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    ...(isNative
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
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
                  type: 'image/svg+xml',
                },
              ],
            },
            injectManifest: {
              injectionPoint: 'self.__WB_MANIFEST',
              maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
              globPatterns: ['**/*.{js,css,html,svg,png}', 'audios/**/*.mp3'],
              additionalManifestEntries: [{ url: 'index.html', revision: null }],
            },
            devOptions: {
              enabled: false,
            },
          }),
        ]),
  ],
})
