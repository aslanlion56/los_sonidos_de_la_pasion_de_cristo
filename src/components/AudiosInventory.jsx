import { mainAudios, secondaryAudios } from '../data/audioData'
import audioLevels from '../data/audioLevels.json'
import { srcToPublicKey } from '../utils/audioPathKey'
import { compareLufsDesc } from '../utils/inventorySort'
import { publicUrl } from '../utils/publicUrl'
import '../styles/components.css'

/** Solo número en celdas; la unidad va en los encabezados de columna. */
function formatLevel(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return String(value)
}

/** Ordenar por el mejor valor disponible (prioridad: audios). */
function sortValueFromTrack(track) {
  if (!track) return Number.NEGATIVE_INFINITY
  const a = track.audios
  if (Number.isFinite(a)) return a
  const vals = [
    track.audios_comprimidos,
    track.audios_volumen_10,
    track.audios_volumen_15,
    track.audios_volumen_20,
  ].filter(Number.isFinite)
  if (vals.length === 0) return Number.NEGATIVE_INFINITY
  return Math.max(...vals)
}

function Row({ label, track }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="audios-inventory__lufs">{formatLevel(track?.audios)}</td>
      <td className="audios-inventory__lufs">{formatLevel(track?.audios_comprimidos)}</td>
      <td className="audios-inventory__lufs">{formatLevel(track?.audios_volumen_10)}</td>
      <td className="audios-inventory__lufs">{formatLevel(track?.audios_volumen_15)}</td>
      <td className="audios-inventory__lufs">{formatLevel(track?.audios_volumen_20)}</td>
    </tr>
  )
}

/** Compat: JSON antiguo solo tenía `files` (columna Audios). */
function normalizeLevelsPayload(raw) {
  if (raw.byTrack) return raw.byTrack
  const files = raw.files
  if (!files) return {}
  const out = {}
  for (const [k, v] of Object.entries(files)) {
    out[k] = { audios: v }
  }
  return out
}

export default function AudiosInventory() {
  const byTrack = normalizeLevelsPayload(audioLevels)
  const homeHref = publicUrl('/')

  const mainItems = mainAudios.map((a) => {
    const key = srcToPublicKey(a.src)
    const track = key ? byTrack[key] : undefined
    return {
      key: a.id,
      label: a.name,
      track,
      sortVal: sortValueFromTrack(track),
    }
  })
  mainItems.sort((x, y) => compareLufsDesc(x.sortVal, y.sortVal))
  const mainRows = mainItems.map((item) => (
    <Row
      key={item.key}
      label={item.label}
      track={item.track}
    />
  ))

  const secondaryItems = []
  for (const a of secondaryAudios) {
    if (a.variants?.length) {
      a.variants.forEach((src, i) => {
        const key = srcToPublicKey(src)
        const track = key ? byTrack[key] : undefined
        secondaryItems.push({
          key: `${a.id}-v${i}`,
          label: `${a.name} (variante ${i + 1})`,
          track,
          sortVal: sortValueFromTrack(track),
        })
      })
    } else if (a.src) {
      const key = srcToPublicKey(a.src)
      const track = key ? byTrack[key] : undefined
      secondaryItems.push({
        key: a.id,
        label: a.name,
        track,
        sortVal: sortValueFromTrack(track),
      })
    }
  }
  secondaryItems.sort((x, y) => compareLufsDesc(x.sortVal, y.sortVal))
  const secondaryRows = secondaryItems.map((item) => (
    <Row
      key={item.key}
      label={item.label}
      track={item.track}
    />
  ))

  const thead = (
    <thead>
      <tr>
        <th scope="col">Pista</th>
        <th scope="col" title="public/audios/">
          Audios (LUFS)
        </th>
        <th scope="col" title="public/audios_comprimidos/">
          Audios comprimidos (LUFS)
        </th>
        <th scope="col" title="public/audios_volumen_10/">
          Volumen 10 (LUFS)
        </th>
        <th scope="col" title="public/audios_volumen_15/">
          Volumen 15 (LUFS)
        </th>
        <th scope="col" title="public/audios_volumen_20/">
          Volumen 20 (LUFS)
        </th>
      </tr>
    </thead>
  )

  return (
    <div className="audios-inventory">
      <header className="audios-inventory__header">
        <h1 className="audios-inventory__title">Audios</h1>
        <p className="audios-inventory__meta">
          Nivel integrado por carpeta ({audioLevels.unit}); la unidad figura en los títulos de columna.{' '}
          {audioLevels.generatedAt
            ? `Datos: ${new Date(audioLevels.generatedAt).toLocaleString('es')}.`
            : null}{' '}
          <a href={homeHref}>Volver al reproductor</a>
        </p>
        <p className="audios-inventory__note">
          Cada columna es el nivel percibido del archivo en esa carpeta (ffmpeg loudnorm). Actualizar:{' '}
          <code className="audios-inventory__code">npm run audio-levels</code>
        </p>
      </header>

      <section className="audios-inventory__section" aria-labelledby="audios-main-heading">
        <h2 id="audios-main-heading" className="audios-inventory__h2">
          Principales
        </h2>
        <div className="audios-inventory__table-wrap">
          <table className="audios-inventory__table audios-inventory__table--wide">
            {thead}
            <tbody>{mainRows}</tbody>
          </table>
        </div>
      </section>

      <section className="audios-inventory__section" aria-labelledby="audios-secondary-heading">
        <h2 id="audios-secondary-heading" className="audios-inventory__h2">
          Cortos
        </h2>
        <div className="audios-inventory__table-wrap">
          <table className="audios-inventory__table audios-inventory__table--wide">
            {thead}
            <tbody>{secondaryRows}</tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
