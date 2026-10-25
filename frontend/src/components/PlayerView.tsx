import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Loader2, Info, ListMusic } from 'lucide-react';

interface PlayerViewProps {
  player: any;
  onOpenInfo: () => void;
}

export function PlayerView({ player, onOpenInfo }: PlayerViewProps) {
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
    playSong,
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
    <main className="flex-1 min-w-0 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* Hero player card */}
      <section className="relative flex flex-col items-center shrink-0 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 md:p-6 shadow-2xl">
        <div className="flex items-center gap-4 w-full">
          {/* Artwork */}
          <div className="relative group w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all">
            <img
              src={enriched?.albumArtUrl || meta.artwork}
              alt="Artwork"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {isBuffering && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-6 h-6 text-indigo-300 animate-spin" />
              </div>
            )}
          </div>

          {/* Title + metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {enriched?.genre && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
                  {enriched.genre}
                </span>
              )}
              {enriched?.releaseYear && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {enriched.releaseYear}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold truncate">{currentTitle}</h2>
            <p className="text-[11px] text-slate-400 truncate">{meta.artist}</p>
          </div>

          {/* Mobile info button */}
          <button
            onClick={onOpenInfo}
            className="xl:hidden grid place-items-center w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 transition shrink-0"
            title="Lyrics & recommendations"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2.5 mt-5 w-full">
          <span className="text-[10px] font-mono text-slate-400 w-9 text-right shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="flex-1 min-w-0 h-1.5 cursor-pointer accent-indigo-500"
          />
          <span className="text-[10px] font-mono text-slate-400 w-9 shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full mt-4">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full border transition-all ${
              mode === 'shuffle'
                ? 'border-indigo-400/40 text-indigo-200 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={prevSong} className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:brightness-110 text-white shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
            >
              {isPlaying && !isBuffering ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button onClick={nextSong} className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          <button className="p-2 rounded-full border border-transparent text-slate-400 hover:text-white">
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2.5 mt-4 w-full max-w-xs">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="flex-1 min-w-0 h-1 cursor-pointer accent-indigo-500"
          />
        </div>
      </section>

      {/* Queue */}
      <section className="flex-1 min-h-0 flex flex-col bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl overflow-hidden">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2.5 shrink-0">
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
              className={`group flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer border transition-all ${
                currentIndex === i
                  ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-100'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-slate-300'
              }`}
            >
              <span className="text-[11px] font-mono text-slate-500 w-4 shrink-0">{i + 1}</span>
              <span className="text-[11px] font-medium truncate">{song.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
