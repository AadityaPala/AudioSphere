import { useEffect, useRef } from 'react';

const MAX_PARTICLES = 90;
const PARTICLE_LIFE_MS = 1400;
const SPAWN_INTERVAL_MS = 38;
const MAX_RIPPLES = 8;

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#6366f1', '#a78bfa'];

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

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const particles = createParticlePool();
    const ripples = createRipplePool();

    let pointer = { x: width / 2, y: height / 2 };
    let lastSpawn = 0;
    let lastPointerMove = 0;
    let raf = 0;
    let running = true;

    const getInactiveParticle = () => particles.find((p) => !p.active);

    const spawnParticle = (x: number, y: number) => {
      const p = getInactiveParticle();
      if (!p) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.9;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.15;
      p.size = 1.5 + Math.random() * 3.5;
      p.color = COLORS[(Math.random() * COLORS.length) | 0];
      p.bornAt = performance.now();
      p.rotation = Math.random() * Math.PI;
      p.rotationSpeed = (Math.random() - 0.5) * 0.04;
      p.shape = (Math.random() * 3) | 0;
    };

    const spawnRipple = (x: number, y: number) => {
      const r = ripples.find((rp) => !rp.active);
      if (!r) return;
      r.active = true;
      r.x = x;
      r.y = y;
      r.bornAt = performance.now();
      r.radius = 6;
      r.maxRadius = 70 + Math.random() * 40;
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
      p.vy += 0.008;
      p.vx *= 0.992;
      p.rotation += p.rotationSpeed;
      p.alpha = life < 0.2 ? life / 0.2 : 1 - (life - 0.2) / 0.8;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha) * 0.85;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      const s = p.size * (1 - life * 0.3);

      if (p.shape === 0) {
        // glowing dot
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 1) {
        // eq bar fragment
        ctx.fillRect(-s / 2, -s * 1.5, s, s * 3);
      } else {
        // tiny note-ish glyph
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(s * 0.6, -s * 2.2, s * 0.5, s * 2.2);
      }
      ctx.restore();
    };

    const drawRipple = (r: Ripple, now: number) => {
      const age = now - r.bornAt;
      const life = age / 900;
      if (life >= 1) {
        r.active = false;
        return;
      }
      r.radius = r.maxRadius * life;
      const alpha = (1 - life) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2 - life * 1.5;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const render = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(render);

      // ambient cursor trail emission (low rate)
      if (!reduceMotion && now - lastSpawn > SPAWN_INTERVAL_MS && now - lastPointerMove < 120) {
        spawnParticle(pointer.x, pointer.y);
        lastSpawn = now;
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
      if (!reduceMotion && Math.random() < 0.5) spawnParticle(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      spawnRipple(e.clientX, e.clientY);
      const burst = reduceMotion ? 1 : 4;
      for (let i = 0; i < burst; i++) spawnParticle(e.clientX, e.clientY);
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) raf = requestAnimationFrame(render);
      else cancelAnimationFrame(raf);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-5"
      style={{ display: 'block' }}
    />
  );
}
