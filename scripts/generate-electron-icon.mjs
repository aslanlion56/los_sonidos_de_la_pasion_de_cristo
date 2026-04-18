/**
 * Genera build/icon.png (512×512) desde public/favicon.svg para electron-builder y ventana Electron.
 */
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'public', 'favicon.svg')
const outDir = join(root, 'build')
const outPng = join(outDir, 'icon.png')

const svg = readFileSync(svgPath)
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
await sharp(svg).resize(512, 512).png().toFile(outPng)
console.log('[generate-electron-icon]', outPng)
