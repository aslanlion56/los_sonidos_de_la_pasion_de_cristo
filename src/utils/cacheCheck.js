// Utilidad para verificar si un archivo de audio está en cache
export const checkAudioCache = async (audioUrl) => {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open('audio-files-cache');
    
    // Intentar diferentes variaciones de URL
    const urlVariations = [
      audioUrl,
      encodeURI(audioUrl),
      decodeURIComponent(audioUrl),
      new URL(audioUrl, window.location.origin).pathname
    ];

    for (const url of urlVariations) {
      const cached = await cache.match(url);
      if (cached) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error al verificar cache:', error);
    return false;
  }
};

// Verificar múltiples audios a la vez
export const checkMultipleAudioCache = async (audioUrls) => {
  const results = {};
  
  for (const url of audioUrls) {
    results[url] = await checkAudioCache(url);
  }
  
  return results;
};
