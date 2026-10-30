import { useEffect, useRef } from 'react';

const MAX_RIPPLES = 12;

const COLORS = ['#3b82f6', '#60a5fa', '#06b6d4', '#6366f1', '#8b5cf6', '#a78bfa'];

type Ripple = {
  active: boolean;
  x: number;
  y: number;
  bornAt: number;
  radius: number;
  maxRadius: number;
  color: string;
};

function createRipplePool(): Ripple[] {
  const pool: Ripple[] = [];
  for (let i = 0; i < MAX_RIPPLES; i++) {
    pool.push({ active: false, x: 0, y: 0, bornAt: 0, radius: 0, maxRadius: 0, color: COLORS[0] });
  }
  return pool;
}

/**
 * App-wide click ripple layer. Listens for pointerdown on the window and
 * renders expanding ripple rings. Mounted once at the app root.
 */
export function RippleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ripples = createRipplePool();
    let raf = 0;
    let running = true;

    const spawnRipple = (x: number, y: number) => {
      const r = ripples.find((rp) => !rp.active);
      if (!r) return;
      r.active = true;
      r.x = x;
      r.y = y;
      r.bornAt = performance.now();
      r.radius = 8;
      r.maxRadius = 80 + Math.random() * 50;
      r.color = COLORS[(Math.random() * COLORS.length) | 0];
    };

    const drawRipple = (r: Ripple, now: number) => {
      const age = now - r.bornAt;
      const life = age / 800;
      if (life >= 1) {
        r.active = false;
        return;
      }
      const eased = 1 - Math.pow(1 - life, 3);
      r.radius = r.maxRadius * eased;
      const alpha = (1 - life) * 0.55;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5 - life * 2;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (life < 0.7) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);
      for (const r of ripples) if (r.active) drawRipple(r, performance.now());
    };

    raf = requestAnimationFrame(render);

    const onPointerDown = (e: PointerEvent) => {
      spawnRipple(e.clientX, e.clientY);
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) raf = requestAnimationFrame(render);
      else cancelAnimationFrame(raf);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ display: 'block', zIndex: 9999 }}
    />
  );
}
