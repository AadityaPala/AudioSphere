import { useEffect, useRef } from 'react';

const ARROW_SIZE = 32;
const GLOW_SIZE = 80;
const LERP = 0.22;

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

      // Hotspot at the arrow tip which is at ~(2, 2) in the 32px viewBox
      arrow.style.transform = `translate(${mouseX - 2}px, ${mouseY - 2}px) scale(${clicking ? 0.82 : 1})`;
      glow.style.transform = `translate(${glowX - GLOW_SIZE / 2}px, ${glowY - GLOW_SIZE / 2}px) scale(${hovering ? 1.4 : 1})`;
    };

    raf = requestAnimationFrame(update);

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visible) {
        visible = true;
        arrow.style.opacity = '1';
        glow.style.opacity = '0.3';
      }

      const el = e.target instanceof Element ? e.target : null;
      const isInput = !!el?.closest('input, textarea, [contenteditable="true"]');
      const isInteractive = !!el?.closest(
        'button, a, select, [role="button"], [data-cursor="pointer"], [class*="cursor-pointer"]'
      );

      if (isInput) {
        arrow.style.opacity = '0';
        glow.style.opacity = '0';
        document.documentElement.style.cursor = 'auto';
        document.body.style.cursor = '';
      } else {
        arrow.style.opacity = '1';
        glow.style.opacity = isInteractive ? '0.5' : '0.25';
        arrow.style.filter = isInteractive
          ? 'drop-shadow(0 0 8px rgba(34,211,238,0.8)) drop-shadow(0 0 3px rgba(168,85,247,0.5))'
          : 'drop-shadow(0 0 4px rgba(59,130,246,0.5))';
        document.documentElement.style.cursor = 'none';
        document.body.style.cursor = isInteractive ? 'pointer' : 'none';
      }
      hovering = isInteractive && !isInput;
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
      glow.style.opacity = '0.25';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    document.documentElement.style.cursor = 'none';

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
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
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)',
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
          filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))',
          willChange: 'transform, opacity',
        }}
      >
        <svg width={ARROW_SIZE} height={ARROW_SIZE} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="as-cursor-body" x1="3" y1="2" x2="24" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0b0f1e" />
              <stop offset="0.45" stopColor="#1e1b4b" />
              <stop offset="1" stopColor="#0b0f1e" />
            </linearGradient>
            <linearGradient id="as-cursor-edge" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="0.35" stopColor="#3b82f6" />
              <stop offset="0.7" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          {/* Main arrow — classic pointer silhouette, larger and sharper */}
          <path
            d="M4 2.5 L4 23 L10 18 L13.5 28.5 L18 26.5 L14.5 16.5 L22 16.5 Z"
            fill="url(#as-cursor-body)"
            stroke="url(#as-cursor-edge)"
            strokeWidth="1.3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Sound-wave accent lines on the tail */}
          <path d="M20 19 Q22 21 20 23" stroke="url(#as-cursor-edge)" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M24 17.5 Q26.5 20 24 23.5" stroke="url(#as-cursor-edge)" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d="M28 16 Q31 19 28 23" stroke="url(#as-cursor-edge)" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
      </div>
    </>
  );
}
