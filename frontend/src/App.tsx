import { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Home as HomeIcon, Disc3 } from 'lucide-react';
import { AuthOverlay } from './components/AuthOverlay';
import { Sidebar } from './components/Sidebar';
import { PlayerView } from './components/PlayerView';
import { InfoPanel } from './components/InfoPanel';
import { LogoutModal } from './components/LogoutModal';
import { HomePage } from './components/HomePage';
import { OnboardingModal } from './components/OnboardingModal';
import { usePlayer } from './hooks/usePlayer';
import { useOnboarding } from './hooks/useOnboarding';
import { CAS_URL, fetchPlaylists, addSong, removeSong } from './services/api';
import type { Song, Recommendation } from './types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: '1', title: 'As It Was', artist: 'Harry Styles', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80' },
  { id: '4', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
];

type View = 'home' | 'player';

function HSeparator() {
  return (
    <Separator className="group flex items-center justify-center w-1.5 mx-0.5 transition-all duration-300">
      <div className="w-1 h-10 rounded-full bg-white/10 group-hover:bg-indigo-400/70 transition-all duration-300" />
    </Separator>
  );
}

function VSeparator() {
  return (
    <Separator className="group flex items-center justify-center h-1.5 my-0.5 transition-all duration-300">
      <div className="h-1 w-10 rounded-full bg-white/10 group-hover:bg-indigo-400/70 transition-all duration-300" />
    </Separator>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('st-access-token'));
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [view, setView] = useState<View>('player');

  const player = usePlayer(songs);
  const onboarding = useOnboarding(token);

  useEffect(() => {
    if (!token && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            const res = await fetch(`${CAS_URL}/auth/custom/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential }),
            });
            const stToken = res.headers.get('st-access-token');
            if (stToken) {
              localStorage.setItem('st-access-token', stToken);
              setToken(stToken);
            }
          } catch (err) {
            console.error("CAS Login failed", err);
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { theme: 'filled_black', size: 'large', shape: 'pill' }
      );
    }
  }, [token]);

  const loadSongs = async () => {
    try {
      const data = await fetchPlaylists();
      setSongs(data);
    } catch (error) {
      console.error(error);
      doSignOut();
    }
  };

  useEffect(() => {
    if (token) loadSongs();
  }, [token]);

  const doSignOut = () => {
    localStorage.removeItem('st-access-token');
    setToken(null);
    setSongs([]);
    setView('player');
  };

  const handleSignOutRequest = () => setLogoutOpen(true);

  const handleAdd = async (url: string) => {
    setLoading(true);
    try {
      await addSong(url);
      await loadSongs();
    } catch (error) {
      console.error('Failed to add track:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to add track.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (url: string) => {
    try {
      await removeSong(url);
      await loadSongs();
    } catch (error) {
      console.error('Failed to remove track:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to remove track.');
    }
  };

  const handlePlayTrack = (url: string) => {
    const index = player.queue.findIndex((song) => song.url === url);
    if (index >= 0) player.playSong(index);
  };

  const showOnboarding = !!token && onboarding.loaded && onboarding.needsOnboarding;

  return (
    <div className="relative h-screen w-screen flex flex-col bg-[#06060f] text-slate-100 overflow-hidden font-sans">
      <div id="yt-hidden-player" className="absolute left-[9999px] top-[9999px] opacity-0 pointer-events-none" />

      {/* Deep, colorful ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[65vh] w-[65vh] rounded-full bg-blue-600/25 blur-[130px] animate-aurora" />
        <div className="absolute top-1/4 -right-40 h-[60vh] w-[60vh] rounded-full bg-indigo-600/20 blur-[130px] animate-aurora-slow" />
        <div className="absolute -bottom-40 left-1/4 h-[55vh] w-[55vh] rounded-full bg-cyan-500/20 blur-[130px] animate-aurora" />
        <div className="absolute top-1/2 left-1/2 h-[45vh] w-[45vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[130px] animate-aurora-slow" />
        <div
          className="absolute inset-0 opacity-20 transition-all duration-1000"
          style={{ backgroundImage: `url(${player.meta.artwork})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(100px) saturate(1.4)' }}
        />
      </div>

      <AuthOverlay token={token} />

      {token && (
        <div className="flex items-center gap-1.5 px-3 pt-3 xl:px-4 xl:pt-4">
          <button
            onClick={() => setView('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 ${
              view === 'home'
                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100'
                : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" /> Home
          </button>
          <button
            onClick={() => setView('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 ${
              view === 'player'
                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100'
                : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" /> Now Playing
          </button>
        </div>
      )}

      {view === 'home' && token && (
        <div className="flex-1 min-h-0 w-full p-3 xl:p-4 xl:pt-3">
          <div className="h-full w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <HomePage displayName={onboarding.displayName} songs={songs} player={player} />
          </div>
        </div>
      )}

      {view === 'player' && (
        <>
          {/* Desktop resizable layout */}
          <div className="hidden xl:flex flex-1 min-h-0 w-full p-3 lg:p-4 xl:pt-3">
            <Group orientation="horizontal" className="flex w-full h-full gap-2">
              <Panel id="sidebar" defaultSize="22%" minSize="16%" maxSize="32%">
                <Sidebar
                  songs={songs}
                  handleAdd={handleAdd}
                  handleRemove={handleRemove}
                  handlePlay={handlePlayTrack}
                  handleSignOut={handleSignOutRequest}
                  loading={loading}
                  className="h-full"
                />
              </Panel>
              <HSeparator />

              <Panel id="center" minSize="30%">
                <Group orientation="vertical" className="flex w-full h-full gap-2">
                  <Panel id="player" defaultSize="52%" minSize="28%" maxSize="80%">
                    <PlayerView player={player} onOpenInfo={() => setDrawerOpen(true)} className="h-full" />
                  </Panel>
                  <VSeparator />
                  <Panel id="queue" minSize="15%">
                    <PlayerView.Queue player={player} className="h-full" />
                  </Panel>
                </Group>
              </Panel>

              <HSeparator />
              <Panel id="info" defaultSize="24%" minSize="16%" maxSize="36%">
                <InfoPanel player={player} recommendations={MOCK_RECOMMENDATIONS} className="h-full" />
              </Panel>
            </Group>
          </div>

          {/* Mobile / tablet layout: stacked flex, drawer for info */}
          <div className="xl:hidden flex flex-1 min-h-0 w-full gap-3 p-3 xl:pt-3">
            <Sidebar
              songs={songs}
              handleAdd={handleAdd}
              handleRemove={handleRemove}
              handlePlay={handlePlayTrack}
              handleSignOut={handleSignOutRequest}
              loading={loading}
            />
            <PlayerView player={player} onOpenInfo={() => setDrawerOpen(true)} />
          </div>

          {/* Mobile slide-out drawer for Discover panel */}
          <div
            className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <div className={`absolute top-0 right-0 h-full w-full max-w-md p-3 transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <InfoPanel player={player} recommendations={MOCK_RECOMMENDATIONS} onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        </>
      )}

      <LogoutModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          doSignOut();
        }}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={onboarding.completeOnboarding}
        maxNameLength={onboarding.maxNameLength}
      />
    </div>
  );
}
