import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import AudioCarousel from './components/AudioCarousel'
import SecondaryAudioGrid from './components/SecondaryAudioGrid'
import { mainAudios, secondaryAudios } from './data/audioData'
import {
  audioSrcForVolumeFolder,
  AUDIO_VOLUME_FOLDER_MID,
} from './utils/audioVolumeFolder'
import logo from './assets/icons/Los_Sonidos_de_la_Pasion.png'
import logoFooter from './assets/logo.png'
import versionData from './version.json'
import './styles/components.css'

const getSafeAudioDuration = (audio) => {
  if (!audio) return 0
  if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration

  if (audio.seekable && audio.seekable.length > 0) {
    const seekableEnd = audio.seekable.end(audio.seekable.length - 1)
    if (Number.isFinite(seekableEnd) && seekableEnd > 0) return seekableEnd
  }

  return 0
}

/** Tras rampa: nivel objetivo = 20 % del volumen efectivo base (tras ×0.7 si hay secundario). */
const MAIN_NAV_DUCK_FACTOR = 0.2
/** Duración de la bajada gradual y de la subida gradual al cambiar de pista con Anterior/Siguiente. */
const MAIN_NAV_RAMP_MS = 2000
/** Con secundario sonando, el principal usa este factor del volumen del slider (0.7 = 70 %). */
const SECONDARY_MAIN_VOLUME_FACTOR = 0.7

