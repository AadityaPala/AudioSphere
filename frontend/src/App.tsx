import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Plus, Trash2, LogOut, Music2 } from 'lucide-react';
import type { Song, PlaybackMode } from './types';
import { CAS_URL, fetchPlaylists, addSong, removeSong, fetchTrackMetadata } from './services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Replace with your Google Client ID

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('st-access-token'));
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<PlaybackMode>('sequential');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [loading, setLoading] = useState<boolean>(false);

  const [activeMeta, setActiveMeta] = useState<{ artist: string; artwork: string }>({
    artist: 'Select a track',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  });

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  // Initialize Google Login Button
  useEffect(() => {
    if (!token && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { theme: 'filled_black', size: 'large', shape: 'pill' }
      );
    }
  }, [token]);

  // Load YouTube Iframe API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  // Sync playlists when authenticated
  useEffect(() => {
    if (token) {
      loadSongs();
    }
  }, [token]);

  const initPlayer = () => {
    playerRef.current = new window.YT.Player('yt-hidden-player', {
      events: {
        onReady: () => playerRef.current?.setVolume(volume),
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  const handleGoogleSignIn = async (response: any) => {
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
  };

  const handleSignOut = () => {
    localStorage.removeItem('st-access-token');
    setToken(null);
    setSongs([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
  };

  const loadSongs = async () => {
    try {
      const data = await fetchPlaylists();
      setSongs(data);
    } catch {
      handleSignOut();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setLoading(true);
    await addSong(inputUrl);
    setInputUrl('');
    setLoading(false);
    loadSongs();
  };

  const handleRemove = async (url: string) => {
    await removeSong(url);
    loadSongs();
  };

  const playSong = async (index: number) => {
    if (!songs[index]) return;
    setCurrentIndex(index);
    const target = songs[index];
    const match = target.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    const videoId = match?.[2];

    if (videoId && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      setIsPlaying(true);
      const meta = await fetchTrackMetadata(target.title);
      setActiveMeta(meta);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (currentIndex === -1 && songs.length > 0) return playSong(0);
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const nextSong = () => {
    if (songs.length === 0) return;
    const nextIdx = mode === 'sequential' 
      ? (currentIndex + 1) % songs.length 
      : Math.floor(Math.random() * songs.length);
    playSong(nextIdx);
  };

  const prevSong = () => {
    if (songs.length === 0) return;
    const prevIdx = (currentIndex - 1 + songs.length) % songs.length;
    playSong(prevIdx);
  };

  const handlePlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setDuration(playerRef.current.getDuration());
      clearInterval(progressInterval.current);
      progressInterval.current = setInterval(() => {
        setCurrentTime(playerRef.current?.getCurrentTime() || 0);
      }, 500);
    } else {
      clearInterval(progressInterval.current);
      if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
      if (event.data === window.YT.PlayerState.ENDED) nextSong();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative h-screen w-screen flex bg-linear-to-tr from-slate-950 via-indigo-950 to-slate-900 text-slate-100 overflow-hidden font-sans">
      <div id="yt-hidden-player" className="absolute left-[9999px] top-[9999px] opacity-0 pointer-events-none" />

      {/* Dynamic Background Glow based on current artwork */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 transition-all duration-1000 scale-125"
        style={{ backgroundImage: `url(${activeMeta.artwork})` }}
      />

      {/* LOGIN OVERLAY */}
      {!token ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl">
          <div className="p-10 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center max-w-sm w-full text-center">
            <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30">
              <Music2 className="w-10 h-10 animate-bounce" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Audio<span className="text-indigo-400">Sphere</span></h1>
            <p className="text-xs text-slate-400 mb-8">Sign in with CentralAuth to load your playlists</p>
            <div id="google-btn-container" className="min-h-11" />
          </div>
        </div>
      ) : null}

      {/* MAIN CONTAINER */}
      <div className="relative z-10 flex w-full h-full p-6 gap-6">
        
        {/* SIDEBAR PLAYLIST */}
        <aside className="w-96 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <h2 className="font-semibold tracking-wide text-sm">Your Library</h2>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Paste YouTube link..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition"
            />
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <ul className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1">
            {songs.map((song, i) => (
              <li
                key={i}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition ${
                  currentIndex === i ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200' : 'bg-white/2 border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300'
                }`}
                onClick={() => playSong(i)}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                  <span className="text-xs font-medium truncate">{song.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(song.url); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* PLAYER VIEW */}
        <main className="flex-1 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            
            {/* Dynamic Album/Artist Artwork */}
            <div className="relative group w-64 h-64 mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <img
                src={activeMeta.artwork}
                alt="Artwork"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">{activeMeta.artist}</span>
              </div>
            </div>

            {/* Song Title */}
            <h2 className="text-xl font-bold text-center truncate w-full mb-1">
              {currentIndex !== -1 && songs[currentIndex] ? songs[currentIndex].title : 'No track selected'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">{activeMeta.artist}</p>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-3 mb-6">
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  playerRef.current?.seekTo(val, true);
                  setCurrentTime(val);
                }}
                className="flex-1 h-1.5 cursor-pointer accent-indigo-500"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between w-full px-4">
              <button
                onClick={() => setMode(m => m === 'sequential' ? 'shuffle' : 'sequential')}
                className={`p-2.5 rounded-full border transition ${mode === 'shuffle' ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <button onClick={prevSong} className="p-3 text-slate-300 hover:text-white transition">
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </button>
                <button onClick={nextSong} className="p-3 text-slate-300 hover:text-white transition">
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
              </div>

              <button
                onClick={() => setMode('sequential')}
                className={`p-2.5 rounded-full border transition ${mode === 'sequential' ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-white'}`}
                title="Sequential"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Volume control floating bottom-right */}
          <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setVolume(val);
                playerRef.current?.setVolume(val);
              }}
              className="w-20 h-1 cursor-pointer accent-indigo-500"
            />
          </div>
        </main>
      </div>
    </div>
  );
}