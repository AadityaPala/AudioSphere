import { useEffect, useRef } from 'react';

const ARROW_SIZE = 26;
const GLOW_SIZE = 70;
const LERP = 0.2;

export function CustomCursor() {
  const arrowRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    let raf = 0;
    let hovering = false;
    let clicking = false;
    let visible = false;

    const arrow = arrowRef.current;
    const glow = glowRef.current;
    if (!arrow || !glow) return;

    const update = () => {
      raf = requestAnimationFrame(update);
      if (!visible) return;

      if (!reduceMotion) {
        glowX += (mouseX - glowX) * LERP;
        glowY += (mouseY - glowY) * LERP;
      } else {
        glowX = mouseX;
        glowY = mouseY;
      }

      // Hotspot at arrow tip — the SVG arrow tip is near (1.5, 1.5) in a 26px viewBox
      arrow.style.transform = `translate(${mouseX - 2}px, ${mouseY - 2}px) scale(${clicking ? 0.85 : 1})`;
      glow.style.transform = `translate(${glowX - GLOW_SIZE / 2}px, ${glowY - GLOW_SIZE / 2}px) scale(${hovering ? 1.35 : 1})`;
    };

    raf = requestAnimationFrame(update);

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visible) {
        visible = true;
        arrow.style.opacity = '1';
        glow.style.opacity = '0.35';
      }

      const el = e.target as Element;
      const isInteractive = el.closest('button, a, [role="button"], select, [data-cursor="pointer"]');
      const isInput = el.closest('input, textarea, [contenteditable]');

      if (isInput) {
        arrow.style.opacity = '0';
        glow.style.opacity = '0';
        document.body.style.cursor = 'text';
      } else {
        arrow.style.opacity = '1';
        glow.style.opacity = isInteractive ? '0.55' : '0.3';
        arrow.style.filter = isInteractive
          ? 'drop-shadow(0 0 6px rgba(34,211,238,0.7))'
          : 'drop-shadow(0 0 3px rgba(59,130,246,0.4))';
        document.body.style.cursor = isInteractive ? 'pointer' : 'none';
      }
      hovering = !!isInteractive;
    };

    const onDown = () => { clicking = true; };
    const onUp = () => { clicking = false; };

    const onLeave = () => {
      visible = false;
      arrow.style.opacity = '0';
      glow.style.opacity = '0';
      document.body.style.cursor = '';
    };

    const onEnter = () => {
      visible = true;
      arrow.style.opacity = '1';
      glow.style.opacity = '0.3';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    document.documentElement.style.cursor = 'none';

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      {/* Trailing glow halo */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99998] rounded-full"
        style={{
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          opacity: 0,
          transition: 'opacity 0.2s',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(168,85,247,0.06) 45%, transparent 70%)',
          willChange: 'transform, opacity',
        }}
      />
      {/* Arrow cursor */}
      <div
        ref={arrowRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[100000]"
        style={{
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          opacity: 0,
          transition: 'opacity 0.15s, filter 0.15s',
          filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.4))',
          willChange: 'transform, opacity',
        }}
      >
        <svg width={ARROW_SIZE} height={ARROW_SIZE} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cursor-body" x1="2" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f172a" />
              <stop offset="0.5" stopColor="#1e1b4b" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cursor-edge" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="0.4" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          {/* Arrow body — classic pointer silhouette */}
          <path
            d="M3 2 L3 19 L8 15 L11 23 L14.5 21.5 L11.5 13.5 L18 13.5 Z"
            fill="url(#cursor-body)"
            stroke="url(#cursor-edge)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Sound-wave accent on the tail */}
          <path d="M17 16 Q18.5 17.5 17 19" stroke="url(#cursor-edge)" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M20 15 Q22 17 20 19.5" stroke="url(#cursor-edge)" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4" />
        </svg>
      </div>
    </>
  );
}
