declare global {
  interface Window {
    google: any;
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface Song {
  url: string;
  title: string;
}

export type PlaybackMode = 'sequential' | 'shuffle';

export interface TrackMetadata {
  artist: string;
  artwork: string;
}

export interface EnrichedMetadata {
  artist: string;
  title: string;
  albumArtUrl: string;
  genre: string;
  releaseYear: string;
  lyrics: string;
}

export interface Recommendation {
  id: string;
  title: string;
  artist: string;
  artwork: string;
}

export interface MockArtist {
  id: string;
  name: string;
  image: string;
  monthlyListeners: string;
}

export interface MockTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: string;
  playable: boolean;
  url?: string;
}
