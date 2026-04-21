/**
 * Prepara assets/ para @capacitor/assets: icono desde favicon, splash con el logo del header (derecha).
 */
import { readFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'assets')
const faviconSvg = join(root, 'public', 'favicon.svg')
const headerLogo = join(root, 'src', 'assets', 'icons', 'Los_Sonidos_de_la_Pasion.png')

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const svg = readFileSync(faviconSvg)
await sharp(svg).resize(1024, 1024).png().toFile(join(outDir, 'icon.png'))

copyFileSync(headerLogo, join(outDir, 'splash.png'))
console.log('[prepare-native-assets]', join(outDir, 'icon.png'), join(outDir, 'splash.png'))
