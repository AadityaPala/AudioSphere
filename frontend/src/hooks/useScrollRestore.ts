import { useEffect, useRef, useCallback } from 'react';

const STORAGE_PREFIX = 'as-scroll-';
const THROTTLE_MS = 200;

function getUserId(): string {
  const token = localStorage.getItem('st-access-token');
  if (!token) return 'guest';
  try {
    const parts = token.split('.');
    if (parts.length < 2) return 'guest';
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.sub ?? payload?.id ?? 'guest';
  } catch {
    return 'guest';
  }
}

export function useScrollRestore(key: string, enabled: boolean = true) {
  const ref = useRef<HTMLElement | null>(null);
  const lastSave = useRef(0);

  const storageKey = `${STORAGE_PREFIX}${getUserId()}-${key}`;

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const now = performance.now();
    if (now - lastSave.current < THROTTLE_MS) return;
    lastSave.current = now;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ top: el.scrollTop, left: el.scrollLeft }));
    } catch {
      // ignore quota errors
    }
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    // Restore saved position after content has rendered
    requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const { top, left } = JSON.parse(raw);
          el.scrollTop = top ?? 0;
          el.scrollLeft = left ?? 0;
        }
      } catch {
        // ignore
      }
    });

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      // Save final position on unmount
      try {
        localStorage.setItem(storageKey, JSON.stringify({ top: el.scrollTop, left: el.scrollLeft }));
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  return ref;
}
