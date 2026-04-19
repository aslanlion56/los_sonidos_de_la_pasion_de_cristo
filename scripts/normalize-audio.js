#!/usr/bin/env node
/**
 * Normaliza el volumen percibido de cada MP3 a un LUFS integrado fijo (por defecto -20 LUFS).
 * Cada archivo se sube o baja lo que haga falta (EBU R128 vía loudnorm en 2 pasos).
 * Los originales en public/audios/ no se modifican; el resultado va a public/<carpeta>/
 * con la misma estructura (incl. cortos/).
 *
 * Calidad: loudnorm linear (2 pasos) + libmp3lame -q:a 0 (máxima VBR habitual en LAME).
 * Sigue siendo MP3 recodificado; para archivo sin pérdida habría que usar FLAC/WAV.
 *
 * Requiere: ffmpeg con loudnorm (brew install ffmpeg)
 *
 * Uso:
 *   node scripts/normalize-audio.js
 *   node scripts/normalize-audio.js --target -10
 *   node scripts/normalize-audio.js --target -14 --out audios_volumen_14
 *
 * npm:
 *   npm run normalize-audio          → -20 LUFS → public/audios_volumen_20/
 *   npm run normalize-audio:10       → -10 LUFS → public/audios_volumen_10/
 *   npm run normalize-audio:15       → -15 LUFS → public/audios_volumen_15/
 */

import { spawnSync } from 'child_process'
import { readdirSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIOS_ROOT = join(__dirname, '..', 'public', 'audios')

/** Techo de pico verdadero recomendado para streaming/colas digitales. */
const TRUE_PEAK = -1.5
/** Rango alto (LU); 11 es habitual en música; afecta cómo loudnorm reparte dinámica. */
const LRA = 11

function parseArgs() {
  const args = process.argv.slice(2)
  let targetI = -20
  let outDir = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      targetI = parseFloat(args[++i])
      continue
    }
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[++i].replace(/^\/+|\/+$/g, '')
      continue
    }
  }
  if (!Number.isFinite(targetI)) {
    console.error('Uso: --target <número LUFS, ej. -20 o -10>')
    process.exit(1)
  }
  if (!outDir) {
    outDir = `audios_volumen_${Math.abs(Math.round(targetI))}`
  }
  const outputRoot = join(__dirname, '..', 'public', outDir)
  return { targetI, outDir, outputRoot }
}

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

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function parseLoudnormJson(stderr) {
  const marker = '[Parsed_loudnorm'
  const i = stderr.indexOf(marker)
  const chunk = i === -1 ? stderr : stderr.slice(i)
  const brace0 = chunk.indexOf('{')
  if (brace0 === -1) throw new Error('No se encontró JSON de loudnorm')
  let depth = 0
  for (let j = brace0; j < chunk.length; j++) {
    const c = chunk[j]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        return JSON.parse(chunk.slice(brace0, j + 1))
      }
    }
  }
  throw new Error('JSON de loudnorm incompleto')
}

function loudnormMeasure(absInput, targetI) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      absInput,
      '-af',
      `loudnorm=I=${targetI}:TP=${TRUE_PEAK}:LRA=${LRA}:print_format=json`,
      '-f',
      'null',
      '-',
    ],
    { stdio: 'pipe', encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  )
  const stderr = result.stderr || ''
  if (result.status !== 0) {
    throw new Error(stderr.slice(-2000) || `ffmpeg paso 1 falló (${result.status})`)
  }
  return parseLoudnormJson(stderr)
}

function buildSecondPassFilter(targetI, measured) {
  const {
    input_i: measured_I,
    input_lra: measured_LRA,
    input_tp: measured_TP,
    input_thresh: measured_thresh,
    target_offset: offset,
  } = measured
  return [
    `loudnorm=I=${targetI}`,
    `TP=${TRUE_PEAK}`,
    `LRA=${LRA}`,
    `measured_I=${measured_I}`,
    `measured_LRA=${measured_LRA}`,
    `measured_TP=${measured_TP}`,
    `measured_thresh=${measured_thresh}`,
    `offset=${offset}`,
    'linear=true',
    'print_format=summary',
  ].join(':')
}

function loudnormEncode(absInput, absOutput, targetI, measured) {
  ensureDir(dirname(absOutput))
  const af = buildSecondPassFilter(targetI, measured)
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-y',
      '-i',
      absInput,
      '-af',
      af,
      '-map_metadata',
      '0',
      '-c:a',
      'libmp3lame',
      '-q:a',
      '0',
      absOutput,
    ],
    { stdio: 'pipe', encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr?.slice(-2000) || `ffmpeg paso 2 falló (${result.status})`)
  }
}

function main() {
  const { targetI, outDir, outputRoot } = parseArgs()

  console.log(`Origen: public/audios/  →  Destino: public/${outDir}/`)
  console.log(`Objetivo: ${targetI} LUFS integrado (2 pasos loudnorm + LAME -q:a 0)\n`)

  if (!existsSync(AUDIOS_ROOT)) {
    console.error('No existe public/audios/')
    process.exit(1)
  }

  const files = findMp3Files(AUDIOS_ROOT)
  if (files.length === 0) {
    console.log('No se encontraron archivos .mp3')
    process.exit(1)
  }
  console.log(`Encontrados ${files.length} archivos.\n`)

  ensureDir(outputRoot)

  let ok = 0
  let fail = 0

  for (let i = 0; i < files.length; i++) {
    const rel = files[i]
    const input = join(AUDIOS_ROOT, rel)
    const output = join(outputRoot, rel)
    process.stdout.write(`[${i + 1}/${files.length}] ${rel}\n  medición... `)
    try {
      const measured = loudnormMeasure(input, targetI)
      const inLufs = parseFloat(measured.input_i)
      process.stdout.write(`${inLufs.toFixed(1)} → ${targetI} LUFS  codificando... `)
      loudnormEncode(input, output, targetI, measured)
      console.log('OK')
      ok++
    } catch (err) {
      console.log('ERROR', err.message)
      fail++
    }
  }

  console.log(`\nListo: ${ok} archivo(s) en public/${outDir}/`)
  if (fail) console.log(`Fallidos: ${fail}`)
  if (fail) process.exit(1)
}

main()
