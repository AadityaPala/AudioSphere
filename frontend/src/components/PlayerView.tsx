import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Loader2, Info, ListMusic } from 'lucide-react';
import { RgbBorder } from './RgbBorder';
import { useScrollRestore } from '../hooks/useScrollRestore';

interface PlayerViewProps { player: any; onOpenInfo: () => void; className?: string; }

export function PlayerView({ player, onOpenInfo, className = '' }: PlayerViewProps) {
  const {
    queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration,
    volume, meta, enriched, nextSong, prevSong, togglePlay, toggleShuffle,
    seekTo, changeVolume,
  } = player;

  const track = currentIndex >= 0 ? queue[currentIndex] : null;
  const title = track?.title || 'No track selected';
  const artist = enriched?.artist || meta.artist || 'Select a track to begin';
  const artwork = enriched?.albumArtUrl || meta.artwork;
  const url = track?.url || '';
  const hasTrack = !!track;
  const active = hasTrack && (isPlaying || isBuffering);
  const muted = volume === 0;
  const progress = duration > 0 ? Math.max(0, Math.min(100, currentTime / duration * 100)) : 0;
  const formatTime = (value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  };

  return (
    <div className={`pocket-player relative isolate h-full min-h-0 w-full min-w-0 overflow-visible ${className}`}>
      {/* Circular disc sits above the shell and is partially masked by it — Figma-style protrusion. */}
      <div className="pocket-disc-stage pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
        <div className={`pocket-vinyl relative aspect-square shrink-0 rounded-full ${isPlaying ? 'is-spinning' : ''}`}>
          <div className="absolute inset-0 overflow-hidden rounded-full border border-white/50 shadow-[0_18px_48px_rgba(0,0,0,.55),0_0_28px_rgba(119,128,255,.22)]">
            {artwork ? (
              <img src={artwork} alt={`${title} artist artwork`} className="absolute inset-0 h-full w-full rounded-full object-cover" />
            ) : (
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-slate-900 to-fuchsia-500" />
            )}
            {/* Vinyl groove rings */}
            <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,.16)_0px,rgba(255,255,255,.04)_1px,transparent_2px,transparent_4px)]" />
            <div className="absolute inset-[4%] rounded-full border border-white/20" />
            <div className="absolute inset-[10%] rounded-full border border-white/15" />
            <div className="absolute inset-[16%] rounded-full border border-white/12" />
            <div className="absolute inset-[22%] rounded-full border border-white/10" />
            {/* Specular highlight */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,transparent,rgba(255,255,255,.22),transparent_22%,rgba(34,211,238,.08),transparent_58%,rgba(217,70,239,.10),transparent)]" />
            <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_24px_rgba(255,255,255,.14)]" />
            {/* Center hub with rainbow ring (matches Figma) */}
            <div className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 shadow-[inset_0_1px_2px_rgba(255,255,255,.5),0_2px_8px_rgba(0,0,0,.35)]">
              <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-slate-100 to-slate-300" />
              <div className="absolute inset-[-6%] rounded-full border-2 border-transparent bg-origin-border"
                style={{ backgroundImage: 'conic-gradient(from 0deg, #f472b6, #fbbf24, #34d399, #22d3ee, #818cf8, #f472b6)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '2px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Soft glass pocket — clean rounded rect silhouette, disc overlaps top edge. */}
      <RgbBorder trackId={url} isPlaying={isPlaying} isBuffering={isBuffering} className="pocket-shell-frame absolute z-30">
        <div className="pocket-shell relative flex h-full w-full min-h-0 flex-col overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,.05),transparent_48%)]" />
          <div className="pocket-content relative flex min-h-0 flex-1 flex-col items-center justify-between text-center">
            <div className="w-full shrink-0">
              <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-400">
                <span className="flex h-4 items-end gap-[2px]" aria-hidden>
                  <i className="h-2 w-[3px] rounded-sm bg-cyan-300" />
                  <i className="h-3.5 w-[3px] rounded-sm bg-cyan-300/90" />
                  <i className="h-2.5 w-[3px] rounded-sm bg-cyan-300/80" />
                  <i className="h-4 w-[3px] rounded-sm bg-cyan-300" />
                  <i className="h-1.5 w-[3px] rounded-sm bg-cyan-300/80" />
                </span>
                NOW SPINNING
              </div>
              <h2 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
              <p className="mt-1 truncate text-xs text-slate-400">
                {artist}{enriched?.album ? ` · ${enriched.album}` : ''}{enriched?.releaseYear ? ` · ${enriched.releaseYear}` : ''}
              </p>
            </div>

            <div className="w-full shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-left font-mono text-[10px] tabular-nums text-slate-400">{formatTime(currentTime)}</span>
                <input
                  type="range" min="0" max={duration || 100} value={currentTime}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  className="h-[5px] min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-cyan-300"
                  style={{ background: `linear-gradient(to right,#42baea 0%,#8b83ee ${progress}%,rgba(255,255,255,.16) ${progress}%,rgba(255,255,255,.16) 100%)` }}
                  aria-label="Track progress"
                />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center justify-center gap-8 sm:gap-10">
              <button onClick={prevSong} disabled={!hasTrack} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-30" aria-label="Previous track">
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!hasTrack}
                className="pocket-play-btn grid h-14 w-14 shrink-0 place-items-center rounded-full text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? <Loader2 className="h-6 w-6 animate-spin" /> : isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
              </button>
              <button onClick={nextSong} disabled={!hasTrack} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-30" aria-label="Next track">
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </div>

            <div className="flex w-full shrink-0 items-center justify-between">
              <button onClick={toggleShuffle} className={`rounded-full p-2 transition ${mode === 'shuffle' ? 'bg-cyan-300/15 text-cyan-200' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`} aria-label="Toggle shuffle">
                <Shuffle className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Repeat">
                <Repeat className="h-4 w-4" />
              </button>
            </div>
            <button onClick={onOpenInfo} className="grid h-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 px-3 text-slate-300 transition hover:bg-white/10 xl:hidden" title="Lyrics and recommendations">
              <span className="flex items-center gap-2 text-[10px]"><Info className="h-3 w-3" /> Lyrics & Discover</span>
            </button>
          </div>
        </div>
      </RgbBorder>

      {/* Volume fader beside the compact shell (AudioSphere-specific). */}
      <div className="pocket-volume absolute z-40 flex flex-col items-center gap-2" aria-label="Volume control">
        <button onClick={() => changeVolume(muted ? 80 : 0)} className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-cyan-200" aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range" min="0" max="100" value={volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
          className="pocket-volume-range"
          aria-label="Volume"
          style={{ background: `linear-gradient(to top,#42baea 0%,#8b83ee ${volume}%,rgba(255,255,255,.18) ${volume}%,rgba(255,255,255,.18) 100%)` }}
        />
      </div>

      {active && <div className="pointer-events-none absolute inset-x-[18%] bottom-0 z-40 h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent shadow-[0_0_12px_rgba(34,211,238,.55)]" />}
    </div>
  );
}

