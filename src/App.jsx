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

  // --- VOLUMEN del principal: si hay secundario sonando, bajar 30% (x0.7) ---
  useEffect(() => {
    const el = mainAudioRef.current ?? document.querySelector('audio[data-main-audio]')
    if (!el) return
    const efectivo = secondaryPlayingCountRef.current > 0 ? volume * 0.7 : volume
    el.volume = efectivo
  }, [volume, secondaryAudiosState])

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
    audio.load()
  }, [activeMainIndex])

  // Al hacer clic en el carrusel (cualquier pista, incluidos 08 y 12): mismo comportamiento, reproducir
  const handleMainAudioChange = (index) => {
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
        if (activeMainIndex > 0) {
          setActiveMainIndex(activeMainIndex - 1)
          setShouldLoop(true)
          setTimeout(() => setIsPlaying(true), 100)
        }
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (activeMainIndex < mainAudios.length - 1) {
          setActiveMainIndex(activeMainIndex + 1)
          setShouldLoop(true)
          setTimeout(() => setIsPlaying(true), 100)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeMainIndex, mainAudios.length])

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

  const handleVolumeChange = (newVolume) => {
    setVolume(anySecondaryPlaying ? Math.min(1, newVolume / 0.7) : newVolume)
  }

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
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={effectiveVolume}
          isVolumeReduced={anySecondaryPlaying}
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
      <footer className="app-footer">
        <a
          href="https://www.facebook.com/nuevavida.icb"
          target="_blank"
          rel="noopener noreferrer"
          title={`NUEVA VIDA Iglesia Cristiana Bautista - ${versionData.version}`}
        >
          <img
            src={logoFooter}
            alt="NUEVA VIDA Iglesia Cristiana Bautista"
            className="footer-logo"
          />
        </a>
      </footer>
    </div>
  )
}

export default App
