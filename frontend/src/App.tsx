import { useState, useEffect } from 'react';
import { AuthOverlay } from './components/AuthOverlay';
import { Sidebar } from './components/Sidebar';
import { PlayerView } from './components/PlayerView';
import { usePlayer } from './hooks/usePlayer';
import { CAS_URL, fetchPlaylists, addSong, removeSong } from './services/api';
import type { Song } from './types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('st-access-token'));
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  
  const player = usePlayer(songs);

  // Initialize Google Login Button
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
    <div className="relative h-screen w-screen flex flex-col md:flex-row bg-linear-to-tr from-slate-950 via-indigo-950 to-slate-900 text-slate-100 overflow-hidden font-sans">
      <div id="yt-hidden-player" className="absolute left-[9999px] top-[9999px] opacity-0 pointer-events-none" />

      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 transition-all duration-1000 scale-125"
        style={{ backgroundImage: `url(${player.meta.artwork})` }}
      />

      <AuthOverlay token={token} />

      {/* Main Layout Shell */}
      <div className="relative z-10 flex w-full h-full md:p-6 gap-6">
        <Sidebar 
          songs={songs} 
          handleAdd={handleAdd} 
          handleRemove={handleRemove} 
          handleSignOut={handleSignOut} 
          loading={loading} 
        />
        <PlayerView player={player} />
      </div>
    </div>
  );
}