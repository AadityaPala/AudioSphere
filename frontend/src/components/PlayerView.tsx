import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Loader2, Info, ListMusic, AudioLines } from 'lucide-react';
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
      {/* The disc is a separate top layer, centered over the pocket slot. Its full
          circle stays in the player viewport at every resize breakpoint. */}
      <div className="pocket-disc-stage pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
        <div className={`pocket-vinyl relative aspect-square shrink-0 rounded-full ${isPlaying ? 'is-spinning' : ''}`}>
          <div className="absolute inset-0 overflow-hidden rounded-full border border-white/70 bg-[#11131b] shadow-[0_14px_42px_rgba(0,0,0,.58),0_0_24px_rgba(119,128,255,.16)]">
            <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,.20)_0px,rgba(255,255,255,.055)_1px,transparent_2px,transparent_4px)]" />
            <div className="absolute inset-[3%] rounded-full border border-white/15" />
            <div className="absolute inset-[8%] rounded-full border border-white/10" />
            <div className="absolute inset-[13%] rounded-full border border-white/10" />
            <div className="absolute inset-[18%] rounded-full border border-white/10" />
            <div className="absolute inset-[23%] rounded-full border border-white/10" />
            <div className="absolute inset-[28%] rounded-full border border-white/20 bg-[#171923] p-[2px]">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/50 to-fuchsia-500/40">
                {artwork && <img src={artwork} alt={`${title} album artwork`} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent to-black/35" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_25deg,transparent,rgba(255,255,255,.26),transparent_24%,rgba(34,211,238,.12),transparent_62%,rgba(217,70,239,.15),transparent)]" />
            <div className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_28px_rgba(255,255,255,.12)]" />
          </div>
        </div>
      </div>

      {/* Pocket shell follows Figma's proportions: a recessed rounded card with
          the vinyl overlapping its upper edge. Content uses a shrink-safe stack. */}
      <div className="pocket-shell absolute inset-x-0 bottom-0 mx-auto flex min-h-0 flex-col overflow-hidden rounded-[34px] border border-white/25 bg-gradient-to-b from-[#262936] via-[#1b1e29] to-[#131620] shadow-[0_24px_60px_rgba(0,0,0,.42),inset_0_2px_3px_rgba(255,255,255,.18),inset_0_-4px_12px_rgba(0,0,0,.28)] backdrop-blur-2xl">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,.06),transparent_45%)]" />
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

          <div className="flex w-full shrink-0 items-center justify-center gap-8 sm:gap-12">
            <button onClick={prevSong} disabled={!hasTrack} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-30" aria-label="Previous track">
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button onClick={togglePlay} disabled={!hasTrack} className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/30 bg-[#252a38] text-white shadow-[inset_0_3px_8px_rgba(255,255,255,.22),inset_0_-7px_12px_rgba(0,0,0,.38),0_10px_24px_rgba(0,0,0,.32)] transition hover:brightness-125 active:scale-95 disabled:opacity-40" aria-label={isPlaying ? 'Pause' : 'Play'}>
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

      {/* Dedicated volume fader beside the record, not in the transport row. */}
      <div className="pocket-volume absolute z-30 flex flex-col items-center gap-2" aria-label="Volume control">
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

      {active && <div className="pointer-events-none absolute inset-x-[15%] bottom-0 z-40 h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent shadow-[0_0_12px_rgba(34,211,238,.55)]" />}
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
