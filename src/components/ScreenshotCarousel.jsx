import { useState, useEffect, useRef, useCallback } from 'react'
import Noise from './Noise'

const screenshots = [
  { id: 'SS-001', label: 'Entrée du Site-21',        tag: 'Architecture',   color: '#4a90d9', src: '/screenshots/site-entry.png' },
  { id: 'SS-002', label: 'Confinement SCP-999',       tag: 'Confinement',    color: '#f0a500', src: '/screenshots/scp999-conf.png' },
  { id: 'SS-003', label: 'Quartier scientifique',     tag: 'Sciences',       color: '#00cc66', src: '/screenshots/qsci-s21.png' },
  { id: 'SS-004', label: 'Scène CD — 1025',            tag: 'Spoil',          color: '#cc0000', src: '/screenshots/scene_cd_1025.webp' },
  { id: 'SS-005', label: 'Ascenseur du Site-21',      tag: 'Spoil',          color: '#cc0000', src: '/screenshots/spoil_elevator_s21.webp' },
  { id: 'SS-006', label: 'Convoi — Camions Site-21',  tag: 'Spoil',          color: '#cc0000', src: '/screenshots/spoil_s21_trucks.webp' },
]

export default function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)

  const goTo = useCallback(
    (i) => setCurrent((i + screenshots.length) % screenshots.length),
    [],
  )
  const prev = () => goTo(current - 1)
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  const timerRef = useRef(null)
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(next, 4500)
    return () => clearInterval(timerRef.current)
  }, [paused, next])

  const s = screenshots[current]

  return (
    <div
      className="sc-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide principal */}
      <div className="sc-carousel-slide">
        {s.src ? (
          <img src={s.src} alt={s.label} className="sc-carousel-img" />
        ) : (
          <div className="sc-carousel-placeholder" style={{ '--ss-color': s.color }}>
            <span className="sc-screenshot-id">{s.id}</span>
            <span className="sc-screenshot-cross">+</span>
          </div>
        )}

        <div className="sc-carousel-overlay">
          <div className="sc-carousel-meta">
            <span className="sc-screenshot-tag" style={{ color: s.color }}>{s.tag}</span>
            <span className="sc-carousel-label">{s.label}</span>
          </div>
          <span className="sc-carousel-counter">
            {String(current + 1).padStart(2, '0')} / {String(screenshots.length).padStart(2, '0')}
          </span>
        </div>

        <button className="sc-carousel-arrow sc-carousel-arrow--prev" onClick={prev} aria-label="Précédent">‹</button>
        <button className="sc-carousel-arrow sc-carousel-arrow--next" onClick={next} aria-label="Suivant">›</button>

        <div className="sc-carousel-progress">
          {screenshots.map((_, i) => (
            <button
              key={i}
              className={`sc-carousel-progress-bar${i === current ? ' sc-carousel-progress-bar--active' : ''}`}
              onClick={() => { setPaused(true); goTo(i) }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="cinema-reticle" aria-hidden="true">
          <div className="reticle-corner reticle-tl" />
          <div className="reticle-corner reticle-tr" />
          <div className="reticle-corner reticle-bl" />
          <div className="reticle-corner reticle-br" />
          <div className="reticle-center" />
        </div>

        <Noise patternAlpha={18} patternRefreshInterval={2} />
      </div>

      {/* Vignettes */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="sc-carousel-thumbs">
        {screenshots.map((th, i) => (
          <button
            key={th.id}
            className={`sc-carousel-thumb${i === current ? ' sc-carousel-thumb--active' : ''}`}
            onClick={() => { setPaused(true); goTo(i) }}
            style={{ '--ss-color': th.color }}
          >
            {th.src ? (
              <img src={th.src} alt={th.label} />
            ) : (
              <div className="sc-carousel-thumb-placeholder" />
            )}
            <span className="sc-carousel-thumb-label">{th.label}</span>
          </button>
        ))}
      </div>
      <Noise patternAlpha={12} patternRefreshInterval={3} />
      </div>
    </div>
  )
}
