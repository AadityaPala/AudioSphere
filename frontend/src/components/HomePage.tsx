import { Play, Info } from 'lucide-react';
import type { MockArtist, MockTrack, Song } from '../types';
import { MOCK_ARTISTS, MOCK_TRACKS } from '../data/mockMusic';

interface HomePageProps {
  displayName: string | null;
  songs: Song[];
  player: any;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomePage({ displayName, songs, player }: HomePageProps) {
  const greeting = getGreeting();
  const name = displayName?.trim();
  const heading = name ? `${greeting}, ${name}.` : `${greeting}.`;

  const playLibraryTrack = (url: string) => {
    const index = player.queue.findIndex((s: Song) => s.url === url);
    if (index >= 0) player.playSong(index);
  };

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto custom-scrollbar">
      {/* Welcome section */}
      <section className="relative px-6 sm:px-8 pt-8 pb-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 left-1/4 h-48 w-72 rounded-full bg-blue-500/20 blur-[90px]" />
          <div className="absolute -top-10 right-1/4 h-40 w-64 rounded-full bg-indigo-500/20 blur-[90px]" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
          {heading}
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">Discover something extraordinary today.</p>
      </section>

      {/* Featured artists */}
      <section className="px-6 sm:px-8 pb-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Popular Artists</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-3 -mx-1 px-1 snap-x">
          {MOCK_ARTISTS.map((artist: MockArtist) => (
            <div
              key={artist.id}
              className="group snap-start shrink-0 w-36 sm:w-40 cursor-pointer"
            >
              <div className="relative aspect-square rounded-full overflow-hidden border border-white/10 shadow-xl group-hover:border-indigo-400/40 group-hover:shadow-indigo-500/20 transition-all duration-400">
                <img
                  src={artist.image}
                  alt={artist.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute bottom-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors duration-300">{artist.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{artist.monthlyListeners}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested tracks */}
      <section className="px-6 sm:px-8 pb-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Recommended Tracks</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          {MOCK_TRACKS.map((track: MockTrack) => {
            const libMatch = songs.find((s) =>
              s.title.toLowerCase().includes(track.title.toLowerCase()) ||
              s.title.toLowerCase().includes(track.artist.toLowerCase())
            );
            const playable = track.playable || !!libMatch;

            return (
              <div
                key={track.id}
                className={`group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                  playable
                    ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] hover:border-indigo-400/30 cursor-pointer'
                    : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                }`}
                onClick={playable && libMatch ? () => playLibraryTrack(libMatch.url) : undefined}
                role={playable ? 'button' : undefined}
                tabIndex={playable ? 0 : undefined}
                onKeyDown={playable && libMatch ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playLibraryTrack(libMatch.url); } } : undefined}
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10">
                  <img src={track.artwork} alt={track.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {playable && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity duration-300">
                      <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${playable ? 'group-hover:text-indigo-300' : ''} transition-colors duration-300`}>{track.title}</p>
                  <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  <p className="text-[11px] text-slate-500 truncate">{track.album}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!playable && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Info className="w-3 h-3" /> Preview
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-500">{track.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
