import { useState, useRef, useEffect, useCallback } from 'react'
import AudioCarousel from './components/AudioCarousel'
import SecondaryAudioGrid from './components/SecondaryAudioGrid'
import { mainAudios, secondaryAudios } from './data/audioData'
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

/** Tras rampa: nivel objetivo = 30 % del volumen efectivo base (tras ×0.7 si hay secundario). */
const MAIN_NAV_DUCK_FACTOR = 0.3
/** Duración de la bajada gradual y de la subida gradual al cambiar de pista con Anterior/Siguiente. */
const MAIN_NAV_RAMP_MS = 2000

function App() {
  const [activeMainIndex, setActiveMainIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [shouldLoop, setShouldLoop] = useState(true)
  const mainAudioRef = useRef(null)
  // Cuántos secundarios suenan ahora (para bajar volumen del principal un 30%)
  const secondaryPlayingCountRef = useRef(0)
  const volumeRef = useRef(1)
  const mainNavTimerRef = useRef(null)
  /** Durante rampas de volumen (bajada/subida): no pisar con applyMainAudioElementVolume. */
  const mainNavRampActiveRef = useRef(false)
  /** Tras bajar en rampa, al cargar la nueva pista hay que subir en rampa desde el 30 %. */
  const pendingMainNavRampUpRef = useRef(false)
  const rampRafRef = useRef(null)
  /** Nivel de salida actual del principal (0…1); se anima en rampa para que el slider refleje el movimiento. */
  const [rampDisplayLevel, setRampDisplayLevel] = useState(null)
  /** True desde inicio de bajada hasta fin de subida (Anterior/Siguiente). */
  const [mainNavDucking, setMainNavDucking] = useState(false)

  const getBaseEffectiveVolume = useCallback(() => {
    const v = volumeRef.current
    return secondaryPlayingCountRef.current > 0 ? v * 0.7 : v
  }, [])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  const cancelRampAnimation = useCallback(() => {
    if (rampRafRef.current != null) {
      cancelAnimationFrame(rampRafRef.current)
      rampRafRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (mainNavTimerRef.current) clearTimeout(mainNavTimerRef.current)
      cancelRampAnimation()
    }
  }, [cancelRampAnimation])

  const [secondaryAudiosState, setSecondaryAudiosState] = useState(
    secondaryAudios.map(audio => ({
      ...audio,
      isPlaying: false,
      volume: 1,
      audioRef: null,
      ...(audio.variants && { selectedVariantIndex: 0 })
    }))
  )

  // --- EVENTOS del audio principal ---
  useEffect(() => {
    const audio = mainAudioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(getSafeAudioDuration(audio))
    const handleEnded = () => {
      const currentAudio = mainAudios[activeMainIndex]
      const currentId = currentAudio?.id

      // Solo al terminar la pista (no al dar clic): excepciones
      // 12- Resurrection: parar toda la reproducción, no repetir ni seguir
      if (currentId === 12) {
        setIsPlaying(false)
        return
      }
      // 08- Via Dolorosa: no repetir, pasar a la siguiente canción
      if (currentId === 8) {
        if (activeMainIndex < mainAudios.length - 1) {
          handleMainAudioChange(activeMainIndex + 1)
        }
        return
      }
      // Resto (y 08/12 al dar clic se comportan igual): repetir si shouldLoop
      if (shouldLoop) {
        audio.currentTime = 0
        audio.play()
      } else {
        setIsPlaying(false)
      }
    }
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('canplay', updateDuration)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('canplay', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [activeMainIndex, shouldLoop])

  const applyMainAudioElementVolume = useCallback(() => {
    const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!el) return
    el.volume = getBaseEffectiveVolume()
  }, [getBaseEffectiveVolume])

  const finishMainNavTransition = useCallback(() => {
    mainNavRampActiveRef.current = false
    setRampDisplayLevel(null)
    setMainNavDucking(false)
    applyMainAudioElementVolume()
  }, [applyMainAudioElementVolume])

  const startRampUpAnimation = useCallback(() => {
    const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!el) {
      finishMainNavTransition()
      return
    }
    const base = getBaseEffectiveVolume()
    const v0 = base * MAIN_NAV_DUCK_FACTOR
    const v1 = base
    el.volume = v0
    setRampDisplayLevel(v0)
    const t0 = performance.now()
    const step = (now) => {
      const u = Math.min(1, (now - t0) / MAIN_NAV_RAMP_MS)
      const level = v0 + (v1 - v0) * u
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
      mainNavRampActiveRef.current = true
      setMainNavDucking(true)
      const v0 = getBaseEffectiveVolume()
      const v1 = v0 * MAIN_NAV_DUCK_FACTOR
      const t0 = performance.now()
      const step = (now) => {
        const u = Math.min(1, (now - t0) / MAIN_NAV_RAMP_MS)
        const level = v0 + (v1 - v0) * u
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
    [cancelRampAnimation, getBaseEffectiveVolume]
  )

  // --- VOLUMEN del principal: secundarios ×0.7 (sin rampa manual encima).
  useEffect(() => {
    if (mainNavRampActiveRef.current) return
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
  }, [isPlaying, activeMainIndex])

  // --- Cargar pista al cambiar de principal ---
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
      const duck = getBaseEffectiveVolume() * MAIN_NAV_DUCK_FACTOR
      audio.volume = duck
      setRampDisplayLevel(duck)
    } else {
      applyMainAudioElementVolume()
    }
    return () => audio.removeEventListener('canplay', onCanPlay)
  }, [activeMainIndex, applyMainAudioElementVolume, getBaseEffectiveVolume, startRampUpAnimation])

  const clearMainNavTimers = useCallback(() => {
    if (mainNavTimerRef.current) {
      clearTimeout(mainNavTimerRef.current)
      mainNavTimerRef.current = null
    }
    cancelRampAnimation()
  }, [cancelRampAnimation])

  /** Anterior/siguiente: rampa de bajada 2 s → cambio de pista → rampa de subida 2 s al canplay. */
  const navigateMainWithCrossfade = useCallback(
    (delta) => {
      const len = mainAudios.length
      let nextIndex
      if (delta < 0) {
        nextIndex = activeMainIndex > 0 ? activeMainIndex - 1 : len - 1
      } else {
        nextIndex = activeMainIndex < len - 1 ? activeMainIndex + 1 : 0
      }
      if (nextIndex === activeMainIndex) return

      clearMainNavTimers()
      pendingMainNavRampUpRef.current = false
      rampDownThenChangeTrack(nextIndex)
    },
    [activeMainIndex, clearMainNavTimers, rampDownThenChangeTrack]
  )

  // Al hacer clic en el carrusel (cualquier pista, incluidos 08 y 12): mismo comportamiento, reproducir
  const handleMainAudioChange = (index) => {
    clearMainNavTimers()
    pendingMainNavRampUpRef.current = false
    mainNavRampActiveRef.current = false
    setRampDisplayLevel(null)
    setMainNavDucking(false)
    setActiveMainIndex(index)
    setShouldLoop(true)
    setTimeout(() => setIsPlaying(true), 100)
  }

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
  const effectiveVolume = anySecondaryPlaying ? volume * 0.7 : volume
  /** Durante rampas, el slider sigue el nivel real animado; si no, el efectivo habitual. */
  const volumeSliderDisplay = rampDisplayLevel != null ? rampDisplayLevel : effectiveVolume
  const volumeRangeMax = 1

  const handleVolumeChange = (newVolume) => {
    setVolume(anySecondaryPlaying ? Math.min(1, newVolume / 0.7) : newVolume)
  }

  const volumeControlTooltip =
    mainNavDucking && anySecondaryPlaying
      ? 'Rampa de volumen al cambiar de pista; también reducido por secundario'
      : mainNavDucking
        ? 'Rampa de bajada y subida al cambiar de pista (2 s cada una)'
        : anySecondaryPlaying
          ? 'Volumen reducido por audio secundario'
          : undefined

  // --- TOGGLE SECUNDARIO: al dar PLAY bajar volumen principal 30%; secundarios al 100% ---
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
        {mainAudios[activeMainIndex] && (
          <audio
            ref={mainAudioRef}
            data-main-audio
            src={mainAudios[activeMainIndex].src}
            preload="metadata"
            style={{ display: 'none' }}
          />
        )}
        <AudioCarousel
          audios={mainAudios}
          activeIndex={activeMainIndex}
          onAudioChange={handleMainAudioChange}
          onNavigateMain={navigateMainWithCrossfade}
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
