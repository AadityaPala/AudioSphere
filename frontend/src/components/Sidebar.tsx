import React, { useState } from 'react';
import { Plus, Trash2, LogOut, Menu, X } from 'lucide-react';
import type { Song } from '../types';

interface SidebarProps {
  songs: Song[];
  handleAdd: (url: string) => Promise<void>;
  handleRemove: (url: string) => void;
  handleSignOut: () => void;
  loading: boolean;
}

export function Sidebar({ songs, handleAdd, handleRemove, handleSignOut, loading }: SidebarProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false); // For mobile drawer

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    await handleAdd(inputUrl);
    setInputUrl('');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed top-6 left-6 z-50 p-2 bg-indigo-600 rounded-full shadow-xl">
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Sidebar Container */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-80 md:w-96 flex flex-col bg-slate-900/95 md:bg-white/5 backdrop-blur-2xl md:backdrop-blur-xl border-r border-white/10 md:rounded-3xl p-5 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mt-12 md:mt-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <h2 className="font-semibold tracking-wide text-sm">Your Library</h2>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input type="text" placeholder="Paste YouTube link..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition" />
          <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <ul className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1 custom-scrollbar">
          {songs.map((song, i) => (
            <li key={i} className="group flex items-center justify-between p-3 rounded-2xl border transition bg-white/2 border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300">
              <div className="flex items-center gap-3 truncate">
                <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                <span className="text-xs font-medium truncate">{song.title}</span>
              </div>
              <button onClick={() => handleRemove(song.url)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      
      {/* Mobile Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity" onClick={() => setIsOpen(false)} />}
    </>
  );
}