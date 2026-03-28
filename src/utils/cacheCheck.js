// Comprueba si una URL de audio ya está en alguna caché del SW (precache o audios-cache)
export const checkAudioCache = async (audioUrl) => {
  if (!('caches' in window)) {
    return false
  }

  try {
    const resolved = new URL(audioUrl, window.location.origin).href
    const hit = await caches.match(resolved)
    if (hit) return true
    const hitEncoded = await caches.match(encodeURI(resolved))
    return !!hitEncoded
  } catch (error) {
    console.error('Error al verificar cache:', error)
    return false
  }
}

export const checkMultipleAudioCache = async (audioUrls) => {
  const results = {}
  for (const url of audioUrls) {
    results[url] = await checkAudioCache(url)
  }
  return results
}
