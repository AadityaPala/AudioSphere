export interface Song {
    id?: number;
    url: string;
    title: string;
    artist?: string;
    artwork?: string;
}

export type PlaybackMode = 'sequential' | 'shuffle';

declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
        YT: any;
        google?: any;
    }
}