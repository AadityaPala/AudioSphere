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

export interface Recommendation {
  id: string;
  title: string;
  artist: string;
  artwork: string;
}