import { useState, useEffect } from 'react';
import { AuthOverlay } from './components/AuthOverlay';
import { Sidebar } from './components/Sidebar';
import { PlayerView } from './components/PlayerView';
import { RecommendationSidebar } from './components/RecommendationSidebar';
import { ResizableLayout } from './components/ResizableLayout';
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
    <div className="relative h-screen w-screen flex flex-col bg-linear-to-tr from-slate-950 via-indigo-950 to-slate-900 text-slate-100 overflow-hidden font-sans">
      <div id="yt-hidden-player" className="absolute left-[9999px] top-[9999px] opacity-0 pointer-events-none" />

      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 transition-all duration-1000 scale-125"
        style={{ backgroundImage: `url(${player.meta.artwork})` }}
      />

      <AuthOverlay token={token} />

      {/* Desktop Resizable Layout Wrapper */}
      <ResizableLayout>
        <Sidebar songs={songs} handleAdd={handleAdd} handleRemove={handleRemove} handleSignOut={handleSignOut} loading={loading} recommendations={MOCK_RECOMMENDATIONS} />
        <PlayerView player={player} />
        <RecommendationSidebar />
      </ResizableLayout>

      {/* Mobile Fallback Layout (Non-resizable stack with drawer support) */}
      <div className="lg:hidden relative z-10 flex flex-col w-full h-full p-4 overflow-hidden">
        <Sidebar songs={songs} handleAdd={handleAdd} handleRemove={handleRemove} handleSignOut={handleSignOut} loading={loading} recommendations={MOCK_RECOMMENDATIONS} />
        <PlayerView player={player} />
      </div>
    </div>
  );
}