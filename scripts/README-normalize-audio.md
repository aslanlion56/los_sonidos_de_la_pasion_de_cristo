# Homologar volumen de todos los audios

Identifica el audio con **volumen más bajo** (más silencioso) y normaliza **todos** los MP3 a ese mismo nivel. Así no hay que tocar el volumen al reproducir y no se amplifica nada (solo se bajan los que suenan más fuerte).

## Requisito

- **ffmpeg** instalado:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: descargar desde https://ffmpeg.org/

## Uso

```bash
npm run normalize-audio
```

El script:

1. **Paso 1:** Mide el LUFS (volumen percibido) de cada `.mp3` en `public/audios/` (principales y `cortos/`).
2. **Paso 2:** Toma como objetivo el LUFS del archivo **más bajo** (el más silencioso).
3. **Paso 3:** Normaliza todos los archivos a ese nivel y los escribe en **`public/audios_normalized/`** (misma estructura de carpetas).

**No modifica los originales.** Los normalizados se generan en una carpeta aparte.

## Después de ejecutar

1. Escucha algunos archivos en `public/audios_normalized/` para comprobar que el volumen te convence.
2. Si quieres usarlos en la app:
   - Opción A: renombrar `public/audios` a `public/audios_backup` y `public/audios_normalized` a `public/audios`.
   - Opción B: copiar el contenido de `audios_normalized/` sobre `audios/` (reemplazando los MP3).
