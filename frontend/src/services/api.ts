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
        if (!data || !(data.lyrics || data.genre || data.releaseYear || data.albumArtUrl)) return null;
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

function getYouTubeVideoId(input: string): string | null {
    try {
        const parsed = new URL(input);
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
        if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
        if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
            if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) return parts[1] || null;
        }
    } catch {
        return null;
    }
    return null;
}

async function getYouTubeTitle(url: string): Promise<string> {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) throw new Error('Enter a valid YouTube video URL.');
    const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);
    if (!response.ok) throw new Error('Could not fetch this YouTube video. Check that the URL is public and valid.');
    const data = await response.json();
    if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('YouTube did not return a title for this video.');
    return data.title.trim();
}

export async function addSong(url: string): Promise<void> {
    // Resolve the actual YouTube title and enrich it before saving to the Java API.
    const title = await getYouTubeTitle(url);
    const trackMetadata = await fetchTrackMetadata(title);
    const enriched = await fetchEnrichedMetadata(trackMetadata.artist, title);

    const res = await fetch(`${BACKEND_URL}/links`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            url,
            title,
            albumArtUrl: enriched?.albumArtUrl || trackMetadata.artwork,
            genre: enriched?.genre || '',
            releaseYear: enriched?.releaseYear || '',
            lyrics: enriched?.lyrics || '',
        }),
    });
    if (!res.ok) {
        if (res.status === 400) throw new Error('This track may already be in your library, or its details are invalid.');
        throw new Error(`Failed to add track (HTTP ${res.status}).`);
    }
}

export async function removeSong(url: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/links?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to remove track (HTTP ${res.status}).`);
}
