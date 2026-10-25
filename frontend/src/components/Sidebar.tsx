import React, { useState } from 'react';
import { Plus, Trash2, LogOut, Menu, X, Sparkles, Music, Play, Library } from 'lucide-react';
import type { Song, Recommendation } from '../types';

interface SidebarProps {
  songs: Song[];
  handleAdd: (url: string) => Promise<void>;
  handleRemove: (url: string) => void;
  handleSignOut: () => void;
  loading: boolean;
  recommendations: Recommendation[];
}

export function Sidebar({ songs, handleAdd, handleRemove, handleSignOut, loading, recommendations }: SidebarProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'trending'>('library');

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
        className="lg:hidden fixed top-3 left-3 z-50 grid place-items-center w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl text-white active:scale-90 transition-transform"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative top-0 left-0 z-40 h-full w-80 lg:w-[320px] xl:w-[300px] shrink-0 flex flex-col bg-white/10 lg:bg-white/10 backdrop-blur-2xl border border-white/15 lg:rounded-3xl p-4 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand + Sign out */}
        <div className="flex items-center justify-between pl-12 lg:pl-0 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Audio<span className="text-indigo-300">Sphere</span>
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl text-slate-300 hover:text-red-300 hover:bg-white/5 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-2xl border border-white/10 mt-4">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" /> Library
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Trending
          </button>
        </div>

        {activeTab === 'library' ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
            <form onSubmit={submit} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Paste YouTube link..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-black/40 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="grid place-items-center w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition-transform disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <ul className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {songs.length === 0 && (
                <li className="text-[11px] text-slate-500 text-center py-8">Your library is empty. Add a link above.</li>
              )}
              {songs.map((song, i) => (
                <li
                  key={i}
                  className="group flex items-center justify-between gap-2 p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-slate-500 w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs font-medium text-slate-200 truncate">{song.title}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(song.url)}
                    className="shrink-0 p-1.5 text-slate-500 hover:text-red-300 hover:bg-white/5 rounded-lg transition opacity-100 lg:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden mt-4">
            <p className="text-[11px] text-slate-400 mb-2">Recommended tracks for you:</p>
            <ul className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {recommendations.map((rec) => (
                <li
                  key={rec.id}
                  className="group flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={rec.artwork}
                      alt={rec.title}
                      className="w-10 h-10 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">{rec.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{rec.artist}</p>
                    </div>
                  </div>
                  <button className="shrink-0 grid place-items-center w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 opacity-0 group-hover:opacity-100 hover:bg-indigo-500 hover:text-white transition">
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </li>
              ))}
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
