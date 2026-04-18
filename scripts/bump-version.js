/**
 * Incrementa el segmento intermedio de la versión semver (ej: 1.22.0 -> 1.23.0).
 * Se ejecuta antes de cada deploy a Firebase.
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const versionPath = join(root, 'src', 'version.json')
const packagePath = join(root, 'package.json')

const data = JSON.parse(readFileSync(versionPath, 'utf8'))
const parts = data.version.split('.').map((p) => parseInt(p, 10))
const major = Number.isFinite(parts[0]) ? parts[0] : 0
const minor = Number.isFinite(parts[1]) ? parts[1] : 0
const nextMinor = minor + 1
data.version = `${major}.${nextMinor}.0`

writeFileSync(versionPath, JSON.stringify(data, null, 2) + '\n', 'utf8')

const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
pkg.version = data.version
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

console.log('Versión actualizada:', data.version)
