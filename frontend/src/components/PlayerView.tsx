import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  ListOrdered,
  Volume2,
  Loader2,
} from 'lucide-react';
import { RgbBorder } from './RgbBorder';

interface PlayerViewProps {
  player: any;
  onOpenInfo: () => void;
  className?: string;
}

interface DiscLayerProps {
  artwork?: string;
  title: string;
  isPlaying: boolean;
  layer: 'back' | 'front';
}

/**
 * The record is intentionally rendered twice:
 * - back: sits behind the glass shell
 * - front: shows only the part above the slot
 *
 * The two copies use the same artwork and animation so they read as one disc.
 * This creates a real foreground/background split instead of cutting the
 * lower half of the only disc away.
 */
function DiscLayer({ artwork, title, isPlaying, layer }: DiscLayerProps) {
  return (
    <div
      className={'vinyl-player__disc vinyl-player__disc--' + layer}
      aria-hidden="true"
    >
      <div className={'vinyl-player__disc-rotation' + (isPlaying ? ' is-spinning' : '')}>
        <div className="vinyl-player__disc-face">
          {artwork ? (
            <img className="vinyl-player__artwork" src={artwork} alt="" draggable={false} />
          ) : (
            <div className="vinyl-player__artwork-fallback" />
          )}
          <div className="vinyl-player__grooves" />
          <div className="vinyl-player__sheen" />
          <div className="vinyl-player__hub">
            <span className="vinyl-player__hub-hole" />
          </div>
        </div>
      </div>
      <span className="sr-only">{title} album artwork</span>
    </div>
  );
}

const formatTime = (value: number) => {
  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
};

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

  const track = currentIndex >= 0 ? queue[currentIndex] : null;
  const title = track?.title || 'No track selected';
  const artist = enriched?.artist || meta.artist || 'Select a track to begin';
  const album = enriched?.album || '';
  const year = enriched?.releaseYear || '';
  const artwork = enriched?.albumArtUrl || meta.artwork;
  const hasTrack = !!track;
  const muted = volume === 0;
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const safeCurrentTime = Number.isFinite(currentTime)
    ? Math.max(0, Math.min(currentTime, safeDuration || currentTime))
    : 0;
  const progress = safeDuration > 0
    ? Math.max(0, Math.min(100, (safeCurrentTime / safeDuration) * 100))
    : 0;

  const progressBackground =
    'linear-gradient(to right, #42baea 0%, #8b83ee ' + progress +
    '%, rgba(255,255,255,.16) ' + progress + '%, rgba(255,255,255,.16) 100%)';

  const volumeBackground =
    'linear-gradient(to right, #42baea 0%, #8b83ee ' + volume +
    '%, rgba(255,255,255,.16) ' + volume + '%, rgba(255,255,255,.16) 100%)';

  return (
    <div className={'vinyl-player ' + className}>
      <div className="vinyl-player__scene">
        {/* Complete record under the shell: this is what is hidden below the slot. */}
        <DiscLayer artwork={artwork} title={title} isPlaying={isPlaying} layer="back" />

        {/* Glass shell starts part-way down the disc and covers its lower area. */}
        <RgbBorder
          trackId={track?.url || ''}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          className="vinyl-player__shell-frame player-rgb"
        >
          <div className="vinyl-player__shell">
            <div className="vinyl-player__shell-gloss" aria-hidden="true" />

            <div className="vinyl-player__content">
              <div className="vinyl-player__track-info">
                <div className="vinyl-player__now">
                  <span
                    className={'vinyl-player__equalizer' + (isPlaying ? ' is-active' : '')}
                    aria-hidden="true"
                  >
                    <i /><i /><i /><i /><i />
                  </span>
                  <span>{isBuffering ? 'LOADING TRACK' : 'NOW SPINNING'}</span>
                </div>

                <div className="vinyl-player__heading">
                  <h2 className="vinyl-player__title" title={title}>{title}</h2>
                  <p className="vinyl-player__artist">
                    {artist}
                    {album ? ' · ' + album : ''}
                    {year ? ' · ' + year : ''}
                  </p>
                </div>
              </div>

              <div className="vinyl-player__progress">
                <span className="vinyl-player__time">{formatTime(safeCurrentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={safeDuration || 100}
                  step={1}
                  value={safeCurrentTime}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  className="vinyl-player__seek"
                  style={{ background: progressBackground }}
                  aria-label="Track progress"
                  disabled={!hasTrack || safeDuration <= 0}
                />
                <span className="vinyl-player__time">{formatTime(safeDuration)}</span>
              </div>

              <div className="vinyl-player__transport">
                <button
                  onClick={prevSong}
                  disabled={!hasTrack}
                  className="vinyl-player__transport-btn"
                  aria-label="Previous track"
                  type="button"
                >
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={!hasTrack}
                  className="vinyl-player__play-btn"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  aria-pressed={isPlaying}
                  type="button"
                >
                  {isBuffering ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-7 w-7 fill-current" />
                  )}
                </button>

                <button
                  onClick={nextSong}
                  disabled={!hasTrack}
                  className="vinyl-player__transport-btn"
                  aria-label="Next track"
                  type="button"
                >
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
              </div>

              <div className="vinyl-player__utility">
                <div className="vinyl-player__modes">
                  <button
                    onClick={toggleShuffle}
                    className={'vinyl-player__utility-btn' + (mode === 'shuffle' ? ' is-active' : '')}
                    aria-label="Shuffle order"
                    aria-pressed={mode === 'shuffle'}
                    title="Shuffle order"
                    type="button"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => { if (mode === 'shuffle') toggleShuffle(); }}
                  className={'vinyl-player__utility-btn' + (mode !== 'shuffle' ? ' is-active' : '')}
                  aria-label="Sequential order"
                  aria-pressed={mode !== 'shuffle'}
                  title="Play in original order"
                  type="button"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </RgbBorder>

        {/* Foreground copy of the record. It ends exactly at the slot seam. */}
        <DiscLayer artwork={artwork} title={title} isPlaying={isPlaying} layer="front" />

        {/* The slot is a separate top layer, crossing both the disc and shell. */}
        <div className="vinyl-player__slot" aria-hidden="true" />


      </div>

      <div className="vinyl-player__volume-rail" aria-label="Volume controls">
        <Volume2 className="h-4 w-4 text-slate-300" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => changeVolume(Number(event.target.value))}
          className="vinyl-player__volume-range vinyl-player__volume-range--vertical"
          style={{ background: volumeBackground }}
          aria-label="Volume"
        />
        <span className="text-[10px] font-mono text-slate-400">{volume}</span>
      </div>
    </div>
  );
}

