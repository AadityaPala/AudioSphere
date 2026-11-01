import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Loader2, Info, ListMusic, AudioLines } from 'lucide-react';
import { RgbBorder } from './RgbBorder';
import { useScrollRestore } from '../hooks/useScrollRestore';

interface PlayerViewProps {
  player: any;
  onOpenInfo: () => void;
  className?: string;
}

export function PlayerView({ player, onOpenInfo, className = '' }: PlayerViewProps) {
  const {
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    mode,
    currentTime,
    duration,
    volume,
    meta,
    enriched,
    nextSong,
    prevSong,
    togglePlay,
    toggleShuffle,
    seekTo,
    changeVolume,
  } = player;

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const currentTitle = currentIndex !== -1 && queue[currentIndex] ? queue[currentIndex].title : 'No track selected';
  const currentUrl = currentIndex !== -1 && queue[currentIndex] ? queue[currentIndex].url : '';
  const hasTrack = currentIndex !== -1 && !!queue[currentIndex];
  const rgbActive = hasTrack && (isPlaying || isBuffering);
  const isMuted = volume === 0;
  const artwork = enriched?.albumArtUrl || meta.artwork;

  const inner = (
    <main className={`relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 md:p-6 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_38%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Raised artwork and divider inspired by the reference player */}
        <div className="relative flex h-[39%] min-h-[150px] shrink-0 items-end justify-center overflow-hidden pb-4">
          <div className={`absolute left-1/2 top-[-46%] aspect-square w-[min(58%,220px)] -translate-x-1/2 rounded-full border border-white/30 bg-black/30 p-1 shadow-[0_12px_35px_rgba(0,0,0,0.45)] ${isPlaying ? "vinyl-spin" : ""}`}>
            <div className="relative h-full w-full overflow-hidden rounded-full border border-white/20 bg-black/40">
              <img src={artwork} alt="Artwork" className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/35" />
              {isBuffering && (
                <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
                  <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
                </div>
              )}
            </div>
          </div>
          <div className="relative z-10 h-1.5 w-full rounded-full bg-slate-950/90 shadow-[0_0_12px_rgba(15,23,42,0.8)]" />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between pt-1 text-center">
          <div className="shrink-0">
            <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              <AudioLines className="h-4 w-4 text-cyan-300" />
              <span>Now Spinning</span>
            </div>
            <h2 className="max-w-full truncate text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">{currentTitle}</h2>
            <p className="mt-1 truncate text-xs text-slate-400">{enriched?.artist || meta.artist || 'Select a track to begin'}</p>
            {(enriched?.genre || enriched?.releaseYear) && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {enriched?.genre && <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">{enriched.genre}</span>}
                {enriched?.releaseYear && <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">{enriched.releaseYear}</span>}
              </div>
            )}
          </div>

          <div className="w-full max-w-xl shrink-0 pb-1 pt-5">
            <div className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-cyan-400"
                style={{ background: `linear-gradient(to right, rgba(34,211,238,0.9) 0%, rgba(99,102,241,0.8) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.14) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.14) 100%)` }}
                aria-label="Track progress"
              />
              <span className="w-9 shrink-0 font-mono text-[10px] text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-center gap-7 pb-1 pt-3 sm:gap-10">
            <button onClick={prevSong} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-90" aria-label="Previous track">
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-gradient-to-br from-cyan-300 via-blue-500 to-fuchsia-500 text-white shadow-[0_8px_25px_rgba(59,130,246,0.35)] transition hover:brightness-110 active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying && !isBuffering ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
            </button>
            <button onClick={nextSong} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-90" aria-label="Next track">
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
          </div>

          <div className="flex w-full shrink-0 items-center justify-between pt-2">
            <button
              onClick={toggleShuffle}
              className={`rounded-full p-2 transition ${mode === 'shuffle' ? 'bg-cyan-300/15 text-cyan-200' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Repeat">
              <Repeat className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => changeVolume(isMuted ? 80 : 0)} className="text-slate-400 transition hover:text-white" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <div className="relative flex h-20 w-6 items-center justify-center" title="Volume">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="vol-slider-vertical"
                  style={{ background: `linear-gradient(to right, rgba(34,211,238,0.9) 0%, rgba(99,102,241,0.8) ${volume}%, rgba(255,255,255,0.14) ${volume}%, rgba(255,255,255,0.14) 100%)` }}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>

          <button onClick={onOpenInfo} className="mx-auto mt-2 grid h-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 px-3 text-slate-300 transition hover:bg-white/10 hover:text-white xl:hidden" title="Lyrics and recommendations">
            <span className="flex items-center gap-2 text-[11px]"><Info className="h-3.5 w-3.5" /> Lyrics & Discover</span>
          </button>
        </div>
      </div>
    </main>
  );

  return rgbActive ? (
    <RgbBorder trackId={currentUrl} isPlaying={isPlaying} isBuffering={isBuffering} className="h-full w-full rounded-3xl">
      {inner}
    </RgbBorder>
  ) : inner;
}

interface QueueProps {
  player: any;
  className?: string;
}

PlayerView.Queue = function Queue({ player, className = '' }: QueueProps) {
  const { queue, currentIndex, mode, playSong, isPlaying, isBuffering } = player;
  const scrollRef = useScrollRestore('queue', queue.length > 0);

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl ${className}`}>
      <h3 className="mb-2.5 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <ListMusic className="h-3.5 w-3.5" />
        {mode === 'shuffle' ? 'Shuffled Queue' : 'Current Queue'}
      </h3>
      <ul ref={scrollRef as React.RefObject<HTMLUListElement>} className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {queue.length === 0 && <li className="py-8 text-center text-[11px] text-slate-500">Queue is empty.</li>}
        {queue.map((song: any, i: number) => {
          const isCurrent = currentIndex === i;
          const item = (
            <div className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition ${isCurrent ? 'border-transparent bg-indigo-500/20 text-indigo-100' : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/10'}`}>
              <span className="w-4 shrink-0 font-mono text-[11px] text-slate-500">{i + 1}</span>
              <span className="min-w-0 truncate text-[11px] font-medium">{song.title}</span>
            </div>
          );
          return (
            <li key={i} onClick={() => playSong(i)} className="list-none">
              {isCurrent ? <RgbBorder trackId={song.url} isPlaying={isPlaying} isBuffering={isBuffering} className="rounded-2xl">{item}</RgbBorder> : item}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
