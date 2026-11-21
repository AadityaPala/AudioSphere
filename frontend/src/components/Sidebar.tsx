import React, { useRef, useState } from 'react';
import { Plus, Trash2, Menu, X, Music, Library } from 'lucide-react';
import type { Song, Recommendation } from '../types';
import { TrackThumbnail } from './TrackThumbnail';
import { UserAvatar } from './UserAvatar';
import { RgbBorder } from './RgbBorder';
import { useScrollRestore } from '../hooks/useScrollRestore';

interface SidebarProps {
  songs: Song[];
  queueMode?: 'sequential' | 'shuffle';
  handleAdd: (url: string) => Promise<void>;
  handleRemove: (url: string) => void;
  handlePlay: (url: string) => void;
  loading: boolean;
  displayName?: string | null;
  currentTrackUrl?: string | null;
  isPlaying?: boolean;
  className?: string;
  recommendations?: Recommendation[];
  recommendationsLoading?: boolean;
  onRefreshRecommendations?: () => void;
}

export function Sidebar({ songs, queueMode = 'sequential', handleAdd, handleRemove, handlePlay, loading, displayName = null, currentTrackUrl = null, isPlaying = false, className = '', recommendations = [], recommendationsLoading = false, onRefreshRecommendations }: SidebarProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'recommendations'>('library');
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useScrollRestore('library', songs.length >= 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    await handleAdd(inputUrl);
    setInputUrl('');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 grid place-items-center w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-2xl text-white active:scale-90 transition-all duration-300"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative top-0 left-0 z-40 h-full w-80 lg:w-full shrink-0 flex flex-col bg-black/30 lg:bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] lg:rounded-3xl p-4 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        {/* Brand + Avatar */}
        <div className="flex items-center justify-between pl-12 lg:pl-0 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 shrink-0">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight truncate whitespace-nowrap">
              Audio<span className="text-indigo-300">Sphere</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-1.5 py-1 rounded-full bg-white/[0.06] border border-white/10">
              <UserAvatar name={displayName} size={24} />
            </div>
          </div>
        </div>

        <div className="mt-4 mb-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1 shrink-0">
          <button type="button" onClick={() => setActiveTab('library')} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all ${activeTab === 'library' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/30' : 'text-slate-400 hover:text-white'}`}><Library className="w-3.5 h-3.5" /> Your Library</button>
          <button type="button" onClick={() => setActiveTab('recommendations')} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all ${activeTab === 'recommendations' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/30' : 'text-slate-400 hover:text-white'}`}><Music className="w-3.5 h-3.5" /> Recommendations</button>
        </div>
        {activeTab === 'library' ? (
          <>
        {/* Add song form */}
        <form onSubmit={submit} className="flex gap-2 mb-3 shrink-0">
          <input
            type="text"
            placeholder="Paste YouTube link..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-black/40 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition-all duration-300 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Song list */}
        <ul
          ref={scrollRef as React.RefObject<HTMLUListElement>}
          className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar"
        >
          {songs.length === 0 && (
            <li className="text-[11px] text-slate-500 text-center py-8">No songs yet. Add a YouTube link above.</li>
          )}
          {songs.map((song, i) => {
            const isCurrent = currentTrackUrl === song.url;
            const content = (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Play ${song.title}`}
                  onClick={() => handlePlay(song.url)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlay(song.url); } }}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
                >
                  <span className="text-[11px] font-mono text-slate-500 w-4 shrink-0 whitespace-nowrap">{i + 1}</span>
                  <TrackThumbnail title={song.title} className="w-10 h-10 rounded-xl shadow-md" />
                  <span className="text-xs font-medium text-slate-200 truncate whitespace-nowrap min-w-0">{song.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(song.url)}
                  className="shrink-0 p-1.5 text-slate-500 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all duration-300 opacity-100 lg:opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            );
            return (
              <li
                key={song.url}
                className="group list-none"
              >
                {isCurrent ? (
                  <RgbBorder trackId={song.url} isPlaying={isPlaying} isBuffering={false} className="rounded-2xl">
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl border border-transparent bg-white/10 transition-all duration-300">
                      {content}
                    </div>
                  </RgbBorder>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl border border-white/5 bg-white/[0.04] hover:bg-white/10 hover:border-white/15 transition-all duration-300">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
          </>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{recommendations.length} picks for you</span>
              <button type="button" onClick={onRefreshRecommendations} disabled={recommendationsLoading || !onRefreshRecommendations} className="text-[10px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-300 hover:bg-indigo-500/20 disabled:opacity-50">{recommendationsLoading ? 'Refreshing…' : 'Refresh'}</button>
            </div>
            <audio ref={previewRef} className="hidden" />
            <ul className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {recommendationsLoading && <li className="py-8 text-center text-xs text-slate-400">Finding music for you…</li>}
              {!recommendationsLoading && recommendations.length === 0 && <li className="py-8 text-center text-xs text-slate-500">Add tracks to your library to discover music.</li>}
              {recommendations.map((rec) => <li key={rec.id} className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] p-2.5">
                {rec.artwork ? <img src={rec.artwork} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" /> : <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />}
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-100">{rec.title}</p><p className="truncate text-[10px] text-slate-400">{rec.artist}</p><p className="truncate text-[9px] text-indigo-300/80">{rec.reason}</p></div>
                {rec.previewUrl && <button type="button" title="Play preview" aria-label={`Play preview of ${rec.title}`} onClick={() => { const audio = previewRef.current; if (audio) { audio.pause(); audio.src = rec.previewUrl!; void audio.play().catch((error) => console.warn('Preview playback failed:', error)); } }} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500 hover:text-white"><Music className="h-3.5 w-3.5" /></button>}
              </li>)}
            </ul>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