interface QueueProps { player: any; className?: string; }
PlayerView.Queue = function Queue({ player, className = '' }: QueueProps) {
  const { queue, currentIndex, mode, playSong, isPlaying, isBuffering } = player;
  const scrollRef = useScrollRestore('queue', queue.length > 0);
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl ${className}`}>
      <h3 className="mb-2.5 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <ListMusic className="h-3.5 w-3.5" />{mode === 'shuffle' ? 'Shuffled Queue' : 'Current Queue'}
      </h3>
      <ul ref={scrollRef as React.RefObject<HTMLUListElement>} className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {queue.length === 0 && <li className="py-8 text-center text-[11px] text-slate-500">Queue is empty.</li>}
        {queue.map((song: any, index: number) => {
          const current = currentIndex === index;
          const row = <div className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition ${current ? 'border-transparent bg-indigo-500/20 text-indigo-100' : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/10'}`}>
            <span className="w-4 shrink-0 font-mono text-[11px] text-slate-500">{index + 1}</span>
            <span className="min-w-0 truncate text-[11px] font-medium">{song.title}</span>
          </div>;
          return <li key={song.url || index} onClick={() => playSong(index)} className="list-none">{current ? <RgbBorder trackId={song.url} isPlaying={isPlaying} isBuffering={isBuffering} className="rounded-2xl">{row}</RgbBorder> : row}</li>;
        })}
      </ul>
    </section>
  );
};
