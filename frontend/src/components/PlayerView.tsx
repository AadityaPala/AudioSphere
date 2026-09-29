import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Loader2 } from 'lucide-react';

export function PlayerView({ player }: { player: any }) {
  const { queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration, volume, meta, playSong, nextSong, prevSong, togglePlay, toggleShuffle, seekTo, changeVolume } = player;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start lg:justify-center relative p-2 lg:p-4 overflow-y-auto w-full h-full custom-scrollbar">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center z-10 transition-all duration-300">
        
        {/* Scalable Artwork */}
        <div className="relative group w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 mb-4 rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all">
          <img src={meta.artwork} alt="Artwork" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {isBuffering && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Dynamic Typography */}
        <h2 className="text-base sm:text-lg font-bold text-center w-full mb-0.5 truncate">
          {currentIndex !== -1 && queue[currentIndex] ? queue[currentIndex].title : 'No track selected'}
        </h2>
        <p className="text-[11px] text-slate-400 mb-4">{meta.artist}</p>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2.5 mb-5">
          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
          <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="flex-1 h-1.5 cursor-pointer accent-indigo-500" />
          <span className="text-[10px] font-mono text-slate-400 w-8">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full px-2">
          <button onClick={toggleShuffle} className={`p-2 rounded-full border transition-all ${mode === 'shuffle' ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={prevSong} className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90"><SkipBack className="w-5 h-5 fill-current" /></button>
            <button onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95">
              {isPlaying && !isBuffering ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button onClick={nextSong} className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90"><SkipForward className="w-5 h-5 fill-current" /></button>
          </div>
          <button onClick={() => {}} className="p-2 rounded-full border border-transparent text-slate-400 hover:text-white"><Repeat className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Shuffled/Active Queue with Transparent Boxes */}
      <div className="w-full max-w-md mt-4 bg-white/5 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl transition-all">
        <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2.5 flex items-center gap-2">
          {mode === 'shuffle' ? '🔀 Shuffled Queue' : '🎵 Current Queue'}
        </h3>
        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
          {queue.map((song: any, i: number) => (
            <li
              key={i}
              onClick={() => playSong(i)}
              className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all ${
                currentIndex === i ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200' : 'bg-white/2 border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <span className="text-[11px] font-mono text-slate-500 w-4">{i + 1}</span>
                <span className="text-[11px] font-medium truncate">{song.title}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Volume control */}
      <div className="absolute top-4 right-4 lg:bottom-4 lg:top-auto lg:right-4 flex items-center gap-2.5 bg-black/40 border border-white/10 backdrop-blur-xl px-3.5 py-2 rounded-full shadow-lg z-20">
        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
        <input type="range" min="0" max="100" value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="w-16 h-1 cursor-pointer accent-indigo-500" />
      </div>
    </main>
  );
}