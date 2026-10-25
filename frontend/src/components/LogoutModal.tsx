import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface LogoutModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ open, onCancel, onConfirm }: LogoutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl transition-all duration-300">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/15 transition-all duration-300"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-red-500/15 border border-red-400/20 text-red-300 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Log out of AudioSphere?</h2>
          <p className="text-xs text-slate-400 mb-6">Are you sure you want to log out? You'll need to sign in again to access your library.</p>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 transition-all duration-300 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:brightness-110 transition-all duration-300 active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
