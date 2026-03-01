// Utilidad para precachear archivos de audio cuando la app se carga
export const precacheAudioFiles = async () => {
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      // Esperar a que el Service Worker esté listo
      if (navigator.serviceWorker.controller) {
        const cache = await caches.open('audio-files-cache');
        
        // Lista de todos los archivos de audio
        const audioFiles = [
          // Audios principales
          '/audios/01- The Olive Garden Night Sky.mp3',
          '/audios/02- Mary Goes To Jesus.mp3',
          '/audios/03- Song of Complaint.mp3',
          '/audios/04- Jesus Arrested.mp3',
          '/audios/05- Bearing The Cross.mp3',
          '/audios/06- The Stoning.mp3',
          '/audios/07- Flagellation Dark Choir Disciples.mp3',
          '/audios/09- Peaceful But Primitive Procession.mp3',
          '/audios/10- It Is Done.mp3',
          '/audios/11- Peter Denies Jesus.mp3',
          '/audios/12- Resurrection.mp3',
          // Audios secundarios
          '/audios/cortos/01- Puerta.mp3',
          '/audios/cortos/02- Fogata.mp3',
          '/audios/cortos/03- Gallo.mp3',
          '/audios/cortos/04- Tormenta.mp3',
          '/audios/cortos/05- Tierra temblando.mp3',
          '/audios/cortos/06- Via dolorosa.mp3',
          '/audios/cortos/07- Tu esta aqui.mp3'
        ];

        // Precachear archivos de audio en segundo plano (uno por uno para evitar sobrecarga)
        for (const url of audioFiles) {
          try {
            // Crear request con diferentes variaciones de URL
            const urlVariations = [
              url,
              encodeURI(url),
              decodeURIComponent(url)
            ];
            
            let cached = null;
            for (const urlVar of urlVariations) {
              cached = await cache.match(urlVar);
              if (cached) break;
            }
            
            if (!cached) {
              // Intentar fetch con diferentes estrategias
              let response = null;
              try {
                response = await fetch(url, { 
                  cache: 'force-cache'
                });
              } catch (e) {
                try {
                  response = await fetch(encodeURI(url));
                } catch (e2) {
                  console.log(`⚠️ No se pudo cachear: ${url}`);
                  continue;
                }
              }
              
              if (response && response.ok) {
                // Cachear con todas las variaciones de URL
                for (const urlVar of urlVariations) {
                  await cache.put(urlVar, response.clone());
                }
                console.log(`✅ Audio cacheado: ${url}`);
              }
            } else {
              console.log(`ℹ️ Ya en cache: ${url}`);
            }
          } catch (error) {
            console.log(`⚠️ Error al cachear ${url}:`, error);
          }
        }
      } else {
        console.log('⏳ Esperando Service Worker...');
        // Reintentar después de un momento
        setTimeout(precacheAudioFiles, 1000);
      }
    } catch (error) {
      console.error('Error al precachear audios:', error);
    }
  }
};
