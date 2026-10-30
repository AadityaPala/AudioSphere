import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 140;
const PARTICLE_LIFE_MS = 1500;
const SPAWN_INTERVAL_MS = 16;
const MAX_RIPPLES = 10;

const COLORS = ['#3b82f6', '#60a5fa', '#06b6d4', '#6366f1', '#8b5cf6', '#a78bfa'];

type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  bornAt: number;
  rotation: number;
  rotationSpeed: number;
  shape: number;
  alpha: number;
};

type Ripple = {
  active: boolean;
  x: number;
  y: number;
  bornAt: number;
  radius: number;
  maxRadius: number;
  color: string;
};

function createParticlePool(): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({
      active: false,
      x: 0, y: 0, vx: 0, vy: 0,
      size: 0, color: COLORS[0],
      bornAt: 0, rotation: 0, rotationSpeed: 0,
      shape: 0, alpha: 0,
    });
  }
  return pool;
}

function createRipplePool(): Ripple[] {
  const pool: Ripple[] = [];
  for (let i = 0; i < MAX_RIPPLES; i++) {
    pool.push({ active: false, x: 0, y: 0, bornAt: 0, radius: 0, maxRadius: 0, color: COLORS[0] });
  }
  return pool;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    const particles = createParticlePool();
    const ripples = createRipplePool();

    let pointer = { x: width / 2, y: height / 2 };
    let lastSpawn = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPointerMove = 0;
    let pointerInside = false;
    let raf = 0;
    let running = true;

    const getInactiveParticle = () => particles.find((p) => !p.active);

    const spawnParticle = (x: number, y: number) => {
      const p = getInactiveParticle();
      if (!p) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 1.2;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.2;
      p.size = 2 + Math.random() * 3;
      p.color = COLORS[(Math.random() * COLORS.length) | 0];
      p.bornAt = performance.now();
      p.rotation = Math.random() * Math.PI;
      p.rotationSpeed = (Math.random() - 0.5) * 0.06;
      p.shape = (Math.random() * 3) | 0;
    };

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

    const drawParticle = (p: Particle, now: number) => {
      const age = now - p.bornAt;
      const life = age / PARTICLE_LIFE_MS;
      if (life >= 1) {
        p.active = false;
        return;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.01;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      // fade in fast (first 15%), then fade out over the rest
      p.alpha = life < 0.15 ? life / 0.15 : 1 - (life - 0.15) / 0.85;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha) * 0.9;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      const s = p.size * (1 - life * 0.35);

      if (p.shape === 0) {
        // glowing dot
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 1) {
        // equalizer bar fragment
        ctx.fillRect(-s / 2, -s * 1.4, s, s * 2.8);
      } else {
        // tiny musical note
        ctx.beginPath();
        ctx.arc(-s * 0.3, s * 0.6, s * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(s * 0.4, -s * 1.8, s * 0.45, s * 2.4);
      }
      ctx.restore();
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
      const alpha = (1 - life) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5 - life * 2;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      // second inner ring for depth
      if (life < 0.7) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);

      // Spawn particles continuously while the cursor is inside the window and recently moved.
      // Use distance-based spawning for a smooth trail, plus time-based ambient emission.
      if (!reduceMotion && pointerInside && now - lastPointerMove < 250) {
        const dx = pointer.x - lastPointerX;
        const dy = pointer.y - lastPointerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // spawn 1-3 particles proportional to movement distance, throttled by time
        if (now - lastSpawn >= SPAWN_INTERVAL_MS) {
          const count = Math.min(3, 1 + Math.floor(dist / 12));
          for (let i = 0; i < count; i++) {
            spawnParticle(pointer.x, pointer.y);
          }
          lastPointerX = pointer.x;
          lastPointerY = pointer.y;
          lastSpawn = now;
        }
      }

      ctx.clearRect(0, 0, width, height);

      for (const r of ripples) if (r.active) drawRipple(r, now);
      for (const p of particles) if (p.active) drawParticle(p, now);
    };

    raf = requestAnimationFrame(render);

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      lastPointerMove = performance.now();
      pointerInside = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointerInside = true;
      spawnRipple(e.clientX, e.clientY);
      const burst = reduceMotion ? 1 : 6;
      for (let i = 0; i < burst; i++) spawnParticle(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      pointerInside = false;
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) raf = requestAnimationFrame(render);
      else cancelAnimationFrame(raf);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ display: 'block', zIndex: 1 }}
    />
  );
}
