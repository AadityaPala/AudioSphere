import { Sparkles, Play } from 'lucide-react';
import type { Recommendation } from '../types';

const TRENDING_RECOMMENDATIONS: Recommendation[] = [
  { id: '1', title: 'As It Was', artist: 'Harry Styles', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80' },
  { id: '4', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
];

export function RecommendationSidebar() {
  return (
    <aside className="w-full lg:w-80 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl h-full overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        <h2 className="font-semibold tracking-wide text-sm">Trending & Recommended</h2>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1 custom-scrollbar">
        {TRENDING_RECOMMENDATIONS.map((rec) => (
          <div key={rec.id} className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/2 border border-transparent hover:bg-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-3 truncate">
              <img src={rec.artwork} alt={rec.title} className="w-10 h-10 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" />
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{rec.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{rec.artist}</p>
              </div>
            </div>
            <button className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white">
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}