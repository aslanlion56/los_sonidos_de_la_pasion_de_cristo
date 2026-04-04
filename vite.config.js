import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
        additionalManifestEntries: [{ url: '/index.html', revision: null }],
      },
      // injectManifest + src/sw.js en ESM: en dev Vite puede servir el SW con `import`
      // y el registro/HMR a veces lo trata como script clásico → "Cannot use import statement outside a module".
      // En prod el SW se empaqueta bien; para probar PWA usa `npm run build && npm run preview`.
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
