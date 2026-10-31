import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface ProfileDropdownProps {
  displayName: string | null;
  onLogout: () => void;
}

export function ProfileDropdown({ displayName, onLogout }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-all duration-300"
      >
        <UserAvatar name={displayName} size={22} />
        {displayName && (
          <span className="text-[11px] font-medium text-slate-200 max-w-[100px] truncate hidden sm:block">{displayName}</span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0a0a1a]/90 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-[100]"
          style={{ animation: 'modal-in 0.2s cubic-bezier(0.22,1,0.36,1)' }}
        >
          {/* User info header */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-white/10 mb-1">
            <UserAvatar name={displayName} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{displayName || 'Guest'}</p>
              <p className="text-[10px] text-slate-500">AudioSphere Account</p>
            </div>
          </div>

          {/* Logout option */}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-slate-300 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-medium">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
