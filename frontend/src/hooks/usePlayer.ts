import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song, PlaybackMode, TrackMetadata } from '../types';
import { fetchTrackMetadata } from '../services/api';

export function usePlayer(initialSongs: Song[]) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [queue, setQueue] = useState<Song[]>(initialSongs);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [mode, setMode] = useState<PlaybackMode>('sequential');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [meta, setMeta] = useState<TrackMetadata>({
    artist: 'Select a track',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  });

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  
  // Refs to fix the stale closure bug in YouTube's onStateChange event
  const queueRef = useRef(queue);
  const indexRef = useRef(currentIndex);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  useEffect(() => {
    setSongs(initialSongs);
    if (mode === 'sequential') setQueue(initialSongs);
  }, [initialSongs, mode]);

  const playSong = useCallback(async (index: number) => {
    if (!queueRef.current[index]) return;
    setCurrentIndex(index);
    setIsBuffering(true);
    
    const target = queueRef.current[index];
    const match = target.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    const videoId = match?.[2];

    if (videoId && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      const metadata = await fetchTrackMetadata(target.title);
      setMeta(metadata);
    }
  }, []);

  const nextSong = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const nextIdx = (indexRef.current + 1) % queueRef.current.length;
    playSong(nextIdx);
  }, [playSong]);

  const prevSong = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const prevIdx = (indexRef.current - 1 + queueRef.current.length) % queueRef.current.length;
    playSong(prevIdx);
  }, [playSong]);

  // YouTube API Initialization
  useEffect(() => {
    const initPlayer = () => {
      playerRef.current = new window.YT.Player('yt-hidden-player', {
        events: {
          onReady: () => playerRef.current?.setVolume(volume),
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setDuration(playerRef.current.getDuration());
              clearInterval(progressInterval.current);
              progressInterval.current = setInterval(() => {
                setCurrentTime(playerRef.current?.getCurrentTime() || 0);
              }, 500);
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else {
              clearInterval(progressInterval.current);
              if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              if (event.data === window.YT.PlayerState.ENDED) nextSong(); // Now uses fresh ref state
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else if (!playerRef.current) {
      initPlayer();
    }
  }, [nextSong, volume]);

  const toggleShuffle = () => {
    if (mode === 'sequential') {
      setMode('shuffle');
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      setCurrentIndex(0);
      playSong(0); // Actually play the first song of the new random queue
    } else {
      setMode('sequential');
      setQueue(songs);
      const originalIndex = songs.findIndex(s => s.url === queueRef.current[indexRef.current]?.url);
      setCurrentIndex(originalIndex !== -1 ? originalIndex : 0);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (currentIndex === -1 && queue.length > 0) return playSong(0);
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const seekTo = (val: number) => {
    playerRef.current?.seekTo(val, true);
    setCurrentTime(val);
  };

  const changeVolume = (val: number) => {
    setVolume(val);
    playerRef.current?.setVolume(val);
  };

  return {
    songs, queue, currentIndex, isPlaying, isBuffering, mode, currentTime, duration, volume, meta,
    playSong, nextSong, prevSong, togglePlay, toggleShuffle, seekTo, changeVolume
  };
}