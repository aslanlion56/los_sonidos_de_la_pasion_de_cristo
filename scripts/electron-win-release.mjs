/**
 * Limpia release/, toma la versión de src/version.json y empaqueta el instalador Windows.
 * electron-builder exige semver estricto (major.minor.patch), p. ej. 1.22.0.
 */
import { readFileSync, existsSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

/** Normaliza "1.22" -> "1.22.0" por si quedara formato antiguo. */
function toSemver(v) {
  const parts = String(v).trim().split('.').filter((x) => x.length > 0)
  if (parts.length === 1) return `${parts[0]}.0.0`
  if (parts.length === 2) return `${parts[0]}.${parts[1]}.0`
  return parts.slice(0, 3).join('.')
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const raw = JSON.parse(readFileSync(join(root, 'src', 'version.json'), 'utf8')).version
const version = toSemver(raw)

const releaseDir = join(root, 'release')
if (existsSync(releaseDir)) {
  rmSync(releaseDir, { recursive: true, force: true })
  console.log('[electron-win] Carpeta release/ eliminada (artefactos anteriores).')
}

execSync(
  `npx electron-builder --win --x64 --config.extraMetadata.version=${version}`,
  { cwd: root, stdio: 'inherit', env: process.env },
)
