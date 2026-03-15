#!/usr/bin/env node
/**
 * Homologa el volumen de todos los MP3 y los sube ~10% respecto al más bajo.
 * 1. Mide el LUFS de cada archivo.
 * 2. Toma como base el LUFS del archivo más bajo y le suma VOLUME_BOOST_DB (+1 dB ≈ 10%).
 * 3. Normaliza todos a ese nivel (los fuertes bajan, los débiles se amplifican hasta el objetivo).
 *
 * Requiere: ffmpeg instalado (brew install ffmpeg / apt install ffmpeg)
 *
 * Uso: node scripts/normalize-audio.js
 *
 * Crea public/audios_normalized/ con la misma estructura.
 */

import { spawnSync } from 'child_process'
import { readdirSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIOS_ROOT = join(__dirname, '..', 'public', 'audios')
const OUTPUT_ROOT = join(__dirname, '..', 'public', 'audios_normalized')

const LRA = 7
const TRUE_PEAK = -2
/** Subir el volumen un ~10% respecto al más bajo: +1 dB en LUFS */
const VOLUME_BOOST_DB = 1

function findMp3Files(dir, base = '') {
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

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

/**
 * Mide el LUFS integrado del archivo (input_i en la salida de loudnorm).
 */
function measureLoudness(relPath) {
  const input = join(AUDIOS_ROOT, relPath)
  const result = spawnSync('ffmpeg', [
    '-i', input,
    '-af', 'loudnorm=I=-23:TP=-1:print_format=json',
    '-f', 'null', '-'
  ], { stdio: 'pipe', encoding: 'utf8' })

  const stderr = result.stderr || ''
  const match = stderr.match(/"input_i"\s*:\s*"([^"]+)"/)
  if (!match) {
    throw new Error(`No se pudo medir LUFS: ${relPath}`)
  }
  return parseFloat(match[1])
}

/**
 * Normaliza el archivo al LUFS objetivo.
 */
function normalizeFile(relPath, targetLUFS) {
  const input = join(AUDIOS_ROOT, relPath)
  const output = join(OUTPUT_ROOT, relPath)
  const outputDir = dirname(output)
  ensureDir(outputDir)

  const filter = `loudnorm=I=${targetLUFS}:LRA=${LRA}:TP=${TRUE_PEAK}`
  const result = spawnSync('ffmpeg', [
    '-y', '-i', input, '-af', filter,
    '-c:a', 'libmp3lame', '-q:a', '2', output
  ], { stdio: 'pipe', encoding: 'utf8' })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.error?.message || 'ffmpeg falló')
  }
}

function main() {
  console.log('Buscando archivos MP3 en public/audios/...')
  const files = findMp3Files(AUDIOS_ROOT)
  if (files.length === 0) {
    console.log('No se encontraron archivos .mp3')
    process.exit(1)
  }
  console.log(`Encontrados ${files.length} archivos.\n`)

  console.log('Paso 1: midiendo volumen (LUFS) de cada archivo...\n')
  const measurements = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    process.stdout.write(`  [${i + 1}/${files.length}] ${f} ... `)
    try {
      const lufs = measureLoudness(f)
      measurements.push({ relPath: f, lufs })
      console.log(`${lufs.toFixed(1)} LUFS`)
    } catch (err) {
      console.log('ERROR:', err.message)
    }
  }

  if (measurements.length === 0) {
    console.log('No se pudo medir ningún archivo.')
    process.exit(1)
  }

  const minLUFS = Math.min(...measurements.map(m => m.lufs))
  const targetLUFS = minLUFS + VOLUME_BOOST_DB
  const quietest = measurements.find(m => m.lufs === minLUFS)
  console.log(`\nArchivo más bajo: ${quietest.relPath} → ${minLUFS.toFixed(1)} LUFS`)
  console.log(`Objetivo: ${targetLUFS.toFixed(1)} LUFS (+${VOLUME_BOOST_DB} dB, ~10% más volumen).\n`)

  console.log('Paso 2: normalizando todos al mismo volumen...\n')
  ensureDir(OUTPUT_ROOT)

  for (let i = 0; i < measurements.length; i++) {
    const { relPath, lufs } = measurements[i]
    process.stdout.write(`[${i + 1}/${measurements.length}] ${relPath} (${lufs.toFixed(1)} → ${targetLUFS.toFixed(1)} LUFS) ... `)
    try {
      normalizeFile(relPath, targetLUFS)
      console.log('OK')
    } catch (err) {
      console.log('ERROR:', err.message)
    }
  }

  console.log('\nListo. Archivos normalizados en: public/audios_normalized/')
  console.log('Si te convence el resultado, reemplaza el contenido de public/audios/')
  console.log('por el de public/audios_normalized/ (o renombra carpetas).')
}

main()
