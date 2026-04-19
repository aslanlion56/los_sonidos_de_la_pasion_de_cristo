import { useRef, useEffect } from 'react'
import { FaVolumeDown, FaVolumeUp } from 'react-icons/fa'
import AudioControls from './AudioControls'
import {
  AUDIO_VOLUME_FOLDER_LOUD,
  AUDIO_VOLUME_FOLDER_MID,
  AUDIO_VOLUME_FOLDER_SOFT,
} from '../utils/audioVolumeFolder'

function AudioCarousel({
  audios,
  activeIndex,
  onNavigateToTrackWithRamp,
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
  playPauseButtonRef,
  audioVolumeFolder,
  onAudioVolumeFolderChange,
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

  const handlePrev = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : audios.length - 1
    onNavigateToTrackWithRamp(newIndex)
  }

  const handleNext = () => {
    const newIndex = activeIndex < audios.length - 1 ? activeIndex + 1 : 0
    onNavigateToTrackWithRamp(newIndex)
  }

  const handleCardClick = (index) => {
    if (index !== activeIndex) {
      onNavigateToTrackWithRamp(index)
    } else {
      onPlayPause()
    }
  }

  return (
    <div className="audio-carousel-container">
      <div className="carousel-header carousel-header--with-volume">
        <h2>Audios Principales</h2>
        <div
          className="carousel-volume-preset"
          role="group"
          aria-label="Nivel de volumen de los archivos de audio"
        >
          <button
            type="button"
            className={`carousel-volume-preset__btn ${audioVolumeFolder === AUDIO_VOLUME_FOLDER_SOFT ? 'is-selected' : ''}`}
            onClick={() => onAudioVolumeFolderChange?.(AUDIO_VOLUME_FOLDER_SOFT)}
            aria-pressed={audioVolumeFolder === AUDIO_VOLUME_FOLDER_SOFT}
            aria-label="Mezcla más suave, archivos aproximadamente -20 LUFS"
            title="Archivos -20 LUFS (más suave)"
          >
            <FaVolumeDown className="carousel-volume-preset__icon carousel-volume-preset__icon--sm" aria-hidden />
          </button>
          <button
            type="button"
            className={`carousel-volume-preset__btn ${audioVolumeFolder === AUDIO_VOLUME_FOLDER_MID ? 'is-selected' : ''}`}
            onClick={() => onAudioVolumeFolderChange?.(AUDIO_VOLUME_FOLDER_MID)}
            aria-pressed={audioVolumeFolder === AUDIO_VOLUME_FOLDER_MID}
            aria-label="Mezcla intermedia, archivos aproximadamente -15 LUFS"
            title="Archivos -15 LUFS (intermedio)"
          >
            <FaVolumeUp className="carousel-volume-preset__icon carousel-volume-preset__icon--md" aria-hidden />
          </button>
          <button
            type="button"
            className={`carousel-volume-preset__btn ${audioVolumeFolder === AUDIO_VOLUME_FOLDER_LOUD ? 'is-selected' : ''}`}
            onClick={() => onAudioVolumeFolderChange?.(AUDIO_VOLUME_FOLDER_LOUD)}
            aria-pressed={audioVolumeFolder === AUDIO_VOLUME_FOLDER_LOUD}
            aria-label="Mezcla más alta, archivos aproximadamente -10 LUFS"
            title="Archivos -10 LUFS (más volumen)"
          >
            <FaVolumeUp className="carousel-volume-preset__icon carousel-volume-preset__icon--lg" aria-hidden />
          </button>
        </div>
      </div>

      <div className="carousel-wrapper">
        <button 
          className="carousel-nav-btn prev-btn"
          onClick={handlePrev}
          disabled={isMainNavTransitioning}
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
          disabled={isMainNavTransitioning}
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
