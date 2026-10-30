import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Music2, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (name: string) => void;
  maxNameLength: number;
}

export function OnboardingModal({ open, onComplete, maxNameLength }: OnboardingModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [exiting, setExiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
      setExiting(false);
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) setExiting(true);
  };
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Please enter a name to continue.');
      return;
    }
    if (clean.length > maxNameLength) {
      setError(`Names must be ${maxNameLength} characters or fewer.`);
      return;
    }
    onComplete(clean);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-2xl transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      />
      <div
        className={`relative w-full max-w-md p-8 rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/15 shadow-2xl transition-all duration-500 ${exiting ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100'}`}
        style={{ animation: exiting ? 'none' : 'modal-in 0.5s cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/40 mb-5">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">What should we call you?</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Your display name personalizes your AudioSphere experience — it appears on your home page.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Your display name"
              maxLength={maxNameLength}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:bg-black/40 transition-all duration-300"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
              {name.length}/{maxNameLength}
            </span>
          </div>

          {error && <p className="text-xs text-rose-300 -mt-2">{error}</p>}

          <button
            type="submit"
            className="group flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:brightness-110 transition-all duration-300 active:scale-[0.98]"
          >
            Continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-slate-500">
          <Check className="w-3 h-3" />
          You can change this later in settings.
        </div>
      </div>
    </div>
  );
}
