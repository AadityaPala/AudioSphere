import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { fetchTrackMetadata } from '../services/api';

const FALLBACK = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';

const cache = new Map<string, string>();

interface TrackThumbnailProps {
  title: string;
  className?: string;
}

export function TrackThumbnail({ title, className = '' }: TrackThumbnailProps) {
  const [artwork, setArtwork] = useState<string | null>(cache.get(title) ?? null);
  const [loaded, setLoaded] = useState<boolean>(!!cache.get(title));

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(title);
    if (cached) {
      setArtwork(cached);
      setLoaded(true);
      return;
    }
    setArtwork(null);
    setLoaded(false);
    fetchTrackMetadata(title)
      .then((meta) => {
        if (cancelled) return;
        cache.set(title, meta.artwork);
        setArtwork(meta.artwork);
      })
      .catch(() => {
        if (cancelled) return;
        cache.set(title, FALLBACK);
        setArtwork(FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, [title]);

  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-black/30 border border-white/10 shrink-0 ${className}`}
    >
      {!artwork && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}
      {artwork && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}
      {artwork ? (
        <img
          src={artwork}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            cache.set(title, FALLBACK);
            setArtwork(FALLBACK);
            setLoaded(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <Music className="w-4 h-4 text-slate-500" />
      )}
    </div>
  );
}
