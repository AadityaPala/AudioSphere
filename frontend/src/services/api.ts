import type { EnrichedMetadata } from '../types';

export const CAS_URL = import.meta.env.VITE_CAS_URL;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const PYTHON_URL = import.meta.env.VITE_PYTHON_URL;

export function getAuthHeaders() {
    const token = localStorage.getItem('st-access-token');

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function fetchTrackMetadata(title: string): Promise<{ artist: string; artwork: string }> {
    try {
        const cleanQuery = title
            .replace(/\s*[\(\[][^)]*?(official|video|audio|lyrics|hd|4k)[^)]*?[\)\]]/gi, '')
            .replace(/\|.*/, '')
            .trim();

        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=1`;
        const res = await fetch(itunesUrl);
        const data = await res.json();

        if(data.results && data.results.length > 0) {
            const match = data.results[0];

            const artwork = match.artworkUrl100 ? match.artworkUrl100.replace('100x100bb', '600x600bb') : '';
            return {
                artist: match.artistName || 'Unknown Artist',
                artwork: artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            };
        }
    } catch {

    }

    return {
        artist: title.includes('-') ? title.split('-')[0].trim() : 'Unknown Artist',
        artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    };
}

export async function fetchEnrichedMetadata(artist: string, title: string): Promise<EnrichedMetadata | null> {
    try {
        const url = `${PYTHON_URL}/metadata/enrich?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || !data.lyrics) return null;
        return {
            artist: data.artist || artist,
            title: data.title || title,
            albumArtUrl: data.albumArtUrl || '',
            genre: data.genre || '',
            releaseYear: data.releaseYear || '',
            lyrics: data.lyrics || '',
        };
    } catch {
        return null;
    }
}

export const fetchPlaylists = async () => {
  const token = localStorage.getItem('st-access-token');

  const response = await fetch(`${BACKEND_URL}/links`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export async function addSong(url: string): Promise<void> {
    // The Java API creates tracks at POST /links and requires a non-blank title.
    // Use the submitted URL as a fallback title until the UI supplies a track title.
    const res = await fetch(`${BACKEND_URL}/links`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url, title: url }),
    });
    if (!res.ok) {
        throw new Error(res.status === 400
            ? 'Track already exists or the submitted track is invalid'
            : `Failed to add track (HTTP ${res.status})`);
    }
}

export async function removeSong(url: string): Promise<void> {
    // The Java API deletes by URL using DELETE /links?url=...
    const res = await fetch(`${BACKEND_URL}/links?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        throw new Error(`Failed to remove track (HTTP ${res.status})`);
    }
}
