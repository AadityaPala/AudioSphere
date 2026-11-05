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
    <div className={`pocket-player ${className}`}>
      {/* Stage holds disc + shell as one unit, centered in the panel */}
      <div className="pocket-stage">
        {/* Disc — top half visible, bottom half nested into the shell */}
        <div className="pocket-disc-stage">
          <div className={`pocket-vinyl ${isPlaying ? 'is-spinning' : ''}`}>
            <div className="pocket-vinyl-face">
              {artwork ? (
                <img src={artwork} alt={`${title} artwork`} className="pocket-vinyl-art" />
              ) : (
                <div className="pocket-vinyl-fallback" />
              )}
              <div className="pocket-vinyl-grooves" />
              <div className="pocket-vinyl-shine" />
              <div className="pocket-vinyl-hub">
                <div className="pocket-vinyl-hub-core" />
                <div className="pocket-vinyl-hub-ring" />
              </div>
            </div>
          </div>
        </div>

        {/* Glass pocket shell */}
        <RgbBorder trackId={url} isPlaying={isPlaying} isBuffering={isBuffering} className="pocket-shell-frame">
          <div className="pocket-shell">
            <div className="pocket-shell-gloss" aria-hidden />
            <div className="pocket-content">
              <div className="pocket-meta">
                <div className="pocket-now">
                  <span className="pocket-eq" aria-hidden>
                    <i /><i /><i /><i /><i />
                  </span>
                  NOW SPINNING
                </div>
                <h2 className="pocket-title">{title}</h2>
                <p className="pocket-artist">
                  {artist}{enriched?.album ? ` · ${enriched.album}` : ''}{enriched?.releaseYear ? ` · ${enriched.releaseYear}` : ''}
                </p>
              </div>

              <div className="pocket-progress">
                <span className="pocket-time">{formatTime(currentTime)}</span>
                <input
                  type="range" min="0" max={duration || 100} value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="pocket-seek"
                  style={{ background: `linear-gradient(to right,#42baea 0%,#8b83ee ${progress}%,rgba(255,255,255,.16) ${progress}%,rgba(255,255,255,.16) 100%)` }}
                  aria-label="Track progress"
                />
                <span className="pocket-time">{formatTime(duration)}</span>
              </div>

              <div className="pocket-transport">
                <button onClick={prevSong} disabled={!hasTrack} className="pocket-icon-btn" aria-label="Previous track">
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!hasTrack}
                  className="pocket-play-btn"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? <Loader2 className="h-7 w-7 animate-spin" /> : isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-0.5 h-7 w-7 fill-current" />}
                </button>
                <button onClick={nextSong} disabled={!hasTrack} className="pocket-icon-btn" aria-label="Next track">
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
              </div>

              <div className="pocket-secondary">
                <button onClick={toggleShuffle} className={`pocket-icon-btn ${mode === 'shuffle' ? 'is-active' : ''}`} aria-label="Toggle shuffle">
                  <Shuffle className="h-4 w-4" />
                </button>
                <button className="pocket-icon-btn" aria-label="Repeat">
                  <Repeat className="h-4 w-4" />
                </button>
              </div>

              <button onClick={onOpenInfo} className="pocket-info-btn xl:hidden" title="Lyrics and recommendations">
                <Info className="h-3 w-3" /> Lyrics & Discover
              </button>
            </div>
          </div>
        </RgbBorder>

        {/* Dark slot lip: sits above the disc edge and the glass shell */}
        <div className="pocket-slot-overlay" aria-hidden="true" />

        {/* Volume — beside the shell */}
        <div className="pocket-volume" aria-label="Volume control">
          <button onClick={() => changeVolume(muted ? 80 : 0)} className="pocket-vol-mute" aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range" min="0" max="100" value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="pocket-volume-range"
            aria-label="Volume"
            style={{ background: `linear-gradient(to top,#42baea 0%,#8b83ee ${volume}%,rgba(255,255,255,.18) ${volume}%,rgba(255,255,255,.18) 100%)` }}
          />
        </div>

        {active && <div className="pocket-active-glow" aria-hidden />}
      </div>
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
