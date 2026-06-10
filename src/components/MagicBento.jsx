import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

const MOBILE_BREAKPOINT = 768;

// ── Particle helpers ──────────────────────────────────────────────────────────

const createParticle = (x, y, color) => {
  const el = document.createElement('div');
  el.className = 'mb-particle';
  el.style.cssText = `left:${x}px;top:${y}px;background:rgba(${color},1);box-shadow:0 0 6px rgba(${color},0.6)`;
  return el;
};

// ── ParticleCard ──────────────────────────────────────────────────────────────

const ParticleCard = ({
  children,
  className = '',
  style,
  disableAnimations = false,
  particleCount = 12,
  glowColor = '204, 0, 0',
  enableTilt = false,
  clickEffect = false,
  enableMagnetism = false,
}) => {
  const cardRef    = useRef(null);
  const particles  = useRef([]);
  const timeouts   = useRef([]);
  const hovered    = useRef(false);
  const memo       = useRef([]);
  const ready      = useRef(false);
  const magnetAnim = useRef(null);

  const init = useCallback(() => {
    if (ready.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memo.current = Array.from({ length: particleCount }, () =>
      createParticle(Math.random() * width, Math.random() * height, glowColor)
    );
    ready.current = true;
  }, [particleCount, glowColor]);

  const clearAll = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    magnetAnim.current?.kill();
    particles.current.forEach((p) => {
      gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) });
    });
    particles.current = [];
  }, []);

  const spawn = useCallback(() => {
    if (!cardRef.current || !hovered.current) return;
    if (!ready.current) init();
    memo.current.forEach((p, i) => {
      const tid = setTimeout(() => {
        if (!hovered.current || !cardRef.current) return;
        const clone = p.cloneNode(true);
        cardRef.current.appendChild(clone);
        particles.current.push(clone);
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
      }, i * 100);
      timeouts.current.push(tid);
    });
  }, [init]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const el = cardRef.current;

    const onEnter = () => {
      hovered.current = true;
      spawn();
      if (enableTilt) gsap.to(el, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    };
    const onLeave = () => {
      hovered.current = false;
      clearAll();
      if (enableTilt) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      if (enableMagnetism) gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };
    const onMove = (e) => {
      if (!enableTilt && !enableMagnetism) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      if (enableTilt) gsap.to(el, { rotateX: ((y - cy) / cy) * -8, rotateY: ((x - cx) / cx) * 8, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      if (enableMagnetism) magnetAnim.current = gsap.to(el, { x: (x - cx) * 0.04, y: (y - cy) * 0.04, duration: 0.3, ease: 'power2.out' });
    };
    const onClick = (e) => {
      if (!clickEffect) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const maxD = Math.max(Math.hypot(x, y), Math.hypot(x - r.width, y), Math.hypot(x, y - r.height), Math.hypot(x - r.width, y - r.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${maxD * 2}px;height:${maxD * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.35) 0%,rgba(${glowColor},0.15) 30%,transparent 70%);left:${x - maxD}px;top:${y - maxD}px;pointer-events:none;z-index:1000`;
      el.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('click', onClick);
    return () => {
      hovered.current = false;
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('click', onClick);
      clearAll();
    };
  }, [spawn, clearAll, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={`mb-particle-container ${className}`} style={style}>
      {children}
    </div>
  );
};

// ── GlobalSpotlight ───────────────────────────────────────────────────────────

const GlobalSpotlight = ({ gridRef, disableAnimations, enabled, spotlightRadius, glowColor }) => {
  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spot = document.createElement('div');
    spot.style.cssText = `position:fixed;width:700px;height:700px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(${glowColor},0.06) 0%,rgba(${glowColor},0.03) 20%,rgba(${glowColor},0.01) 35%,transparent 65%);z-index:200;opacity:0;transform:translate(-50%,-50%);mix-blend-mode:screen;will-change:transform,opacity`;
    document.body.appendChild(spot);

    const prox = spotlightRadius * 0.5;
    const fade = spotlightRadius * 0.75;

    const onMove = (e) => {
      const section = gridRef.current?.closest('.mb-bento-section');
      const rect    = section?.getBoundingClientRect();
      const inside  = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const cards   = gridRef.current?.querySelectorAll('.magic-bento-card') ?? [];

      if (!inside) {
        gsap.to(spot, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach((c) => c.style.setProperty('--glow-intensity', '0'));
        return;
      }

      let minDist = Infinity;
      cards.forEach((card) => {
        const cr   = card.getBoundingClientRect();
        const cx   = cr.left + cr.width  / 2;
        const cy   = cr.top  + cr.height / 2;
        const dist = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(cr.width, cr.height) / 2);
        minDist = Math.min(minDist, dist);
        const glow = dist <= prox ? 1 : dist <= fade ? (fade - dist) / (fade - prox) : 0;
        card.style.setProperty('--glow-x', `${((e.clientX - cr.left) / cr.width)  * 100}%`);
        card.style.setProperty('--glow-y', `${((e.clientY - cr.top)  / cr.height) * 100}%`);
        card.style.setProperty('--glow-intensity', glow.toString());
        card.style.setProperty('--glow-radius', `${spotlightRadius}px`);
      });

      gsap.to(spot, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });
      const targetOpacity = minDist <= prox ? 0.4 : minDist <= fade ? ((fade - minDist) / (fade - prox)) * 0.4 : 0;
      gsap.to(spot, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: 'power2.out' });
    };

    const onLeave = () => {
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach((c) => c.style.setProperty('--glow-intensity', '0'));
      gsap.to(spot, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      spot.parentNode?.removeChild(spot);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

// ── Card content ──────────────────────────────────────────────────────────────

const CardContent = ({ card }) => (
  <>
    <div className="mb-corner-bracket" />
    <div className="mb-card-header">
      <div className="mb-avatar">
        {card.avatarUrl
          ? <img src={card.avatarUrl} alt={card.username} />
          : <span>{card.initials}</span>
        }
      </div>
      {card.clearance && <span className="mb-clearance">{card.clearance}</span>}
    </div>
    <div className="mb-meta">
      <div className="mb-name">{card.username}</div>
      <div className="mb-role" style={{ color: card.color }}>{card.role}</div>
    </div>
    {card.tags?.length > 0 && (
      <div className="mb-tags">
        {card.tags.map((tag, i) => <span key={i} className="mb-tag">{tag}</span>)}
      </div>
    )}
    {card.desc && <p className="mb-desc">{card.desc}</p>}
    <div className="mb-footer">
      <span className="mb-date">{card.since}</span>
      {card.isAlumni
        ? <span className="mb-alumni-badge">Ancien membre</span>
        : <span className="mb-id">{card.id}</span>
      }
    </div>
  </>
);

// ── MagicBento ────────────────────────────────────────────────────────────────

const MagicBento = ({
  cards = /** @type {any[]} */ ([]),
  variant = 'default',
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = 300,
  particleCount = 12,
  enableTilt = false,
  glowColor = '204, 0, 0',
  clickEffect = true,
  enableMagnetism = true,
}) => {
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const disabled = disableAnimations || isMobile;

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={disabled}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}
      <div
        ref={gridRef}
        className={`mb-card-grid mb-card-grid--${variant} mb-bento-section`}
        style={{ '--glow-color': glowColor }}
      >
        {cards.map((card) => {
          const cls = [
            'magic-bento-card',
            enableBorderGlow ? 'magic-bento-card--glow' : '',
            card.isAlumni   ? 'magic-bento-card--alumni' : '',
          ].filter(Boolean).join(' ');

          const cardStyle = { '--mc': card.color };

          return enableStars ? (
            <ParticleCard
              key={card.id}
              className={cls}
              style={cardStyle}
              disableAnimations={disabled}
              particleCount={particleCount}
              glowColor={glowColor}
              enableTilt={enableTilt}
              clickEffect={clickEffect}
              enableMagnetism={enableMagnetism}
            >
              <CardContent card={card} />
            </ParticleCard>
          ) : (
            <div key={card.id} className={cls} style={cardStyle}>
              <CardContent card={card} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MagicBento;
