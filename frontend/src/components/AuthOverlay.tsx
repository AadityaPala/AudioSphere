import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';

interface AuthOverlayProps {
  token: string | null;
}

export function AuthOverlay({ token }: AuthOverlayProps) {
  const [isVisible, setIsVisible] = useState(!token);

  useEffect(() => {
    if (token) {
      setTimeout(() => setIsVisible(false), 500); // Allow fade-out animation to finish
    } else {
      setIsVisible(true);
    }
  }, [token]);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl transition-opacity duration-500 ease-in-out ${token ? 'opacity-0' : 'opacity-100'}`}>
      <div className="p-10 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center max-w-sm w-full text-center transform transition-transform duration-500 translate-y-0">
        <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-4 border border-indigo-500/30">
          <Music2 className="w-10 h-10 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Audio<span className="text-indigo-400">Sphere</span></h1>
        <p className="text-xs text-slate-400 mb-8">Sign in with CentralAuth to load your playlists</p>
        <div id="google-btn-container" className="min-h-11 transition-all" />
      </div>
    </div>
  );
}