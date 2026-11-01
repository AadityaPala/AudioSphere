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
    queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration,
    volume, meta, enriched, nextSong, prevSong, togglePlay, toggleShuffle,
    seekTo, changeVolume,
  } = player;

  const formatTime = (secs: number) => {
    const safe = Number.isFinite(secs) ? Math.max(0, secs) : 0;
    return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  };

  const currentTrack = currentIndex !== -1 ? queue[currentIndex] : null;
  const currentTitle = currentTrack?.title || 'No track selected';
  const currentUrl = currentTrack?.url || '';
  const hasTrack = !!currentTrack;
  const rgbActive = hasTrack && (isPlaying || isBuffering);
  const isMuted = volume === 0;
  const artwork = enriched?.albumArtUrl || meta.artwork;
  const progress = duration > 0 ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0;

  const inner = (
    <main className={`relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/55 shadow-2xl backdrop-blur-2xl ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.20),transparent_48%),radial-gradient(ellipse_at_90%_65%,rgba(168,85,247,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_42%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center px-5 pb-4 pt-2 sm:px-8">
        {/* Floating vinyl / recessed turntable slot inspired by Figma node 3311:698 */}
        <div className="relative flex w-full min-h-[175px] flex-[1.1] items-end justify-center overflow-hidden">
          <div className="absolute bottom-[9%] left-1/2 z-0 h-3 w-[min(82%,560px)] -translate-x-1/2 rounded-[50%] border border-white/20 bg-black/80 shadow-[0_8px_24px_rgba(0,0,0,0.65),inset_0_2px_5px_rgba(255,255,255,0.16)]" />
          <div className={`absolute bottom-[10%] left-1/2 z-[1] aspect-square w-[min(53%,260px)] -translate-x-1/2 overflow-hidden rounded-full border border-white/25 bg-[#090b13] shadow-[0_16px_38px_rgba(0,0,0,0.55),0_0_30px_rgba(99,102,241,0.14)] ${isPlaying ? 'animate-[spin_18s_linear_infinite]' : ''}`}>
            <div className="absolute inset-[3%] rounded-full border border-white/10 bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.035)_1px,transparent_2px,transparent_5px)]" />
            <div className="absolute inset-[17%] rounded-full border border-white/15 bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0px,transparent_1px,transparent_4px)]" />
            <div className="absolute inset-[29%] overflow-hidden rounded-full border-[3px] border-white/25 bg-slate-900 shadow-[0_0_0_5px_rgba(255,255,255,0.04)]">
              {artwork ? <img src={artwork} alt={`${currentTitle} album artwork`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-indigo-500/70 via-slate-900 to-fuchsia-500/60"><AudioLines className="h-8 w-8 text-white/80" /></div>}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_25deg,transparent,rgba(255,255,255,0.22),transparent_28%,rgba(34,211,238,0.10),transparent_65%,rgba(217,70,239,0.12),transparent)]" />
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_0_24px_rgba(255,255,255,0.12)]" />
            {isBuffering && <div className="absolute inset-0 grid place-items-center rounded-full bg-black/55 backdrop-blur-sm"><Loader2 className="h-7 w-7 animate-spin text-cyan-200" /></div>}
          </div>
          <div className="absolute bottom-[8%] left-1/2 z-[2] h-1.5 w-[min(86%,600px)] -translate-x-1/2 rounded-full bg-slate-950 shadow-[0_2px_10px_rgba(0,0,0,0.85)]" />
          <div className="absolute bottom-[7%] left-1/2 z-[3] h-px w-[min(80%,550px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        </div>

        <div className="relative z-10 flex w-full shrink-0 flex-col items-center pt-4 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
            <AudioLines className="h-4 w-4 text-cyan-300" />
            <span>{isPlaying ? 'Now Spinning' : 'Ready to Spin'}</span>
            {isPlaying && <span className="flex h-3 items-end gap-[2px]" aria-hidden><i className="h-1.5 w-[2px] animate-pulse rounded bg-cyan-300" /><i className="h-3 w-[2px] animate-pulse rounded bg-cyan-300 [animation-delay:120ms]" /><i className="h-2 w-[2px] animate-pulse rounded bg-cyan-300 [animation-delay:240ms]" /></span>}
          </div>
          <h2 className="max-w-full truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{currentTitle}</h2>
          <p className="mt-1 max-w-full truncate text-xs text-slate-400">{enriched?.artist || meta.artist || 'Select a track to begin'}{enriched?.album ? ` · ${enriched.album}` : ''}{enriched?.releaseYear ? ` · ${enriched.releaseYear}` : ''}</p>
          {enriched?.genre && <span className="mt-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-0.5 text-[10px] text-cyan-100">{enriched.genre}</span>}
        </div>

        <div className="relative z-10 w-full max-w-2xl shrink-0 pb-1 pt-5">
          <div className="flex items-center gap-3">
            <span className="w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-slate-400">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-cyan-300" style={{ background: `linear-gradient(to right, #67e8f9 0%, #818cf8 ${progress}%, rgba(255,255,255,0.14) ${progress}%, rgba(255,255,255,0.14) 100%)` }} aria-label="Track progress" />
            <span className="w-9 shrink-0 font-mono text-[10px] tabular-nums text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center justify-center gap-8 pb-1 pt-3 sm:gap-12">
          <button onClick={prevSong} disabled={!hasTrack} className="rounded-full p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-cyan-200 active:scale-90 disabled:opacity-30" aria-label="Previous track"><SkipBack className="h-5 w-5 fill-current" /></button>
          <button onClick={togglePlay} disabled={!hasTrack} className="grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-gradient-to-br from-cyan-300 via-blue-500 to-fuchsia-500 text-white shadow-[0_8px_28px_rgba(59,130,246,0.32)] transition hover:brightness-110 active:scale-95 disabled:opacity-40" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying && !isBuffering ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}</button>
          <button onClick={nextSong} disabled={!hasTrack} className="rounded-full p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-cyan-200 active:scale-90 disabled:opacity-30" aria-label="Next track"><SkipForward className="h-5 w-5 fill-current" /></button>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center justify-between pt-2">
          <button onClick={toggleShuffle} className={`rounded-full p-2 transition ${mode === 'shuffle' ? 'bg-cyan-300/15 text-cyan-200' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`} aria-label="Toggle shuffle"><Shuffle className="h-3.5 w-3.5" /></button>
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Repeat"><Repeat className="h-3.5 w-3.5" /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => changeVolume(isMuted ? 80 : 0)} className="text-slate-400 transition hover:text-white" aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="vol-slider-vertical" style={{ background: `linear-gradient(to top, rgba(34,211,238,0.8) 0%, rgba(99,102,241,0.65) ${volume}%, rgba(255,255,255,0.1) ${volume}%)` }} aria-label="Volume" />
          </div>
        </div>

        <button onClick={onOpenInfo} className="relative z-10 mx-auto mt-2 grid h-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 px-3 text-slate-300 transition hover:bg-white/10 hover:text-white xl:hidden" title="Lyrics and recommendations"><span className="flex items-center gap-2 text-[11px]"><Info className="h-3.5 w-3.5" /> Lyrics & Discover</span></button>
      </div>
    </main>
  );

  return rgbActive ? <RgbBorder trackId={currentUrl} isPlaying={isPlaying} isBuffering={isBuffering} className="h-full w-full rounded-3xl">{inner}</RgbBorder> : inner;
}

interface QueueProps { player: any; className?: string; }

PlayerView.Queue = function Queue({ player, className = '' }: QueueProps) {
  const { queue, currentIndex, mode, playSong, isPlaying, isBuffering } = player;
  const scrollRef = useScrollRestore('queue', queue.length > 0);

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl ${className}`}>
      <h3 className="mb-2.5 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><ListMusic className="h-3.5 w-3.5" />{mode === 'shuffle' ? 'Shuffled Queue' : 'Current Queue'}</h3>
      <ul ref={scrollRef as React.RefObject<HTMLUListElement>} className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {queue.length === 0 && <li className="py-8 text-center text-[11px] text-slate-500">Queue is empty.</li>}
        {queue.map((song: any, i: number) => {
          const isCurrent = currentIndex === i;
          const item = <div className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition ${isCurrent ? 'border-transparent bg-indigo-500/15 text-indigo-100' : 'border-white/5 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/10'}`}><span className="w-4 shrink-0 font-mono text-[11px] text-slate-500">{i + 1}</span><span className="min-w-0 truncate text-[11px] font-medium">{song.title}</span></div>;
          return <li key={song.url || i} onClick={() => playSong(i)} className="list-none">{isCurrent ? <RgbBorder trackId={song.url} isPlaying={isPlaying} isBuffering={isBuffering} className="rounded-2xl">{item}</RgbBorder> : item}</li>;
        })}
      </ul>
    </section>
  );
};
