import { useState, useEffect } from 'react';
import { AuthOverlay } from './components/AuthOverlay';
import { Sidebar } from './components/Sidebar';
import { PlayerView } from './components/PlayerView';
import { InfoPanel } from './components/InfoPanel';
import { usePlayer } from './hooks/usePlayer';
import { CAS_URL, fetchPlaylists, addSong, removeSong } from './services/api';
import type { Song, Recommendation } from './types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: '1', title: 'As It Was', artist: 'Harry Styles', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80' },
  { id: '4', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
];

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('st-access-token'));
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const player = usePlayer(songs);

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
      handleSignOut();
    }
  };

  useEffect(() => {
    if (token) loadSongs();
  }, [token]);

  const handleSignOut = () => {
    localStorage.removeItem('st-access-token');
    setToken(null);
    setSongs([]);
  };

  const handleAdd = async (url: string) => {
    setLoading(true);
    await addSong(url);
    await loadSongs();
    setLoading(false);
  };

  const handleRemove = async (url: string) => {
    await removeSong(url);
    await loadSongs();
  };

  return (
    <div className="relative h-screen w-screen flex flex-col bg-[#070711] text-slate-100 overflow-hidden font-sans">
      <div id="yt-hidden-player" className="absolute left-[9999px] top-[9999px] opacity-0 pointer-events-none" />

      {/* Ambient animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full bg-indigo-600/25 blur-[120px] animate-aurora" />
        <div className="absolute top-1/3 -right-40 h-[55vh] w-[55vh] rounded-full bg-fuchsia-600/20 blur-[120px] animate-aurora-slow" />
        <div className="absolute -bottom-40 left-1/4 h-[50vh] w-[50vh] rounded-full bg-cyan-500/20 blur-[120px] animate-aurora" />
        <div
          className="absolute inset-0 opacity-25 transition-all duration-1000"
          style={{ backgroundImage: `url(${player.meta.artwork})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(90px) saturate(1.2)' }}
        />
      </div>

      <AuthOverlay token={token} />

      {/* Unified Flexbox layout — no JS resize listeners */}
      <div className="flex flex-1 min-h-0 w-full gap-3 p-3 lg:p-4">
        {/* Left: Navigation Sidebar */}
        <Sidebar
          songs={songs}
          handleAdd={handleAdd}
          handleRemove={handleRemove}
          handleSignOut={handleSignOut}
          loading={loading}
          recommendations={MOCK_RECOMMENDATIONS}
        />

        {/* Center: Player / playlist view */}
        <PlayerView player={player} onOpenInfo={() => setDrawerOpen(true)} />

        {/* Right: unified Recommendations + Lyrics panel (desktop) */}
        <InfoPanel
          player={player}
          recommendations={MOCK_RECOMMENDATIONS}
          className="hidden xl:flex"
        />
      </div>

      {/* Mobile slide-out drawer for Recommendations + Lyrics */}
      <div
        className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-md p-3 transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <InfoPanel
            player={player}
            recommendations={MOCK_RECOMMENDATIONS}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
