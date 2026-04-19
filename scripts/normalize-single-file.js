#!/usr/bin/env node
/**
 * Normaliza un MP3 a un LUFS integrado objetivo (misma cadena que normalize-audio.js).
 *
 * Uso:
 *   node scripts/normalize-single-file.js --in public/audios/foo.mp3 --out public/audios_volumen_10/foo.mp3 --target -10
 */

import { spawnSync } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const LRA = 11

function parseArgs() {
  const args = process.argv.slice(2)
  let input = null
  let output = null
  let targetI = -20
  let truePeak = -1.5
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--in' && args[i + 1]) {
      input = args[++i]
      continue
    }
    if (args[i] === '--out' && args[i + 1]) {
      output = args[++i]
      continue
    }
    if (args[i] === '--target' && args[i + 1]) {
      targetI = parseFloat(args[++i])
      continue
    }
    if (args[i] === '--tp' && args[i + 1]) {
      truePeak = parseFloat(args[++i])
      continue
    }
  }
  if (!input || !output || !Number.isFinite(targetI)) {
    console.error(
      'Uso: --in <ruta entrada> --out <ruta salida> --target <-10|-20> [--tp <-1.5 techo dBTP>]',
    )
    process.exit(1)
  }
  const absIn = join(PROJECT_ROOT, input.replace(/^\//, ''))
  const absOut = join(PROJECT_ROOT, output.replace(/^\//, ''))
  return { absIn, absOut, targetI, truePeak }
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
      if (depth === 0) return JSON.parse(chunk.slice(brace0, j + 1))
    }
  }
  throw new Error('JSON de loudnorm incompleto')
}

function loudnormMeasure(absInput, targetI, truePeak) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      absInput,
      '-af',
      `loudnorm=I=${targetI}:TP=${truePeak}:LRA=${LRA}:print_format=json`,
      '-f',
      'null',
      '-',
    ],
    { stdio: 'pipe', encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr?.slice(-2000) || `ffmpeg paso 1 falló (${result.status})`)
  }
  return parseLoudnormJson(result.stderr || '')
}

function buildSecondPassFilter(targetI, truePeak, measured) {
  const {
    input_i: measured_I,
    input_lra: measured_LRA,
    input_tp: measured_TP,
    input_thresh: measured_thresh,
    target_offset: offset,
  } = measured
  return [
    `loudnorm=I=${targetI}`,
    `TP=${truePeak}`,
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

function loudnormEncode(absInput, absOutput, targetI, truePeak, measured) {
  ensureDir(dirname(absOutput))
  const af = buildSecondPassFilter(targetI, truePeak, measured)
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
  const { absIn, absOut, targetI, truePeak } = parseArgs()
  if (!existsSync(absIn)) {
    console.error('No existe:', absIn)
    process.exit(1)
  }
  console.log('Entrada:', absIn)
  console.log('Salida:', absOut)
  console.log(`Objetivo: ${targetI} LUFS integrado, techo TP ${truePeak} dBTP (2 pasos + LAME -q:a 0)\n`)
  const measured = loudnormMeasure(absIn, targetI, truePeak)
  console.log(`  Medición paso 1: input_i ${measured.input_i} LUFS`)
  loudnormEncode(absIn, absOut, targetI, truePeak, measured)
  console.log('Listo.')
}

main()
