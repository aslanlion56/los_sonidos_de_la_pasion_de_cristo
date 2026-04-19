/** Clave `audios/...` relativa a `public/`, para cruzar `src` del player con audioLevels.json */
export function srcToPublicKey(src) {
  if (!src) return ''
  const m = String(src).match(/audios\/.+\.mp3$/i)
  return m ? m[0] : ''
}
