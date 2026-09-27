import type { Song } from '../types';

export const CAS_URL = import.meta.env.VITE_CAS_URL;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
            .replace(/\s*[\(\[][^)]*?(official\vert{}video\vert{}audio\vert{}lyrics\vert{}hd\vert{}4k)[^)]*?[\)\]]/gi, '')
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

export const fetchPlaylists = async () => {
  const token = localStorage.getItem('st-access-token');
  
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/links`, {
    headers: {
      'Authorization': `Bearer ${token}` 
    }
  });

  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export async function addSong(url: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
    });
    if(!res.ok) throw new Error('Failed to add track');
}

export async function removeSong(url: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/remove`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url }),
    });
    if(!res.ok) throw new Error('Failed to remove track');
}