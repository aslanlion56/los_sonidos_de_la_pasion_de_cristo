/**
 * Incrementa el patch de la versión en src/version.json (ej: 1.14 -> 1.15).
 * Se ejecuta antes de cada deploy a Firebase.
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const versionPath = join(__dirname, '..', 'src', 'version.json')

const data = JSON.parse(readFileSync(versionPath, 'utf8'))
const [major, minor] = data.version.split('.').map(Number)
const nextMinor = (minor ?? 0) + 1
data.version = `${major}.${nextMinor}`

writeFileSync(versionPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log('Versión actualizada:', data.version)
