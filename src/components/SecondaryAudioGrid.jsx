import { useMemo } from 'react'
import AudioCard from './AudioCard'

function SecondaryAudioGrid({ audios, onToggle, onVolumeChange, onSetRef, onVariantChange }) {
  return (
    <div className="secondary-audio-grid-container">
      <div className="grid-header">
        <h2>
          Audios Secundarios
          <span className="grid-subtitle"> - Puedes reproducir varios simultáneamente</span>
        </h2>
      </div>
      
      <div className="secondary-audio-grid">
        {audios.map((audio) => {
          const currentSrc = audio.variants
            ? audio.variants[audio.selectedVariantIndex ?? 0]
            : audio.src
          return (
            <AudioCard
              key={audio.id}
              audio={audio}
              currentSrc={currentSrc}
              isPlaying={audio.isPlaying}
              volume={audio.volume}
              onToggle={() => onToggle(audio.id)}
              onVolumeChange={onVolumeChange}
              onSetRef={onSetRef}
              variants={audio.variants}
              selectedVariantIndex={audio.selectedVariantIndex ?? 0}
              onVariantChange={onVariantChange ? (index) => onVariantChange(audio.id, index) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SecondaryAudioGrid
