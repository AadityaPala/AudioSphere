import { useEffect, useMemo, useState, type RefObject } from 'react';
import { Disc3, Loader2, Music2, Play, Radio, RefreshCw, Sparkles, Users } from 'lucide-react';
import type { DiscoveryArtist, DiscoveryTrack, Song } from '../types';
import { fetchArtistTracks, fetchDiscoveryCharts, fetchPopularArtists, resolveDiscoveryTrack } from '../services/api';
import { RgbBorder } from './RgbBorder';
import { useScrollRestore } from '../hooks/useScrollRestore';

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

function formatCount(value?: string) {
  if (!value) return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return number.toLocaleString();
}

export function HomePage({ displayName, songs, player }: HomePageProps) {
  const greeting = getGreeting();
  const name = displayName?.trim();
  const heading = name ? `${greeting}, ${name}.` : `${greeting}.`;
  const scrollRef = useScrollRestore('home', true) as RefObject<HTMLDivElement>;
  const [artists, setArtists] = useState<DiscoveryArtist[]>([]);
  const [charts, setCharts] = useState<DiscoveryTrack[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<DiscoveryArtist | null>(null);
  const [artistTracks, setArtistTracks] = useState<DiscoveryTrack[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [artistError, setArtistError] = useState('');

  const loadDiscovery = async () => {
    setLoadingHome(true);
    setError('');
    const [artistResult, chartResult] = await Promise.allSettled([
      fetchPopularArtists(12),
      fetchDiscoveryCharts(12),
    ]);
    if (artistResult.status === 'fulfilled') setArtists(artistResult.value);
    else setArtists([]);
    if (chartResult.status === 'fulfilled') setCharts(chartResult.value);
    else setCharts([]);
    if (artistResult.status === 'rejected' && chartResult.status === 'rejected') {
      setError(artistResult.reason instanceof Error ? artistResult.reason.message : 'Could not load music discovery.');
    } else if (artistResult.status === 'rejected') {
      setError('Popular artists could not be loaded. The charts are still available.');
    } else if (chartResult.status === 'rejected') {
      setError('The chart could not be loaded. Popular artists are still available.');
    }
    setLoadingHome(false);
  };

  useEffect(() => { void loadDiscovery(); }, []);

  const openArtist = async (artist: DiscoveryArtist) => {
    setSelectedArtist(artist);
    setArtistTracks([]);
    setArtistError('');
    setLoadingArtist(true);
    try {
      setArtistTracks(await fetchArtistTracks(artist.name, 12));
    } catch (cause) {
      setArtistError(cause instanceof Error ? cause.message : 'Could not load this artist.');
    } finally {
      setLoadingArtist(false);
    }
  };

  const playDiscovery = async (track: DiscoveryTrack, queue: DiscoveryTrack[]) => {
    setPlayingTrackId(track.id);
    try {
      const resolved = await Promise.allSettled(
        queue.map(async (item) => {
          const videoId = item.videoId || await resolveDiscoveryTrack(item.artist, item.title);
          return { url: `https://www.youtube.com/watch?v=${videoId}`, title: item.title };
        })
      );
      const playable = resolved
        .filter((item): item is PromiseFulfilledResult<Song> => item.status === 'fulfilled')
        .map((item) => item.value);
      if (!playable.length) throw new Error('YouTube could not find playable videos for these tracks.');
      const selectedUrl = `https://www.youtube.com/watch?v=${track.videoId || ''}`;
      let selectedIndex = track.videoId ? playable.findIndex((item) => item.url === selectedUrl) : -1;
      if (selectedIndex < 0) {
        const resolvedCurrent = await resolveDiscoveryTrack(track.artist, track.title);
        const currentUrl = `https://www.youtube.com/watch?v=${resolvedCurrent}`;
        selectedIndex = playable.findIndex((item) => item.url === currentUrl);
        if (selectedIndex < 0) {
          playable.unshift({ url: currentUrl, title: track.title });
          selectedIndex = 0;
        }
      }
      player.playDiscoveryTracks(playable, selectedIndex);
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : 'Unable to play this track.');
    } finally {
      setPlayingTrackId(null);
    }
  };

  const libraryUrls = useMemo(() => new Set(songs.map((song) => song.url)), [songs]);

  const renderTrack = (track: DiscoveryTrack, queue: DiscoveryTrack[], index: number) => {
    const isCurrent = player.queue?.[player.currentIndex]?.title === track.title &&
      player.queue?.[player.currentIndex]?.url?.includes('youtube.com/watch');
    return (
      <div key={track.id} className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${isCurrent && player.isPlaying ? 'border-cyan-400/30 bg-cyan-400/[0.07]' : 'border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.06] hover:border-indigo-400/20'}`}>
        <span className="w-5 shrink-0 text-center text-[11px] font-mono text-slate-500">{index + 1}</span>
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <img src={track.artwork} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{track.title}</p>
          <p className="truncate text-xs text-slate-400">{track.artist}{track.album ? ` · ${track.album}` : ''}</p>
          {libraryUrls.has(track.url || '') && <span className="text-[10px] text-slate-500">In your library</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {track.duration && <span className="hidden text-[11px] font-mono text-slate-500 sm:inline">{track.duration}</span>}
          <button
            type="button"
            onClick={() => void playDiscovery(track, queue)}
            disabled={playingTrackId !== null}
            aria-label={`Play ${track.title}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-indigo-400/20 bg-indigo-500/15 text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-wait disabled:opacity-60"
          >
            {playingTrackId === track.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="flex h-full min-h-0 flex-col overflow-y-auto custom-scrollbar">
      <section className="relative px-6 pb-6 pt-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 left-1/4 h-48 w-72 rounded-full bg-blue-500/20 blur-[90px]" />
          <div className="absolute -top-10 right-1/4 h-40 w-64 rounded-full bg-indigo-500/20 blur-[90px]" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80"><Sparkles className="h-3.5 w-3.5" /> Your daily soundtrack</p>
            <h1 className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl lg:text-4xl">{heading}</h1>
            <p className="mt-1.5 text-sm text-slate-400">Explore what the world is listening to.</p>
          </div>
          <button type="button" onClick={() => void loadDiscovery()} disabled={loadingHome} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loadingHome ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        {error && <p role="status" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">{error}</p>}
      </section>

      <section className="px-6 pb-7 sm:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold tracking-tight">Popular Artists</h2>
          <span className="text-[10px] text-slate-500">Trending on Last.fm</span>
        </div>
        {loadingHome && artists.length === 0 ? (
          <div className="flex gap-4 overflow-hidden pb-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 w-32 shrink-0 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
        ) : artists.length ? (
          <div className="flex snap-x gap-4 overflow-x-auto px-1 pb-3 custom-scrollbar">
            {artists.map((artist) => (
              <button key={artist.id} type="button" onClick={() => void openArtist(artist)} className={`group w-32 shrink-0 snap-start rounded-2xl border p-2 text-left transition-all sm:w-36 ${selectedArtist?.id === artist.id ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/[0.06] bg-white/[0.025] hover:border-indigo-400/30 hover:bg-white/[0.06]'}`}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                  <img src={artist.image} alt={artist.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                  <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-white opacity-0 shadow-lg transition group-hover:opacity-100"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span>
                </div>
                <p className="mt-2 truncate text-xs font-semibold text-slate-100">{artist.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">{formatCount(artist.listeners) || 'Popular artist'}</p>
              </button>
            ))}
          </div>
        ) : !loadingHome ? <p className="py-5 text-xs text-slate-500">No artists returned by the discovery service.</p> : null}
      </section>

      {selectedArtist && (
        <section className="mx-6 mb-7 rounded-3xl border border-indigo-400/20 bg-indigo-500/[0.045] p-4 sm:mx-8 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <img src={selectedArtist.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Artist spotlight</p>
              <h3 className="truncate text-lg font-semibold">{selectedArtist.name}</h3>
              <p className="text-[11px] text-slate-400">{formatCount(selectedArtist.listeners) || 'Popular on Last.fm'}</p>
            </div>
            <button type="button" onClick={() => setSelectedArtist(null)} className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white">Close</button>
          </div>
          <div className="mb-3 flex items-center gap-2"><Music2 className="h-4 w-4 text-cyan-300" /><h4 className="text-sm font-semibold">Popular tracks</h4></div>
          {loadingArtist ? <div className="flex items-center gap-2 py-6 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading artist tracks…</div>
            : artistError ? <p role="alert" className="py-4 text-xs text-rose-300">{artistError}</p>
            : artistTracks.length ? <div className="grid gap-2 lg:grid-cols-2">{artistTracks.map((track, i) => renderTrack(track, artistTracks, i))}</div>
            : <p className="py-4 text-xs text-slate-500">No popular tracks were found for this artist.</p>}
        </section>
      )}

      <section className="px-6 pb-8 sm:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-300" />
          <h2 className="text-lg font-semibold tracking-tight">Global Top Tracks</h2>
          <span className="text-[10px] text-slate-500">Last.fm charts</span>
        </div>
        {loadingHome && charts.length === 0 ? <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
          : charts.length ? <div className="grid gap-3 sm:grid-cols-2">{charts.map((track, i) => renderTrack(track, charts, i))}</div>
          : <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-8 text-center text-xs text-slate-500"><Disc3 className="mx-auto mb-2 h-6 w-6 opacity-50" />No chart tracks available right now.</div>}
      </section>
      <footer className="px-6 pb-6 text-center text-[10px] text-slate-600 sm:px-8">Music discovery data provided by <a href="https://www.last.fm/" target="_blank" rel="noreferrer" className="text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-indigo-300">Last.fm</a>.</footer>
    </div>
  );
}
