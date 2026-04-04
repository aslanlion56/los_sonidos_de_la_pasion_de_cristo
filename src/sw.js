import { clientsClaim, skipWaiting } from 'workbox-core'
import { addPlugins, cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { RangeRequestsPlugin } from 'workbox-range-requests'

skipWaiting()
clientsClaim()

// Sin esto, PrecacheStrategy usa un cacheWillUpdate que acepta 206 y cache.put() revienta.
// RangeRequestsPlugin sirve rangos desde la respuesta 200 completa en caché.
addPlugins([
  new CacheableResponsePlugin({ statuses: [200] }),
  new RangeRequestsPlugin(),
])

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    allowlist: [/^\/.*/],
  }),
)

registerRoute(
  ({ request }) =>
    request.destination !== 'document' &&
    /\.(?:js|css|svg|png|jpg|jpeg|gif|webp)$/.test(new URL(request.url).pathname),
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
  'GET',
)
