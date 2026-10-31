import { useEffect, useRef } from 'react';

// SVG arrow path — a classic pointer arrow silhouette with a subtle wave notch in the tail
const ARROW_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="arrow-body" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0f172a"/>
      <stop offset="0.55" stop-color="#1e1b4b"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="arrow-edge" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
      <stop stop-color="#22d3ee"/>
      <stop offset="0.45" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="arrow-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Arrow body with neon stroke. Hotspot is at the tip (1,1). -->
  <path
    d="M2 2 L2 18 L6.8 14.2 L9.6 21.5 L12.6 20.3 L9.8 13 L16 13 Z"
    fill="url(#arrow-body)"
    stroke="url(#arrow-edge)"
    stroke-width="1.1"
    stroke-linejoin="round"
    filter="url(#arrow-glow)"
  />
  <!-- Tiny sound-wave accent on the tail -->
  <path d="M15.5 15 Q16.8 16 15.5 17.5" stroke="url(#arrow-edge)" stroke-width="0.7" stroke-linecap="round" fill="none" opacity="0.7"/>
  <path d="M18 14.5 Q19.8 16 18 18.5" stroke="url(#arrow-edge)" stroke-width="0.7" stroke-linecap="round" fill="none" opacity="0.5"/>
</svg>
`;

const ARROW_SIZE = 24;
const GLOW_SIZE = 80;
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

      // Arrow tip at (1,1) → offset by (1,1) so the hotspot aligns with the mouse
      arrow.style.transform = `translate(${mouseX - 1}px, ${mouseY - 1}px) scale(${clicking ? 0.85 : 1})`;
      glow.style.transform = `translate(${glowX - GLOW_SIZE / 2}px, ${glowY - GLOW_SIZE / 2}px) scale(${hovering ? 1.4 : 1})`;
    };

    raf = requestAnimationFrame(update);

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visible) {
        visible = true;
        arrow.style.opacity = '1';
        glow.style.opacity = '0.4';
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
        glow.style.opacity = isInteractive ? '0.6' : '0.35';
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
      glow.style.opacity = '0.35';
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
        dangerouslySetInnerHTML={{ __html: ARROW_SVG }}
      />
    </>
  );
}
