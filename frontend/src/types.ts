export interface Song {
    url: string;
    title: string;
}

export type PlaybackMode = 'sequential' | 'shuffle';

export interface TrackMetadata {
    artist: string;
    artwork: string;
}

declare global {
  interface Window {
    google: any;
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}