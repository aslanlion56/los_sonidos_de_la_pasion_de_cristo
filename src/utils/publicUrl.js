/** Rutas a archivos en `public/` compatibles con web, Electron (file://) y Capacitor. */
export function publicUrl(path) {
  const base = import.meta.env.BASE_URL || '/'
  const p = path.replace(/^\//, '')
  if (base === '/' || base === '') return `/${p}`
  const b = base.endsWith('/') ? base : `${base}/`
  return `${b}${p}`
}
