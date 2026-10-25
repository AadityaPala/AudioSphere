import { Sparkles, Play, X, Music2, Loader2, Mic2, Disc3, Calendar } from 'lucide-react';
import type { Recommendation } from '../types';

interface InfoPanelProps {
  player: any;
  recommendations: Recommendation[];
  className?: string;
  onClose?: () => void;
}

export function InfoPanel({ player, recommendations, className = '', onClose }: InfoPanelProps) {
  const { meta, enriched, enriching, currentIndex, queue } = player;
  const hasTrack = currentIndex !== -1 && queue[currentIndex];

  return (
    <aside
      className={`flex flex-col w-full xl:w-full shrink-0 h-full bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-indigo-300 shrink-0" />
          <h2 className="font-semibold tracking-wide text-sm truncate whitespace-nowrap">Discover</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="xl:hidden grid place-items-center w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 transition-all duration-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {/* Now Playing / Lyrics */}
        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3 whitespace-nowrap">
            <Mic2 className="w-3.5 h-3.5" /> Now Playing
          </h3>

          {!hasTrack ? (
            <div className="flex flex-col items-center justify-center text-center py-10 text-slate-500">
              <Music2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Select a track to see lyrics & details.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={enriched?.albumArtUrl || meta.artwork}
                  alt="Album art"
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/15 shrink-0 transition-transform duration-300"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate whitespace-nowrap">{queue[currentIndex].title}</p>
                  <p className="text-[11px] text-slate-400 truncate whitespace-nowrap">{enriched?.artist || meta.artist}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {enriched?.genre && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-400/20 whitespace-nowrap transition-all duration-300">
                        <Disc3 className="w-3 h-3" /> {enriched.genre}
                      </span>
                    )}
                    {enriched?.releaseYear && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap transition-all duration-300">
                        <Calendar className="w-3 h-3" /> {enriched.releaseYear}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lyrics — scrollable glass container */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 shadow-inner transition-all duration-300">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 whitespace-nowrap">
                  Lyrics
                  {enriching && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                {enriching ? (
                  <p className="text-xs text-slate-500 italic">Fetching lyrics...</p>
                ) : enriched?.lyrics ? (
                  <div className="max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">
                      {enriched.lyrics}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No lyrics available for this track.</p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" /> Recommended
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec) => (
              <li
                key={rec.id}
                className="group flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={rec.artwork}
                    alt={rec.title}
                    className="w-10 h-10 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate whitespace-nowrap group-hover:text-indigo-300 transition-colors duration-300">{rec.title}</p>
                    <p className="text-[10px] text-slate-400 truncate whitespace-nowrap">{rec.artist}</p>
                  </div>
                </div>
                <button className="shrink-0 grid place-items-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 opacity-0 group-hover:opacity-100 hover:bg-indigo-500 hover:text-white transition-all duration-300">
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
