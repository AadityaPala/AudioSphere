import type { EnrichedMetadata, Recommendation } from '../types';

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

export async function fetchEnrichedMetadata(
    artist: string,
    title: string
): Promise<EnrichedMetadata | null> {

    if (!PYTHON_URL) {
        console.error('[AudioSphere] VITE_PYTHON_URL is not configured.');
        return null;
    }

    try {
        const url =
            `${PYTHON_URL}/metadata/enrich?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;

        const res = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const errorBody = await res.text();

            console.error(
                '[AudioSphere] Python metadata error:',
                res.status,
                errorBody
            );

            return null;
        }

        const data = await res.json();

        if (!data || !(
            data.lyrics ||
            data.genre ||
            data.releaseYear ||
            data.albumArtUrl
        )) {
            console.warn(
                '[AudioSphere] No enriched metadata returned:',
                artist,
                title,
                data
            );

            return null;
        }

        return {
            artist: data.artist || artist,
            title: data.title || title,
            albumArtUrl: data.albumArtUrl || '',
            genre: data.genre || '',
            releaseYear: data.releaseYear || '',
            lyrics: data.lyrics || '',
        };

    } catch (error) {
        console.error(
            '[AudioSphere] Failed to fetch enriched metadata:',
            error
        );

        return null;
    }
}

export async function fetchRecommendations(limit: number = 12, preferredGenre?: string): Promise<Recommendation[]> {
    const response = await fetch(
        `${BACKEND_URL}/recommendations?limit=${encodeURIComponent(limit)}${preferredGenre ? `&genre=${encodeURIComponent(preferredGenre)}` : ''}`,
        { method: 'GET', headers: getAuthHeaders() }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[AudioSphere] Recommendation API error:', response.status, errorBody);
        throw new Error(`Failed to fetch recommendations (HTTP ${response.status}).`);
    }

    const data: Recommendation[] = await response.json();
    return Array.isArray(data) ? data : [];
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

async function getYouTubeMetadata(url: string): Promise<{ title: string; author: string }> {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) throw new Error('Enter a valid YouTube video URL.');
    const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);
    if (!response.ok) throw new Error('Could not fetch this YouTube video. Check that the URL is public and valid.');
    const data = await response.json();
    if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('YouTube did not return a title for this video.');
    return {
        title: data.title.trim(),
        author: typeof data.author_name === 'string' ? data.author_name.trim() : '',
    };
}

export async function addSong(url: string): Promise<void> {
    // Resolve the actual YouTube title and enrich it before saving to the Java API.
    const youtube = await getYouTubeMetadata(url);
    const title = youtube.title;
    const trackMetadata = await fetchTrackMetadata(title);
    const artist = trackMetadata.artist !== 'Unknown Artist' ? trackMetadata.artist : (youtube.author || 'Unknown Artist');
    const enriched = await fetchEnrichedMetadata(artist, title);

    const res = await fetch(`${BACKEND_URL}/links`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            url,
            title,
            artist,
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


export interface DiscoveryArtist {
    id: string;
    name: string;
    image: string;
    listeners?: string;
    url?: string;
}

export interface DiscoveryTrack {
    id: string;
    title: string;
    artist: string;
    album?: string;
    artwork: string;
    duration?: string;
    url?: string;
    listeners?: string;
    videoId?: string;
}

function asRecord(value: any): Record<string, any> {
    return value && typeof value === 'object' ? value : {};
}

function unwrapList(data: any, keys: string[]): any[] {
    let value = data;
    for (const key of keys) {
        if (Array.isArray(value)) return value;
        value = asRecord(value)[key];
    }
    return Array.isArray(value) ? value : [];
}

function imageFromLastFm(value: any): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        const preferred = [...value].reverse().find((item) => item?.['#text'] || item?.url);
        return preferred?.['#text'] || preferred?.url || '';
    }
    return value?.['#text'] || value?.url || '';
}

function normalizeDiscoveryArtist(raw: any, index: number): DiscoveryArtist {
    const artist = asRecord(raw);
    const name = artist.name || artist.artist?.name || artist.artistName || 'Unknown artist';
    return {
        id: String(artist.mbid || artist.id || name || index),
        name,
        image: imageFromLastFm(artist.image || artist.images || artist.artwork || artist.imageUrl) ||
            'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
        listeners: artist.listeners?.toLocaleString?.() || artist.listeners || artist.playcount?.toLocaleString?.(),
        url: artist.url,
    };
}

function normalizeDiscoveryTrack(raw: any, index: number, fallbackArtist?: string): DiscoveryTrack {
    const track = asRecord(raw);
    const artist = typeof track.artist === 'string'
        ? track.artist
        : track.artist?.name || track.artistName || fallbackArtist || 'Unknown artist';
    const title = track.name || track.title || track.trackName || 'Unknown track';
    return {
        id: String(track.mbid || track.id || `${artist}-${title}-${index}`),
        title,
        artist,
        album: track.album?.['#text'] || track.album?.title || track.album || '',
        artwork: imageFromLastFm(track.image || track.album?.image || track.artwork || track.imageUrl || track.albumArtUrl) ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        duration: track.duration ? formatDiscoveryDuration(track.duration) : undefined,
        listeners: track.listeners?.toLocaleString?.() || track.listeners,
        url: track.url,
        videoId: track.videoId || track.video_id || track.youtubeVideoId,
    };
}

function formatDiscoveryDuration(value: number | string): string {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

async function discoveryGet<T>(path: string): Promise<T> {
    if (!BACKEND_URL) throw new Error('VITE_BACKEND_URL is not configured.');
    const response = await fetch(`${BACKEND_URL}${path}`, { headers: getAuthHeaders() });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Discovery request failed (HTTP ${response.status}): ${detail || response.statusText}`);
    }
    return response.json() as Promise<T>;
}

/** Reads the Last.fm chart through the Java API; discovery remains separate from the user's library. */
export async function fetchDiscoveryCharts(limit = 12): Promise<DiscoveryTrack[]> {
    const data = await discoveryGet<any>(`/discovery/charts?limit=${limit}`);
    const list = unwrapList(data, ['tracks', 'track']) ;
    return list.map((item, index) => normalizeDiscoveryTrack(item, index));
}

export async function fetchPopularArtists(limit = 12): Promise<DiscoveryArtist[]> {
    const data = await discoveryGet<any>(`/discovery/artists?limit=${limit}`);
    const list = unwrapList(data, ['artists', 'artist', 'topartists']);
    return list.map(normalizeDiscoveryArtist);
}

export async function fetchArtistTracks(artist: string, limit = 12): Promise<DiscoveryTrack[]> {
    const data = await discoveryGet<any>(`/discovery/artists/${encodeURIComponent(artist)}/tracks?limit=${limit}`);
    const list = unwrapList(data, ['tracks', 'track']);
    return list.map((item, index) => normalizeDiscoveryTrack(item, index, artist));
}

export async function resolveDiscoveryTrack(artist: string, title: string): Promise<string> {
    const data = await discoveryGet<any>(
        `/discovery/resolve?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
    );
    const videoId = data?.videoId || data?.video_id || data?.id;
    if (typeof videoId !== 'string' || !videoId.trim()) {
        throw new Error('No playable YouTube video was found for this track.');
    }
    return videoId.trim();
}
