import { useEffect, useRef } from 'react';

const DOT_SIZE = 8;
const RING_SIZE = 32;
const LERP = 0.18;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch devices or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let glowX = mouseX;
    let glowY = mouseY;
    let raf = 0;
    let hovering = false;
    let clicking = false;
    let visible = false;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    const update = () => {
      raf = requestAnimationFrame(update);
      if (!visible) return;

      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      glowX += (mouseX - glowX) * 0.12;
      glowY += (mouseY - glowY) * 0.12;

      dot.style.transform = `translate(${mouseX - DOT_SIZE / 2}px, ${mouseY - DOT_SIZE / 2}px)`;
      ring.style.transform = `translate(${ringX - RING_SIZE / 2}px, ${ringY - RING_SIZE / 2}px) scale(${hovering ? 1.5 : clicking ? 0.8 : 1})`;
      glow.style.transform = `translate(${glowX - 60}px, ${glowY - 60}px) scale(${hovering ? 1.3 : 1})`;
    };

    if (!reduceMotion) raf = requestAnimationFrame(update);

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        glow.style.opacity = '0.4';
      }

      // Check if hovering an interactive element
      const el = e.target as Element;
      const isInteractive = el.closest('button, a, [role="button"], input, textarea, select, [data-cursor="pointer"]');
      const isInput = el.closest('input, textarea, [contenteditable]');

      if (isInput) {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        glow.style.opacity = '0';
        document.body.style.cursor = 'text';
      } else {
        dot.style.opacity = '1';
        ring.style.opacity = isInteractive ? '0.8' : '0.5';
        glow.style.opacity = isInteractive ? '0.5' : '0.3';
        document.body.style.cursor = isInteractive ? 'pointer' : 'none';
      }
      hovering = !!isInteractive;
    };

    const onDown = (e: PointerEvent) => {
      clicking = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onUp = () => {
      clicking = false;
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      glow.style.opacity = '0';
      document.body.style.cursor = '';
    };

    const onEnter = () => {
      visible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '0.5';
      glow.style.opacity = '0.3';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    // Hide native cursor except on inputs
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
      {/* Outer glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99998] rounded-full"
        style={{
          width: 120,
          height: 120,
          opacity: 0,
          transition: 'opacity 0.2s',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(6,182,212,0.1) 50%, transparent 70%)',
          willChange: 'transform, opacity',
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99999] rounded-full border-2"
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          opacity: 0,
          transition: 'opacity 0.2s, border-color 0.2s',
          borderColor: 'rgba(99, 102, 241, 0.6)',
          boxShadow: '0 0 8px rgba(99, 102, 241, 0.3)',
          willChange: 'transform, opacity',
        }}
      />
      {/* Center dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[100000] rounded-full"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          opacity: 0,
          transition: 'opacity 0.15s',
          background: 'radial-gradient(circle, #22d3ee 0%, #3b82f6 70%, #6366f1 100%)',
          boxShadow: '0 0 6px rgba(34, 211, 238, 0.7)',
          willChange: 'transform, opacity',
        }}
      />
    </>
  );
}
