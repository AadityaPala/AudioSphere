import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Loader2, Info, ListMusic } from 'lucide-react';

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
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTitle = currentIndex !== -1 && queue[currentIndex] ? queue[currentIndex].title : 'No track selected';

  return (
    <main className={`flex flex-col min-w-0 min-h-0 overflow-hidden bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-4 md:p-6 shadow-2xl transition-all duration-300 ${className}`}>
      {/* Central album art — grows/shrinks with panel */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full">
        <div className="relative group w-full max-w-[200px] flex-1 min-h-0 mb-3 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-300">
          <img
            src={enriched?.albumArtUrl || meta.artwork}
            alt="Artwork"
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
          />
          {isBuffering && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300">
              <Loader2 className="w-7 h-7 text-indigo-300 animate-spin" />
            </div>
          )}
        </div>

        {/* Metadata + title (shrinks last, keeps identity visible) */}
        <div className="shrink-0 flex flex-col items-center w-full">
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5 max-w-full">
            {enriched?.genre && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 whitespace-nowrap transition-all duration-300">
                {enriched.genre}
              </span>
            )}
            {enriched?.releaseYear && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap transition-all duration-300">
                {enriched.releaseYear}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-center max-w-full truncate whitespace-nowrap">{currentTitle}</h2>
          <p className="text-[11px] text-slate-400 text-center max-w-full truncate whitespace-nowrap">{meta.artist}</p>
        </div>
      </div>

      {/* Bottom control area — height strictly preserved */}
      <div className="shrink-0 flex flex-col gap-4 mt-4 w-full">
        {/* Progress Bar */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[10px] font-mono text-slate-400 w-9 text-right shrink-0 whitespace-nowrap">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="flex-1 min-w-0 h-1.5 cursor-pointer accent-indigo-500 transition-all duration-300"
          />
          <span className="text-[10px] font-mono text-slate-400 w-9 shrink-0 whitespace-nowrap">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full border transition-all duration-300 ${
              mode === 'shuffle'
                ? 'border-indigo-400/40 text-indigo-200 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={prevSong} className="p-2 text-slate-300 hover:text-white transition-all duration-300 active:scale-90">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:brightness-110 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 active:scale-95"
            >
              {isPlaying && !isBuffering ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button onClick={nextSong} className="p-2 text-slate-300 hover:text-white transition-all duration-300 active:scale-90">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          <button className="p-2 rounded-full border border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300">
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2.5 w-full max-w-xs mx-auto">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="flex-1 min-w-0 h-1 cursor-pointer accent-indigo-500 transition-all duration-300"
          />
        </div>

        {/* Mobile info button */}
        <button
          onClick={onOpenInfo}
          className="xl:hidden mx-auto grid place-items-center h-9 px-4 gap-2 rounded-2xl bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 transition-all duration-300"
          title="Lyrics & recommendations"
        >
          <span className="flex items-center gap-2 text-xs whitespace-nowrap">
            <Info className="w-4 h-4" /> Lyrics & Discover
          </span>
        </button>
      </div>
    </main>
  );
}

interface QueueProps {
  player: any;
  className?: string;
}

PlayerView.Queue = function Queue({ player, className = '' }: QueueProps) {
  const { queue, currentIndex, mode, playSong } = player;

  return (
    <section className={`flex flex-col min-h-0 bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-4 shadow-2xl overflow-hidden transition-all duration-300 ${className}`}>
      <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2.5 shrink-0 whitespace-nowrap">
        <ListMusic className="w-3.5 h-3.5" />
        {mode === 'shuffle' ? 'Shuffled Queue' : 'Current Queue'}
      </h3>
      <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {queue.length === 0 && (
          <li className="text-[11px] text-slate-500 text-center py-8">Queue is empty.</li>
        )}
        {queue.map((song: any, i: number) => (
          <li
            key={i}
            onClick={() => playSong(i)}
            className={`group flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer border transition-all duration-300 ${
              currentIndex === i
                ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-100'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-slate-300'
            }`}
          >
            <span className="text-[11px] font-mono text-slate-500 w-4 shrink-0 whitespace-nowrap">{i + 1}</span>
            <span className="text-[11px] font-medium truncate whitespace-nowrap min-w-0">{song.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
