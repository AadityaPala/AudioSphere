import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';

interface AuthOverlayProps {
  token: string | null;
}

export function AuthOverlay({ token }: AuthOverlayProps) {
  const [isVisible, setIsVisible] = useState(!token);

  useEffect(() => {
    if (token) {
      const t = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(t);
    }
    setIsVisible(true);
  }, [token]);

  if (!isVisible) return null;

  return (
    <div
      className={`absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-3xl transition-opacity duration-500 ease-in-out overflow-hidden ${
        token ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Interactive particle background — login page only */}
      <ParticleBackground />

      {/* Ambient gradient glow behind the login card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[50vh] w-[50vh] rounded-full bg-blue-600/20 blur-[120px] animate-aurora" />
        <div className="absolute bottom-0 right-1/4 h-[45vh] w-[45vh] rounded-full bg-indigo-600/20 blur-[120px] animate-aurora-slow" />
      </div>

      <div className="relative z-10 p-10 rounded-3xl bg-white/10 border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col items-center max-w-sm w-full text-center">
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 mb-5">
          <Music2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Audio<span className="text-indigo-300">Sphere</span>
        </h1>
        <p className="text-xs text-slate-400 mb-8">Sign in with CentralAuth to load your playlists</p>
        <div id="google-btn-container" className="min-h-11 relative z-10" />
      </div>
    </div>
  );
}
