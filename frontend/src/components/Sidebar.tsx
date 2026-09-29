import React, { useState } from 'react';
import { Plus, Trash2, LogOut, Menu, X, Sparkles, Music, Play } from 'lucide-react';
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
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-indigo-600 rounded-full shadow-2xl text-white">
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside className={`fixed lg:relative top-0 left-0 h-full w-80 lg:w-96 flex flex-col bg-slate-900/95 lg:bg-white/5 backdrop-blur-2xl lg:backdrop-blur-xl border-r border-white/10 lg:rounded-3xl p-5 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mt-12 lg:mt-0">
          <div className="flex items-center gap-2 bg-black/30 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('library')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Music className="w-3.5 h-3.5" /> Playlists
            </button>
            <button 
              onClick={() => setActiveTab('trending')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'trending' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Trending
            </button>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content 1: User Library */}
        {activeTab === 'library' ? (
          <div className="flex flex-col flex-1 overflow-hidden mt-4">
            <form onSubmit={submit} className="flex gap-2 mb-3">
              <input type="text" placeholder="Paste YouTube link..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition" />
              <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <ul className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {songs.map((song, i) => (
                <li key={i} className="group flex items-center justify-between p-3 rounded-2xl border transition bg-white/2 border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                    <span className="text-xs font-medium truncate">{song.title}</span>
                  </div>
                  <button onClick={() => handleRemove(song.url)} className="opacity-100 lg:opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Tab Content 2: Trending & Recommendations */
          <div className="flex flex-col flex-1 overflow-hidden mt-4">
            <p className="text-[11px] text-slate-400 mb-2">Recommended tracks for you:</p>
            <ul className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {recommendations.map((rec) => (
                <li key={rec.id} className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/2 border border-transparent hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 truncate">
                    <img src={rec.artwork} alt={rec.title} className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">{rec.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{rec.artist}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 hover:text-white">
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity" onClick={() => setIsOpen(false)} />}
    </>
  );
}