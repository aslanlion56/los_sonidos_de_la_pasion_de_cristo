import { useRef, useEffect } from 'react'
import AudioControls from './AudioControls'

function AudioCarousel({
  audios,
  activeIndex,
  onAudioChange,
  onNavigateMain,
  isMainNavTransitioning = false,
  isPlaying,
  currentTime,
  duration,
  volume,
  volumeRangeMax = 1,
  volumeDisabled = false,
  isVolumeReduced = false,
  volumeTooltip,
  onPlayPause,
  onTimeChange,
  onVolumeChange,
  playPauseButtonRef
}) {
  const carouselRef = useRef(null)

  useEffect(() => {
    if (carouselRef.current) {
      const activeCard = carouselRef.current.querySelector(`[data-index="${activeIndex}"]`)
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeIndex])

  /** Flechas del carrusel: cambio de pista inmediato (comportamiento original). */
  const handlePrev = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : audios.length - 1
    onAudioChange(newIndex)
  }

  const handleNext = () => {
    const newIndex = activeIndex < audios.length - 1 ? activeIndex + 1 : 0
    onAudioChange(newIndex)
  }

  const handleCardClick = (index) => {
    if (index !== activeIndex) {
      onAudioChange(index)
    } else {
      // Si es la misma tarjeta, reproducir/pausar
      onPlayPause()
    }
  }

  return (
    <div className="audio-carousel-container">
      <div className="carousel-header">
        <h2>Audios Principales</h2>
      </div>

      {onNavigateMain && (
        <div
          className={`main-track-nav ${isMainNavTransitioning ? 'main-track-nav--transitioning' : ''}`}
          aria-busy={isMainNavTransitioning}
        >
          <button
            type="button"
            className="main-track-nav-btn"
            onClick={() => onNavigateMain(-1)}
            disabled={isMainNavTransitioning}
            aria-label="Pista anterior (transición de volumen)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button
            type="button"
            className="main-track-nav-btn"
            onClick={() => onNavigateMain(1)}
            disabled={isMainNavTransitioning}
            aria-label="Pista siguiente (transición de volumen)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      )}
      
      <div className="carousel-wrapper">
        <button 
          className="carousel-nav-btn prev-btn"
          onClick={handlePrev}
          aria-label="Audio anterior"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <div className="audio-carousel" ref={carouselRef}>
          {audios.map((audio, index) => (
            <div
              key={audio.id}
              data-index={index}
              className={`carousel-card ${index === activeIndex ? 'active' : ''} ${index === activeIndex && isPlaying ? 'playing' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="card-content">
                <div className="card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <h3 className="card-title">{audio.name}</h3>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="carousel-nav-btn next-btn"
          onClick={handleNext}
          aria-label="Audio siguiente"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      {audios[activeIndex] && (
        <div className="carousel-audio-player">
          <AudioControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            volumeRangeMax={volumeRangeMax}
            volumeDisabled={volumeDisabled}
            isVolumeReduced={isVolumeReduced}
            volumeTooltip={volumeTooltip}
            onPlayPause={onPlayPause}
            onTimeChange={onTimeChange}
            onVolumeChange={onVolumeChange}
            playPauseButtonRef={playPauseButtonRef}
          />
        </div>
      )}
    </div>
  )
}

export default AudioCarousel
