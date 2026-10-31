import type { CSSProperties, ReactNode } from 'react';

const PALETTES: [string, string, string, string, string][] = [
  ['#22d3ee', '#3b82f6', '#a855f7', '#ec4899', '#6366f1'],
  ['#06b6d4', '#0ea5e9', '#8b5cf6', '#d946ef', '#3b82f6'],
  ['#6366f1', '#8b5cf6', '#22d3ee', '#3b82f6', '#f472b6'],
  ['#0ea5e9', '#6366f1', '#ec4899', '#a855f7', '#06b6d4'],
  ['#a855f7', '#3b82f6', '#22d3ee', '#f472b6', '#6366f1'],
  ['#3b82f6', '#a855f7', '#06b6d4', '#818cf8', '#ec4899'],
];

const DURATIONS = [3, 3.5, 4, 4.5, 5];
const DIRECTIONS: Array<'normal' | 'reverse'> = ['normal', 'reverse'];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

interface RgbBorderProps {
  trackId: string;
  isPlaying: boolean;
  isBuffering?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RgbBorder({ trackId, isPlaying, isBuffering = false, children, className = '', style }: RgbBorderProps) {
  const hash = hashString(trackId);
  const palette = PALETTES[hash % PALETTES.length];
  const duration = DURATIONS[hash % DURATIONS.length];
  const direction = DIRECTIONS[hash % DIRECTIONS.length];

  const active = isPlaying && !isBuffering;
  const paused = !active;

  const cssVars: CSSProperties = {
    '--rgb-c1': palette[0],
    '--rgb-c2': palette[1],
    '--rgb-c3': palette[2],
    '--rgb-c4': palette[3],
    '--rgb-c5': palette[4],
    '--rgb-duration': `${duration}s`,
    '--rgb-direction': direction,
  } as CSSProperties;

  return (
    <div
      className={`rgb-border ${paused ? 'rgb-paused' : ''} ${className}`}
      style={{ ...cssVars, ...style }}
    >
      {children}
    </div>
  );
}
