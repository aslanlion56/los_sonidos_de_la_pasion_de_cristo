import { useMemo } from 'react'

function AudioControls({
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
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrentTime = safeDuration > 0
    ? Math.max(0, Math.min(currentTime, safeDuration))
    : 0

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = useMemo(() => {
    if (!safeDuration) return 0
    return (safeCurrentTime / safeDuration) * 100
  }, [safeCurrentTime, safeDuration])

  const volumePercentage = useMemo(() => {
    const max = volumeRangeMax > 0 ? volumeRangeMax : 1
    return (volume / max) * 100
  }, [volume, volumeRangeMax])

  const volumePercentLabel = useMemo(() => {
    return Math.round(volumePercentage)
  }, [volumePercentage])

  return (
    <div className="audio-controls">
      <div className="controls-row">
        <button 
          ref={playPauseButtonRef}
          className="play-pause-btn"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className="time-controls">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={safeDuration || 1}
              value={safeCurrentTime}
              onChange={(e) => onTimeChange(parseFloat(e.target.value))}
              className="progress-slider"
              disabled={!safeDuration}
              aria-label="Progreso de reproducción"
            />
            <div 
              className="progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="time-display">{formatTime(safeDuration)}</span>
        </div>
      </div>

      <div
        className={`volume-controls ${isVolumeReduced ? 'volume-reduced' : ''} ${volumeDisabled ? 'volume-controls--ramp-lock' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          {volume === 0 ? (
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          ) : volume < 0.5 ? (
            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
          ) : (
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          )}
        </svg>
        <div className="volume-container">
          <input
            type="range"
            min="0"
            max={volumeRangeMax}
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
            aria-label="Volumen"
            disabled={volumeDisabled}
          />
          <div
            className={`volume-bar ${volumeDisabled ? 'volume-bar--live' : ''}`}
            style={{ width: `${volumePercentage}%` }}
            role="presentation"
            aria-hidden
          />
        </div>
        <span
          className="volume-display"
          title={isVolumeReduced ? (volumeTooltip ?? 'Volumen reducido por audio secundario') : undefined}
        >
          {volumePercentLabel}%
          {isVolumeReduced && <span className="volume-reduced-badge"> (reducido)</span>}
        </span>
      </div>
    </div>
  )
}

export default AudioControls