/** HTMLMediaElement.volume solo admite [0, 1]; las rampas y floats pueden pasarse ligeramente. */
const clampVolume = (x) => {
  const n = Number(x)
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

const DEFAULT_AUDIO_VOLUME_FOLDER = AUDIO_VOLUME_FOLDER_MID

function buildSecondaryState(folder) {
  return secondaryAudios.map((audio) => ({
    ...audio,
    src: audio.src ? audioSrcForVolumeFolder(audio.src, folder) : undefined,
    variants: audio.variants?.map((v) => audioSrcForVolumeFolder(v, folder)),
    isPlaying: false,
    volume: 1,
    audioRef: null,
    ...(audio.variants && { selectedVariantIndex: 0 }),
  }))
}

function App() {
  const [activeMainIndex, setActiveMainIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [shouldLoop, setShouldLoop] = useState(true)
  const mainAudioRef = useRef(null)
  // Cuántos secundarios suenan ahora (principal al 50 % del volumen del slider)
  const secondaryPlayingCountRef = useRef(0)
  const volumeRef = useRef(1)
  const mainNavTimerRef = useRef(null)
  /** Durante rampas de volumen (bajada/subida): no pisar con applyMainAudioElementVolume. */
  const mainNavRampActiveRef = useRef(false)
  /** Tras bajar en rampa, al cargar la nueva pista hay que subir en rampa desde el 20 %. */
  const pendingMainNavRampUpRef = useRef(false)
  const rampRafRef = useRef(null)
  /** Pre-fin (últimos 2 s): animación del volumen a ~60 fps, misma fluidez que rampDownThenChangeTrack. */
  const preEndRafRef = useRef(null)
  const preEndRafRunningRef = useRef(false)
  /** Nivel de salida actual del principal (0…1); se anima en rampa para que el slider refleje el movimiento. */
  const [rampDisplayLevel, setRampDisplayLevel] = useState(null)
  /** True durante rampas manuales, subida tras loop, o últimos 2 s antes del final (pre-fin). */
  const [mainNavDucking, setMainNavDucking] = useState(false)
  const activeMainIndexRef = useRef(0)
  const shouldLoopRef = useRef(true)
  /** Últimos 2 s: duck activo (no repetir pista 12). */
  const preEndDuckRef = useRef(false)

  const [audioVolumeFolder, setAudioVolumeFolder] = useState(DEFAULT_AUDIO_VOLUME_FOLDER)

  const mainAudiosResolved = useMemo(
    () =>
      mainAudios.map((a) => ({
        ...a,
        src: audioSrcForVolumeFolder(a.src, audioVolumeFolder),
      })),
    [audioVolumeFolder],
  )

  useEffect(() => {
    activeMainIndexRef.current = activeMainIndex
  }, [activeMainIndex])
  useEffect(() => {
    shouldLoopRef.current = shouldLoop
  }, [shouldLoop])

  const getBaseEffectiveVolume = useCallback(() => {
    const v = clampVolume(volumeRef.current)
    return secondaryPlayingCountRef.current > 0 ? v * SECONDARY_MAIN_VOLUME_FACTOR : v
  }, [])

  useEffect(() => {
    volumeRef.current = clampVolume(volume)
  }, [volume])

  const cancelRampAnimation = useCallback(() => {
    if (rampRafRef.current != null) {
      cancelAnimationFrame(rampRafRef.current)
      rampRafRef.current = null
    }
  }, [])

  const cancelPreEndRaf = useCallback(() => {
    if (preEndRafRef.current != null) {
      cancelAnimationFrame(preEndRafRef.current)
      preEndRafRef.current = null
    }
    preEndRafRunningRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      if (mainNavTimerRef.current) clearTimeout(mainNavTimerRef.current)
      cancelRampAnimation()
      cancelPreEndRaf()
    }
  }, [cancelRampAnimation, cancelPreEndRaf])

  const [secondaryAudiosState, setSecondaryAudiosState] = useState(() =>
    buildSecondaryState(DEFAULT_AUDIO_VOLUME_FOLDER),
  )

  /** Misma carpeta de volumen en secundarios y principal: pausa y estado limpio antes de useEffect (evita play() con isPlaying aún true). */
  useLayoutEffect(() => {
    setSecondaryAudiosState(buildSecondaryState(audioVolumeFolder))
    secondaryPlayingCountRef.current = 0
    setIsPlaying(false)
    if (mainNavTimerRef.current) {
      clearTimeout(mainNavTimerRef.current)
      mainNavTimerRef.current = null
    }
    cancelRampAnimation()
    cancelPreEndRaf()
    preEndDuckRef.current = false
    mainNavRampActiveRef.current = false
    pendingMainNavRampUpRef.current = false
    setRampDisplayLevel(null)
    setMainNavDucking(false)
  }, [audioVolumeFolder, cancelRampAnimation, cancelPreEndRaf])

  const applyMainAudioElementVolume = useCallback(() => {
    const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!el) return
    el.volume = clampVolume(getBaseEffectiveVolume())
  }, [getBaseEffectiveVolume])

  const finishMainNavTransition = useCallback(() => {
    mainNavRampActiveRef.current = false
    preEndDuckRef.current = false
    cancelPreEndRaf()
    setRampDisplayLevel(null)
    setMainNavDucking(false)
    applyMainAudioElementVolume()
  }, [applyMainAudioElementVolume, cancelPreEndRaf])

  const startRampUpAnimation = useCallback(() => {
    const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!el) {
      finishMainNavTransition()
      return
    }
    mainNavRampActiveRef.current = true
    setMainNavDucking(true)
    const base = clampVolume(getBaseEffectiveVolume())
    const v0 = base * MAIN_NAV_DUCK_FACTOR
    const v1 = base
    el.volume = clampVolume(v0)
    setRampDisplayLevel(clampVolume(v0))
    const t0 = performance.now()
    const step = (now) => {
      const u = Math.min(1, (now - t0) / MAIN_NAV_RAMP_MS)
      const level = clampVolume(v0 + (v1 - v0) * u)
      el.volume = level
      setRampDisplayLevel(level)
      if (u < 1) {
        rampRafRef.current = requestAnimationFrame(step)
      } else {
        rampRafRef.current = null
        finishMainNavTransition()
      }
    }
    rampRafRef.current = requestAnimationFrame(step)
  }, [getBaseEffectiveVolume, finishMainNavTransition])

  const rampDownThenChangeTrack = useCallback(
    (nextIndex) => {
      const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
      if (!el) return
      cancelRampAnimation()
      cancelPreEndRaf()
      preEndDuckRef.current = false
      mainNavRampActiveRef.current = true
      setMainNavDucking(true)
      const v0 = clampVolume(getBaseEffectiveVolume())
      const v1 = v0 * MAIN_NAV_DUCK_FACTOR
      const t0 = performance.now()
      const step = (now) => {
        const u = Math.min(1, (now - t0) / MAIN_NAV_RAMP_MS)
        const level = clampVolume(v0 + (v1 - v0) * u)
        el.volume = level
        setRampDisplayLevel(level)
        if (u < 1) {
          rampRafRef.current = requestAnimationFrame(step)
        } else {
          rampRafRef.current = null
          pendingMainNavRampUpRef.current = true
          setActiveMainIndex(nextIndex)
          setShouldLoop(true)
          setTimeout(() => setIsPlaying(true), 100)
        }
      }
      rampRafRef.current = requestAnimationFrame(step)
    },
    [cancelRampAnimation, cancelPreEndRaf, getBaseEffectiveVolume]
  )

  // --- EVENTOS del audio principal: timeupdate (pre-fin 2 s) + ended ---
  useEffect(() => {
    const audio = mainAudioRef.current
    if (!audio) return

    const updateTime = () => {
      const t = audio.currentTime
      setCurrentTime(t)

      if (mainNavRampActiveRef.current) return

      const dur = getSafeAudioDuration(audio)
      const idx = activeMainIndexRef.current
      const id = mainAudios[idx]?.id

      if (!dur || id === 12) {
        if (preEndDuckRef.current) {
          cancelPreEndRaf()
          preEndDuckRef.current = false
          setMainNavDucking(false)
          setRampDisplayLevel(null)
          applyMainAudioElementVolume()
        }
        return
      }

      const remaining = Math.max(0, dur - t)
      const windowSec = Math.min(2, dur)
      const inPreEndWindow =
        dur > 0 &&
        t >= dur - windowSec - 0.001 &&
        remaining > 0.03 &&
        t < dur - 0.01

      const loopOk = shouldLoopRef.current && id !== 12 && id !== 8
      const viaOk = id === 8
      const shouldPreEnd = (viaOk || loopOk) && inPreEndWindow

      if (shouldPreEnd) {
        preEndDuckRef.current = true
        setMainNavDucking(true)
        if (!preEndRafRunningRef.current) {
          preEndRafRunningRef.current = true
          const tick = () => {
            const a = mainAudioRef.current
            if (!a || mainNavRampActiveRef.current) {
              cancelPreEndRaf()
              return
            }
            const d = getSafeAudioDuration(a)
            const ct = a.currentTime
            const i = activeMainIndexRef.current
            const trackId = mainAudios[i]?.id
            const rem = Math.max(0, d - ct)
            const ws = Math.min(2, d)
            const inWin =
              d > 0 &&
              ct >= d - ws - 0.001 &&
              rem > 0.03 &&
              ct < d - 0.01
            const loop = shouldLoopRef.current && trackId !== 12 && trackId !== 8
            const via = trackId === 8
            const preEndNow = (via || loop) && inWin

            if (preEndNow) {
              const baseVol = clampVolume(getBaseEffectiveVolume())
              const u = Math.max(0, Math.min(1, rem / ws))
              const vol = clampVolume(
                baseVol * (MAIN_NAV_DUCK_FACTOR + (1 - MAIN_NAV_DUCK_FACTOR) * u),
              )
              a.volume = vol
              setRampDisplayLevel(vol)
              preEndRafRef.current = requestAnimationFrame(tick)
              return
            }

            preEndRafRef.current = null
            preEndRafRunningRef.current = false

            if (!preEndDuckRef.current) return

            const seekedEarly = d > 0 && ct < d - ws - 0.05
            if (seekedEarly) {
              preEndDuckRef.current = false
              setMainNavDucking(false)
              setRampDisplayLevel(null)
              applyMainAudioElementVolume()
              return
            }

            const baseHold = clampVolume(getBaseEffectiveVolume())
            const duck = clampVolume(baseHold * MAIN_NAV_DUCK_FACTOR)
            a.volume = duck
            setRampDisplayLevel(duck)
          }
          preEndRafRef.current = requestAnimationFrame(tick)
        }
      } else if (preEndDuckRef.current) {
        const seekedEarly = dur > 0 && t < dur - windowSec - 0.05
        if (seekedEarly) {
          cancelPreEndRaf()
          preEndDuckRef.current = false
          setMainNavDucking(false)
          setRampDisplayLevel(null)
          applyMainAudioElementVolume()
        }
      }
    }

    const updateDuration = () => setDuration(getSafeAudioDuration(audio))

    const handleEnded = () => {
      const idx = activeMainIndexRef.current
      const currentId = mainAudios[idx]?.id
      const el = mainAudioRef.current

      cancelPreEndRaf()
      preEndDuckRef.current = false

      if (currentId === 12) {
        setIsPlaying(false)
        setRampDisplayLevel(null)
        setMainNavDucking(false)
        mainNavRampActiveRef.current = false
        applyMainAudioElementVolume()
        return
      }

      if (currentId === 8) {
        if (idx < mainAudios.length - 1) {
          pendingMainNavRampUpRef.current = true
          setActiveMainIndex(idx + 1)
          setShouldLoop(true)
          setTimeout(() => setIsPlaying(true), 100)
        }
        return
      }

      if (shouldLoopRef.current && el) {
        el.currentTime = 0
        el.play().catch(() => {})
        requestAnimationFrame(() => {
          startRampUpAnimation()
        })
        return
      }

      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('canplay', updateDuration)
    audio.addEventListener('ended', handleEnded)
    return () => {
      if (preEndRafRef.current != null) {
        cancelAnimationFrame(preEndRafRef.current)
        preEndRafRef.current = null
      }
      preEndRafRunningRef.current = false
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('canplay', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [
    activeMainIndex,
    audioVolumeFolder,
    shouldLoop,
    cancelPreEndRaf,
    getBaseEffectiveVolume,
    applyMainAudioElementVolume,
    startRampUpAnimation,
  ])

  // --- VOLUMEN del principal: secundarios ×0.7 (sin rampa manual encima).
  useEffect(() => {
    if (mainNavRampActiveRef.current || preEndDuckRef.current) return
    applyMainAudioElementVolume()
  }, [volume, secondaryAudiosState, applyMainAudioElementVolume])

  // --- PLAY/PAUSE del principal ---
  useEffect(() => {
    const audio = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, activeMainIndex, audioVolumeFolder])

  // --- Cargar pista al cambiar de principal o carpeta de volumen (mismo índice, nuevo src) ---
  useEffect(() => {
    const audio = mainAudioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    const onCanPlay = () => {
      if (pendingMainNavRampUpRef.current) {
        pendingMainNavRampUpRef.current = false
        startRampUpAnimation()
      } else {
        applyMainAudioElementVolume()
      }
    }
    audio.addEventListener('canplay', onCanPlay, { once: true })
    audio.load()
    if (pendingMainNavRampUpRef.current) {
      const duck = clampVolume(getBaseEffectiveVolume() * MAIN_NAV_DUCK_FACTOR)
      audio.volume = duck
      setRampDisplayLevel(duck)
    } else {
      applyMainAudioElementVolume()
    }
    return () => audio.removeEventListener('canplay', onCanPlay)
  }, [activeMainIndex, audioVolumeFolder, applyMainAudioElementVolume, getBaseEffectiveVolume, startRampUpAnimation])

  const clearMainNavTimers = useCallback(() => {
    if (mainNavTimerRef.current) {
      clearTimeout(mainNavTimerRef.current)
      mainNavTimerRef.current = null
    }
    cancelRampAnimation()
    cancelPreEndRaf()
    preEndDuckRef.current = false
  }, [cancelRampAnimation, cancelPreEndRaf])

  /** Carrusel (flechas y tarjetas): misma rampa 2 s + cambio + subida. */
  const goToMainTrackWithRamp = useCallback(
    (nextIndex) => {
      if (nextIndex === activeMainIndex) return
      clearMainNavTimers()
      pendingMainNavRampUpRef.current = false
      rampDownThenChangeTrack(nextIndex)
    },
    [activeMainIndex, clearMainNavTimers, rampDownThenChangeTrack]
  )

  /** Teclado ← / → */
  const navigateMainWithCrossfade = useCallback(
    (delta) => {
      const len = mainAudios.length
      let nextIndex
      if (delta < 0) {
        nextIndex = activeMainIndex > 0 ? activeMainIndex - 1 : len - 1
      } else {
        nextIndex = activeMainIndex < len - 1 ? activeMainIndex + 1 : 0
      }
      goToMainTrackWithRamp(nextIndex)
    },
    [activeMainIndex, goToMainTrackWithRamp]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying(prev => !prev)
        setShouldLoop(true)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateMainWithCrossfade(-1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateMainWithCrossfade(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateMainWithCrossfade])

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev)
    setShouldLoop(true)
  }

  const handleTimeChange = (newTime) => {
    const audio = mainAudioRef.current
    if (!audio) return

    const maxSeek = getSafeAudioDuration(audio)
    if (!maxSeek) return

    const seekTime = Math.max(0, Math.min(newTime, maxSeek))
    if (typeof audio.fastSeek === 'function') audio.fastSeek(seekTime)
    else audio.currentTime = seekTime

    setCurrentTime(seekTime)
  }

  const anySecondaryPlaying = secondaryAudiosState.some(a => a.isPlaying)
  const effectiveVolume = clampVolume(
    anySecondaryPlaying ? volume * SECONDARY_MAIN_VOLUME_FACTOR : volume,
  )
  /** Durante rampas, el slider sigue el nivel real animado; si no, el efectivo habitual. */
  const volumeSliderDisplay = clampVolume(
    rampDisplayLevel != null ? rampDisplayLevel : effectiveVolume,
  )
  const volumeRangeMax = 1

  const handleVolumeChange = (newVolume) => {
    const n = clampVolume(newVolume)
    setVolume(
      anySecondaryPlaying ? clampVolume(n / SECONDARY_MAIN_VOLUME_FACTOR) : n,
    )
  }

  const volumeControlTooltip =
    mainNavDucking && anySecondaryPlaying
      ? 'Rampa de volumen (2 s) y audio secundario activo'
      : mainNavDucking
        ? 'Rampa de volumen (2 s): cambio de pista, repetición o final de pista'
        : anySecondaryPlaying
          ? 'Audio secundario activo: volumen principal ajustado'
          : undefined

  // --- TOGGLE SECUNDARIO: al dar PLAY principal al 50 % del slider; secundarios al 100% ---
  const handleSecondaryAudioToggle = useCallback((id) => {
    const toggled = secondaryAudiosState.find(a => a.id === id)
    const isStartingSecondary = toggled && !toggled.isPlaying

    if (isStartingSecondary) {
      secondaryPlayingCountRef.current += 1
    } else {
      secondaryPlayingCountRef.current = Math.max(0, secondaryPlayingCountRef.current - 1)
    }

    setSecondaryAudiosState(prev =>
      prev.map(audio => {
        if (audio.id !== id) return audio
        const newPlaying = !audio.isPlaying
        if (audio.audioRef) {
          if (newPlaying) audio.audioRef.play().catch(() => {})
          else audio.audioRef.pause()
        }
        return { ...audio, isPlaying: newPlaying }
      })
    )
  }, [secondaryAudiosState])

  const handleSecondaryVolumeChange = (id, newVolume) => {
    setSecondaryAudiosState(prev =>
      prev.map(audio => {
        if (audio.id === id) {
          if (audio.audioRef) audio.audioRef.volume = newVolume
          return { ...audio, volume: newVolume }
        }
        return audio
      })
    )
  }

  const setSecondaryAudioRef = useCallback((id, ref) => {
    setSecondaryAudiosState(prev => {
      const current = prev.find(a => a.id === id)
      if (current && current.audioRef === ref) return prev
      return prev.map(audio => (audio.id === id ? { ...audio, audioRef: ref } : audio))
    })
  }, [])

  const handleSecondaryVariantChange = (id, index) => {
    setSecondaryAudiosState(prev =>
      prev.map(audio =>
        audio.id === id ? { ...audio, selectedVariantIndex: index } : audio
      )
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <a
          href="https://www.facebook.com/nuevavida.icb"
          target="_blank"
          rel="noopener noreferrer"
          className="app-header-brand"
          title={`NUEVA VIDA Iglesia Cristiana Bautista - ${versionData.version}`}
        >
          <img
            src={logoFooter}
            alt="NUEVA VIDA Iglesia Cristiana Bautista"
            className="header-brand-logo"
          />
        </a>
        <img src={logo} alt="Los Sonidos de la Pasión de Cristo" className="header-logo" />
      </header>
      <main className="app-main">
        {mainAudiosResolved[activeMainIndex] && (
          <audio
            key={audioVolumeFolder}
            ref={mainAudioRef}
            data-main-audio
            src={mainAudiosResolved[activeMainIndex].src}
            preload="metadata"
            style={{ display: 'none' }}
          />
        )}
        <AudioCarousel
          audios={mainAudiosResolved}
          activeIndex={activeMainIndex}
          onNavigateToTrackWithRamp={goToMainTrackWithRamp}
          isMainNavTransitioning={mainNavDucking}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volumeSliderDisplay}
          volumeRangeMax={volumeRangeMax}
          volumeDisabled={mainNavDucking}
          isVolumeReduced={anySecondaryPlaying || mainNavDucking}
          volumeTooltip={volumeControlTooltip}
          onPlayPause={handlePlayPause}
          onTimeChange={handleTimeChange}
          onVolumeChange={handleVolumeChange}
          audioVolumeFolder={audioVolumeFolder}
          onAudioVolumeFolderChange={setAudioVolumeFolder}
        />
        <SecondaryAudioGrid
          audios={secondaryAudiosState}
          onToggle={handleSecondaryAudioToggle}
          onVolumeChange={handleSecondaryVolumeChange}
          onSetRef={setSecondaryAudioRef}
          onVariantChange={handleSecondaryVariantChange}
        />
      </main>
    </div>
  )
}

export default App
