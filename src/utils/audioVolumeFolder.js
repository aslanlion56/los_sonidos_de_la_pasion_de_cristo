/** Carpeta en `public/` con MP3 normalizados a ~-10 LUFS (más volumen). */
export const AUDIO_VOLUME_FOLDER_LOUD = 'audios_volumen_12'
/** Carpeta en `public/` con MP3 normalizados a ~-15 LUFS (intermedio). */
export const AUDIO_VOLUME_FOLDER_MID = 'audios_volumen_15'
/** Carpeta en `public/` con MP3 normalizados a ~-20 LUFS (más suave). */
export const AUDIO_VOLUME_FOLDER_SOFT = 'audios_volumen_20'

/**
 * Sustituye el segmento `audios/` por una carpeta `audios_volumen_*`
 * (mantiene `./`, base URL, y `cortos/`).
 */
export function audioSrcForVolumeFolder(src, folder) {
  return String(src).replace(/(^|\/|\.\/)audios(\/)/, `$1${folder}$2`)
}
