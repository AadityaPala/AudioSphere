import { useState, useCallback, useEffect } from 'react';

const STORAGE_PREFIX = 'as-onboard-';
const MAX_NAME_LENGTH = 32;

function decodeTokenSubject(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.sub ?? payload?.id ?? null;
  } catch {
    return null;
  }
}

export function useOnboarding(token: string | null) {
  const userKey = decodeTokenSubject(token);
  const storageKey = userKey ? `${STORAGE_PREFIX}${userKey}` : null;

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!storageKey) {
      setDisplayName(null);
      setNeedsOnboarding(false);
      setLoaded(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        setDisplayName(data.name ?? null);
        setNeedsOnboarding(!data.completed);
      } else {
        setDisplayName(null);
        setNeedsOnboarding(true);
      }
    } catch {
      setDisplayName(null);
      setNeedsOnboarding(true);
    }
    setLoaded(true);
  }, [storageKey]);

  const completeOnboarding = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean || !storageKey) return false;
      if (clean.length > MAX_NAME_LENGTH) return false;
      localStorage.setItem(storageKey, JSON.stringify({ name: clean, completed: true }));
      setDisplayName(clean);
      setNeedsOnboarding(false);
      return true;
    },
    [storageKey]
  );

  return { displayName, needsOnboarding, completeOnboarding, loaded, maxNameLength: MAX_NAME_LENGTH };
}
