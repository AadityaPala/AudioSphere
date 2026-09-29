import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Loader2 } from 'lucide-react';

export function PlayerView({ player }: { player: any }) {
  const { queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration, volume, meta, playSong, nextSong, prevSong, togglePlay, toggleShuffle, seekTo, changeVolume } = player;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start md:justify-center relative p-6 overflow-y-auto w-full">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center z-10 transition-all">
        
        {/* Artwork with loading overlay */}
        <div className="relative group w-48 h-48 md:w-64 md:h-64 mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          <img src={meta.artwork} alt="Artwork" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {isBuffering && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-opacity">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <h2 className="text-lg md:text-xl font-bold text-center w-full mb-1 line-clamp-1">
          {currentIndex !== -1 && queue[currentIndex] ? queue[currentIndex].title : 'No track selected'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">{meta.artist}</p>

        {/* Progress */}
        <div className="w-full flex items-center gap-3 mb-6">
          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
          <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => seekTo(Number(e.target.value))} className="flex-1 h-1.5 cursor-pointer accent-indigo-500" />
          <span className="text-[10px] font-mono text-slate-400 w-8">{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full px-2 md:px-4">
          <button onClick={toggleShuffle} className={`p-2.5 rounded-full border transition-colors ${mode === 'shuffle' ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Shuffle className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={prevSong} className="p-3 text-slate-300 hover:text-white transition-transform active:scale-90"><SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" /></button>
            <button onClick={togglePlay} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-90">
              {isPlaying && !isBuffering ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-1" />}
            </button>
            <button onClick={nextSong} className="p-3 text-slate-300 hover:text-white transition-transform active:scale-90"><SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" /></button>
          </div>
          <button onClick={() => {}} className="p-2.5 rounded-full border border-transparent text-slate-400 hover:text-white transition-colors"><Repeat className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Visible Queue for Shuffle/Sequential layout */}
      <div className="w-full max-w-lg mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
          {mode === 'shuffle' ? '🔀 Shuffled Queue' : '🎵 Up Next'}
        </h3>
        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {queue.map((song: any, i: number) => (
            <li key={i} onClick={() => playSong(i)} className={`text-xs p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${currentIndex === i ? 'bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/20' : 'text-slate-400 hover:bg-white/10'}`}>
              <span className="w-4 text-slate-500 font-mono">{i + 1}</span>
              <span className="truncate">{song.title}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile-friendly volume */}
      <div className="absolute top-6 right-6 md:bottom-4 md:top-auto md:right-4 flex items-center gap-3 bg-black/40 border border-white/10 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg z-20">
        <Volume2 className="w-4 h-4 text-slate-400" />
        <input type="range" min="0" max="100" value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="w-16 md:w-20 h-1 cursor-pointer accent-indigo-500" />
      </div>
    </main>
  );
}