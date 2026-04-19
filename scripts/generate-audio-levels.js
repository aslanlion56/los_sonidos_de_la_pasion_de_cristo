#!/usr/bin/env node
/**
 * Mide LUFS integrado (input_i de loudnorm) en paralelo para cada carpeta:
 *   public/audios, audios_comprimidos, audios_volumen_10, audios_volumen_15, audios_volumen_20
 * y escribe src/data/audioLevels.json con byTrack[ "audios/…" ] → { audios, audios_comprimidos, … }.
 *
 * Requiere: ffmpeg
 * Uso: node scripts/generate-audio-levels.js
 *      npm run audio-levels
 */

import { spawnSync } from 'child_process'
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_ROOT = join(__dirname, '..', 'public')
const OUT_FILE = join(__dirname, '..', 'src', 'data', 'audioLevels.json')

const SOURCES = [
  { prop: 'audios', subdir: 'audios' },
  { prop: 'audios_comprimidos', subdir: 'audios_comprimidos' },
  { prop: 'audios_volumen_10', subdir: 'audios_volumen_10' },
  { prop: 'audios_volumen_15', subdir: 'audios_volumen_15' },
  { prop: 'audios_volumen_20', subdir: 'audios_volumen_20' },
]

function findMp3Files(dir, base = '') {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) {
      files.push(...findMp3Files(join(dir, e.name), rel))
    } else if (e.name.endsWith('.mp3')) {
      files.push(rel)
    }
  }
  return files
}

function measureLoudness(absPath) {
  const result = spawnSync(
    'ffmpeg',
    ['-i', absPath, '-af', 'loudnorm=I=-23:TP=-1:print_format=json', '-f', 'null', '-'],
    { stdio: 'pipe', encoding: 'utf8' },
  )
  const stderr = result.stderr || ''
  const match = stderr.match(/"input_i"\s*:\s*"([^"]+)"/)
  if (!match) {
    throw new Error('No se pudo leer input_i (loudnorm)')
  }
  return Math.round(parseFloat(match[1]) * 10) / 10
}

/** Clave canónica siempre bajo audios/… (misma ruta relativa en cada carpeta). */
function canonicalKey(relInsideTree) {
  return join('audios', relInsideTree).replace(/\\/g, '/')
}

function main() {
  console.log(
    'Midiendo LUFS en: audios, audios_comprimidos, audios_volumen_10, audios_volumen_15, audios_volumen_20\n',
  )

  const byTrack = {}
  let measured = 0
  const errors = []

  for (const { prop, subdir } of SOURCES) {
    const root = join(PUBLIC_ROOT, subdir)
    if (!existsSync(root)) {
      console.warn(`  [omitido] no existe public/${subdir}/`)
      continue
    }
    const relPaths = findMp3Files(root)
    if (relPaths.length === 0) {
      console.warn(`  [omitido] sin MP3 en public/${subdir}/`)
      continue
    }
    console.log(`→ ${subdir}/ (${relPaths.length} archivos)`)
    for (let i = 0; i < relPaths.length; i++) {
      const rel = relPaths[i]
      const abs = join(root, rel)
      const cKey = canonicalKey(rel)
      process.stdout.write(`    [${i + 1}/${relPaths.length}] ${cKey} ... `)
      try {
        const lufs = measureLoudness(abs)
        if (!byTrack[cKey]) byTrack[cKey] = {}
        byTrack[cKey][prop] = lufs
        measured++
        console.log(`${lufs} LUFS`)
      } catch (err) {
        console.log('ERROR:', err.message)
        errors.push({ cKey, prop, message: err.message })
      }
    }
    console.log('')
  }

  if (Object.keys(byTrack).length === 0) {
    console.error('No se midió ningún archivo. ¿Existen carpetas con MP3 en public/?')
    process.exit(1)
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    unit: 'LUFS_I',
    description:
      'Por pista: LUFS integrado (input_i) por carpeta; mismas claves audios/… para las cuatro fuentes.',
    byTrack,
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Escrito: ${OUT_FILE}`)
  console.log(`Pistas (claves canónicas): ${Object.keys(byTrack).length} · Mediciones totales: ${measured}`)
  if (errors.length) {
    console.warn(`Advertencias: ${errors.length} fallo(s) al medir.`)
    process.exit(1)
  }
}

main()
