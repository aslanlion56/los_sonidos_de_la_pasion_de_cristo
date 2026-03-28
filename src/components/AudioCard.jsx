import { useState, useRef, useEffect } from 'react'
import { getIconComponent } from '../utils/icons'

function AudioCard({ audio, currentSrc, isPlaying, volume, onToggle, onVolumeChange, onSetRef, variants, selectedVariantIndex = 0, onVariantChange }) {
  const audioRef = useRef(null)
  const hasSetRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (audioRef.current && onSetRef && !hasSetRef.current) {
      onSetRef(audio.id, audioRef.current)
      hasSetRef.current = true
    }
  }, [audio.id, onSetRef])

  // Al cambiar de variante, actualizar src del elemento de audio
  useEffect(() => {
    if (audioRef.current && currentSrc) {
      audioRef.current.src = currentSrc
      audioRef.current.load()
    }
  }, [currentSrc])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Error al reproducir, probablemente el usuario no ha interactuado aún
            console.error('Error al reproducir audio:', error)
          })
        }
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Progreso: tiempo actual y duración; y 'ended' para detener
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTimeUpdate = () => setCurrentTime(el.currentTime)
    const onLoadedMetadata = () => setDuration(el.duration)
    const onDurationChange = () => setDuration(el.duration)
    const onEnded = () => {
      setCurrentTime(0)
      if (isPlaying) onToggle()
    }
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMetadata)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMetadata)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('ended', onEnded)
    }
  }, [isPlaying, onToggle])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const IconComponent = getIconComponent(audio.icon)

  const hasVariants = variants && variants.length > 1

  return (
    <div className={`audio-card ${isPlaying ? 'playing' : ''} ${hasVariants ? 'audio-card--with-variants' : ''}`}>
      <audio
        ref={audioRef}
        src={currentSrc}
        preload="none"
      />
      {hasVariants && (
        <div className="card-variant-dots" aria-label="Seleccionar variante de audio">
          {variants.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`card-variant-dot ${index === selectedVariantIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onVariantChange?.(index)
              }}
              aria-label={`Variante ${index + 1} de ${variants.length}`}
              aria-pressed={index === selectedVariantIndex}
            />
          ))}
        </div>
      )}
      <div className="card-main">
      <div className="card-header" onClick={onToggle}>
        <div className="card-icon-wrapper">
          {IconComponent ? (
            <IconComponent className="card-icon-svg" />
          ) : (
            <div className="card-icon-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>
        <h3 className="card-name">{audio.name}</h3>
      </div>

      <div className="card-progress-wrap" aria-label="Progreso de reproducción">
        <div className="card-progress-track">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value)
              if (audioRef.current) {
                audioRef.current.currentTime = newTime
                setCurrentTime(newTime)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="card-progress-slider"
            aria-label={`Adelantar o atrasar ${audio.name}`}
          />
          <div
            className="card-progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="card-controls">
        <button
          className="card-play-btn"
          onClick={onToggle}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className="card-volume-control">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            {volume === 0 ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : volume < 0.5 ? (
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            )}
          </svg>
          <div className="card-volume-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(audio.id, parseFloat(e.target.value))}
              className="card-volume-slider"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Volumen de ${audio.name}`}
            />
            <div 
              className="card-volume-bar"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AudioCard
