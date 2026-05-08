import { readdirSync, rmSync, statSync, readFileSync } from 'fs'
import { join, relative } from 'path'

const root = new URL('..', import.meta.url).pathname
const distDir = join(root, 'dist')
const dataFile = join(root, 'src', 'data', 'audioData.js')

const KEEP_VOLUME_DIRS = new Set([
  'audios_volumen_12',
  'audios_volumen_15',
  'audios_volumen_20',
])

const REMOVE_ROOT_DIRS = [
  'audios',
  'audios_comprimidos',
  'audios_backup_2',
  'audios_backup3',
]

function bytesToMiB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2)
}

function dirSize(dir) {
  let total = 0
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile()) total += statSync(full).size
    }
  }
  return total
}

function collectReferencedRelativePaths() {
  const content = readFileSync(dataFile, 'utf8')
  const matches = content.matchAll(/publicUrl\('([^']+\.mp3)'\)/g)
  const set = new Set()

  for (const [, src] of matches) {
    const noLeading = src.replace(/^\//, '')
    if (!noLeading.startsWith('audios/')) continue
    // Dejamos rutas relativas tipo:
    // 01- ... .mp3
    // cortos/01- ... .mp3
    set.add(noLeading.slice('audios/'.length))
  }

  return set
}

function removeIfExists(path) {
  try {
    rmSync(path, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

function pruneVolumeDir(volumeDir, keepRelativePaths) {
  const removed = []

  const walk = (current) => {
    const entries = readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        // Tras podar archivos, eliminar carpetas vacias
        const remains = readdirSync(full)
        if (remains.length === 0) {
          rmSync(full, { recursive: true, force: true })
          removed.push(relative(volumeDir, full))
        }
        continue
      }
      if (!entry.isFile()) continue
      if (!entry.name.toLowerCase().endsWith('.mp3')) continue

      const rel = relative(volumeDir, full).replace(/\\/g, '/')
      if (!keepRelativePaths.has(rel)) {
        rmSync(full, { force: true })
        removed.push(rel)
      }
    }
  }

  walk(volumeDir)
  return removed
}

if (!statSync(distDir, { throwIfNoEntry: false })) {
  console.error('[prune-native-dist] dist/ no existe. Ejecuta primero build:native.')
  process.exit(1)
}

const before = dirSize(distDir)
const keepRelativePaths = collectReferencedRelativePaths()

console.log(`[prune-native-dist] Referencias MP3 detectadas: ${keepRelativePaths.size}`)

for (const folder of REMOVE_ROOT_DIRS) {
  const target = join(distDir, folder)
  if (removeIfExists(target)) {
    console.log(`[prune-native-dist] Eliminado: dist/${folder}`)
  }
}

const distEntries = readdirSync(distDir, { withFileTypes: true })
for (const entry of distEntries) {
  if (!entry.isDirectory()) continue
  if (!entry.name.startsWith('audios_volumen_')) continue
  if (!KEEP_VOLUME_DIRS.has(entry.name)) {
    const target = join(distDir, entry.name)
    if (removeIfExists(target)) {
      console.log(`[prune-native-dist] Eliminado folder volumen extra: dist/${entry.name}`)
    }
  }
}

for (const folder of KEEP_VOLUME_DIRS) {
  const target = join(distDir, folder)
  const removed = pruneVolumeDir(target, keepRelativePaths)
  if (removed.length) {
    console.log(`[prune-native-dist] ${folder}: eliminados ${removed.length} MP3 no usados`)
  }
}

const after = dirSize(distDir)
console.log(
  `[prune-native-dist] Tamaño dist: ${bytesToMiB(before)} MiB -> ${bytesToMiB(after)} MiB (ahorro ${bytesToMiB(before - after)} MiB)`,
)
