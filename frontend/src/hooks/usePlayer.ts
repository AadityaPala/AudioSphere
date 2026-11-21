import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song, PlaybackMode, TrackMetadata, EnrichedMetadata } from '../types';
import { fetchTrackMetadata, fetchEnrichedMetadata, resolveDiscoveryTrack } from '../services/api';

const DEFAULT_ARTWORK = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
const YOUTUBE_API_URL = 'https://www.youtube.com/iframe_api';
const API_LOAD_TIMEOUT_MS = 20000;
const PLAYBACK_START_TIMEOUT_MS = 45000;

function extractYouTubeVideoId(input: string): string | null {
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function usePlayer(initialSongs: Song[]) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [queue, setQueue] = useState<Song[]>(initialSongs);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('sequential');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [meta, setMeta] = useState<TrackMetadata>({
    artist: 'Select a track',
    artwork: DEFAULT_ARTWORK,
  });
  const [enriched, setEnriched] = useState<EnrichedMetadata | null>(null);
  const [enriching, setEnriching] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef(queue);
  const indexRef = useRef(currentIndex);
  const volumeRef = useRef(volume);
  const requestIdRef = useRef(0);
  const fallbackAttemptedRequestRef = useRef<number | null>(null);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  useEffect(() => {
    volumeRef.current = volume;
    if (playerReadyRef.current) playerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    setSongs(initialSongs);
    if (mode === 'sequential') {
      queueRef.current = initialSongs;
      setQueue(initialSongs);
    }
  }, [initialSongs, mode]);

  const clearPlaybackTimers = useCallback(() => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  }, []);

  const loadVideo = useCallback((videoId: string) => {
    if (!playerReadyRef.current || !playerRef.current) {
      pendingVideoIdRef.current = videoId;
      return;
    }

    clearPlaybackTimers();
    pendingVideoIdRef.current = null;
    setPlayerError(null);
    setIsPlaying(false);
    setIsBuffering(true);

    try {
      playerRef.current.loadVideoById({ videoId });
      playbackTimeoutRef.current = setTimeout(() => {
        if (!playerRef.current || !playerReadyRef.current) return;

        let state: number | undefined;
        try {
          state = playerRef.current.getPlayerState();
        } catch {
          state = undefined;
        }

        if (state !== 1) {
          setIsBuffering(false);
          setIsPlaying(false);
          setPlayerError(
            'YouTube did not start this video. Check the connection, then press Play to retry.'
          );
        }
      }, PLAYBACK_START_TIMEOUT_MS);
    } catch (error) {
      setIsBuffering(false);
      setPlayerError('The YouTube player could not start this track. Please try again.');
      console.error('[AudioSphere] YouTube loadVideoById failed:', error);
    }
  }, [clearPlaybackTimers]);

  const playSong = useCallback(async (index: number) => {
    const targetQueue = queueRef.current;
    const target = targetQueue[index];
    if (!target) return;

    const requestId = ++requestIdRef.current;
    setCurrentIndex(index);
    indexRef.current = index;
    setIsBuffering(true);
    setIsPlaying(false);
    setPlayerError(null);
    setEnriched(null);
    setCurrentTime(0);
    setDuration(0);

    const videoId = extractYouTubeVideoId(target.url);
    if (!videoId) {
      pendingVideoIdRef.current = null;
      setIsBuffering(false);
      setPlayerError('This track does not contain a valid YouTube video URL.');
      return;
    }

    // Keep the latest requested track until the IFrame API reports that the player is ready.
    loadVideo(videoId);

    try {
      const metadata = await fetchTrackMetadata(target.title);
      if (requestId !== requestIdRef.current) return;
      setMeta(metadata);
      setEnriching(true);

      const enrichedMetadata = await fetchEnrichedMetadata(metadata.artist, target.title);
      if (requestId === requestIdRef.current) setEnriched(enrichedMetadata);
    } catch (error) {
      console.warn('[AudioSphere] Track metadata lookup failed:', error);
    } finally {
      if (requestId === requestIdRef.current) setEnriching(false);
    }
  }, [loadVideo]);

  const playDiscoveryTracks = useCallback((tracks: Song[], startIndex = 0) => {
    if (!tracks.length) return;
    // Discovery playback uses a transient queue; it never writes to the user's library.
    queueRef.current = tracks;
    indexRef.current = -1;
    setQueue(tracks);
    setCurrentIndex(-1);
    void playSong(Math.max(0, Math.min(startIndex, tracks.length - 1)));
  }, [playSong]);

  const playLibraryTrack = useCallback((url: string) => {
    const libraryIndex = songs.findIndex((song) => song.url === url);
    if (libraryIndex < 0) return;
    queueRef.current = songs;
    indexRef.current = -1;
    setQueue(songs);
    setMode('sequential');
    void playSong(libraryIndex);
  }, [songs, playSong]);

  const restoreLibraryQueue = useCallback(() => {
    queueRef.current = songs;
    indexRef.current = -1;
    setQueue(songs);
    setCurrentIndex(-1);
  }, [songs]);

  const nextSong = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const nextIdx = (indexRef.current + 1) % queueRef.current.length;
    void playSong(nextIdx);
  }, [playSong]);

  const prevSong = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const prevIdx = (indexRef.current - 1 + queueRef.current.length) % queueRef.current.length;
    void playSong(prevIdx);
  }, [playSong]);

  useEffect(() => {
    let active = true;
    let playerCreated = false;

    const initializePlayer = () => {
      if (!active || playerCreated || playerRef.current || !(window as any).YT?.Player) return;
      playerCreated = true;

      try {
        const playerHostId = window.matchMedia('(min-width: 1280px)').matches
          ? 'yt-hidden-player-desktop'
          : 'yt-hidden-player-mobile';
        playerRef.current = new (window as any).YT.Player(playerHostId, {
          width: '100%',
          height: '100%',
          playerVars: {
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!active) return;
              playerReadyRef.current = true;
              if (apiTimeoutRef.current) {
                clearTimeout(apiTimeoutRef.current);
                apiTimeoutRef.current = null;
              }
              event.target.setVolume(volumeRef.current);

              const pendingVideoId = pendingVideoIdRef.current;
              if (pendingVideoId) loadVideo(pendingVideoId);
            },
            onStateChange: (event: any) => {
              if (!active) return;
              const states = (window as any).YT?.PlayerState;

              if (event.data === states?.PLAYING) {
                clearPlaybackTimers();
                setPlayerError(null);
                setIsPlaying(true);
                setIsBuffering(false);
                setDuration(event.target.getDuration() || 0);
                if (progressInterval.current) clearInterval(progressInterval.current);
                progressInterval.current = setInterval(() => {
                  if (playerReadyRef.current && playerRef.current) {
                    setCurrentTime(playerRef.current.getCurrentTime() || 0);
                  }
                }, 500);
              } else if (event.data === states?.BUFFERING) {
                setIsBuffering(true);
              } else {
                if (progressInterval.current) {
                  clearInterval(progressInterval.current);
                  progressInterval.current = null;
                }
                if (event.data === states?.PAUSED) {
                  clearPlaybackTimers();
                  setIsPlaying(false);
                  setIsBuffering(false);
                } else if (event.data === states?.ENDED) {
                  clearPlaybackTimers();
                  setIsPlaying(false);
                  setIsBuffering(false);
                  nextSong();
                } else if (event.data === states?.CUED) {
                  setIsBuffering(false);
                }
              }
            },
            onError: (event: any) => {
              if (!active) return;
              clearPlaybackTimers();
              setIsPlaying(false);
              setIsBuffering(false);

              // A 101/150 response is video-specific. Resolve a replacement through
              // the existing Python YouTube Data API integration, which now filters
              // candidates using videos.list status.embeddable.
              if (
                (event.data === 101 || event.data === 150) &&
                fallbackAttemptedRequestRef.current !== requestIdRef.current
              ) {
                const failedRequestId = requestIdRef.current;
                const failedIndex = indexRef.current;
                const failedTrack = queueRef.current[failedIndex];

                if (failedTrack) {
                  fallbackAttemptedRequestRef.current = failedRequestId;
                  setIsBuffering(true);
                  setPlayerError('This video cannot be embedded. Looking for an eligible alternative…');

                  void (async () => {
                    try {
                      const metadata = await fetchTrackMetadata(failedTrack.title);
                      const replacementVideoId = await resolveDiscoveryTrack(
                        metadata.artist,
                        failedTrack.title
                      );

                      if (!active || failedRequestId !== requestIdRef.current) return;

                      const latestTrack = queueRef.current[indexRef.current];
                      const failedVideoId = extractYouTubeVideoId(failedTrack.url);

                      if (
                        !latestTrack ||
                        latestTrack.url !== failedTrack.url ||
                        !replacementVideoId ||
                        replacementVideoId === failedVideoId
                      ) {
                        throw new Error('No different embeddable YouTube video was found.');
                      }

                      const replacementUrl = `https://www.youtube.com/watch?v=${replacementVideoId}`;
                      const updatedQueue = [...queueRef.current];
                      updatedQueue[indexRef.current] = {
                        ...latestTrack,
                        url: replacementUrl,
                      };
                      queueRef.current = updatedQueue;
                      setQueue(updatedQueue);

                      console.info(
                        '[AudioSphere] Replaced non-embeddable video with an eligible alternative:',
                        replacementVideoId
                      );
                      loadVideo(replacementVideoId);
                    } catch (error) {
                      if (!active || failedRequestId !== requestIdRef.current) return;
                      setIsBuffering(false);
                      setPlayerError(
                        'This YouTube video cannot be embedded, and no eligible alternative was found for this track.'
                      );
                      console.warn('[AudioSphere] YouTube embedding fallback failed:', error);
                    }
                  })();

                  return;
                }
              }

              const messages: Record<number, string> = {
                2: 'YouTube rejected this video ID.',
                5: 'This video cannot be played in the HTML5 player.',
                100: 'This YouTube video is unavailable or has been removed.',
                101: 'The video owner does not allow embedded playback.',
                150: 'The video owner does not allow embedded playback.',
                153: 'YouTube requires a valid page referrer to play this video.',
              };
              const message = messages[event.data] || `YouTube player error (${event.data}).`;
              setPlayerError(message);
              console.error('[AudioSphere] YouTube player error:', event.data, message);
            },
          },
        });
      } catch (error) {
        playerCreated = false;
        setIsBuffering(false);
        setPlayerError('The YouTube player failed to initialize. Reload the page and try again.');
        console.error('[AudioSphere] YouTube player initialization failed:', error);
      }
    };

    const onApiReady = () => {
      if (active) initializePlayer();
    };

    const yt = (window as any).YT;
    if (yt?.Player) {
      initializePlayer();
    } else {
      // Install the callback before adding the script: the API can become ready very quickly.
      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        try {
          if (typeof previousCallback === 'function') previousCallback();
        } catch (error) {
          console.warn('[AudioSphere] Existing YouTube API callback failed:', error);
        }
        onApiReady();
      };

      let script = document.querySelector<HTMLScriptElement>(`script[src="${YOUTUBE_API_URL}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = YOUTUBE_API_URL;
        script.async = true;
        script.onerror = () => {
          if (!active) return;
          if (apiTimeoutRef.current) clearTimeout(apiTimeoutRef.current);
          setIsBuffering(false);
          setPlayerError('Could not load the YouTube player. Check your network or content blocker and reload.');
        };
        document.head.appendChild(script);
      }

      apiTimeoutRef.current = setTimeout(() => {
        if (!active || playerReadyRef.current) return;
        setIsBuffering(false);
        setPlayerError('YouTube is taking too long to initialize. Check your network or content blocker and reload.');
      }, API_LOAD_TIMEOUT_MS);
    }

    return () => {
      active = false;
      if (apiTimeoutRef.current) {
        clearTimeout(apiTimeoutRef.current);
        apiTimeoutRef.current = null;
      }
      clearPlaybackTimers();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      playerReadyRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore teardown errors from an iframe that did not finish initializing.
      }
      playerRef.current = null;
    };
  }, [clearPlaybackTimers, loadVideo, nextSong]);

  const toggleShuffle = () => {
    if (mode === 'sequential') {
      setMode('shuffle');
      const shuffled = [...songs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      queueRef.current = shuffled;
      setQueue(shuffled);
      setCurrentIndex(0);
      indexRef.current = 0;
      if (shuffled.length > 0) void playSong(0);
    } else {
      const currentUrl = queueRef.current[indexRef.current]?.url;
      setMode('sequential');
      queueRef.current = songs;
      setQueue(songs);
      const originalIndex = songs.findIndex((song) => song.url === currentUrl);
      const safeIdx = originalIndex !== -1 ? originalIndex : 0;
      setCurrentIndex(safeIdx);
      indexRef.current = safeIdx;
    }
  };

  const togglePlay = () => {
    if (!playerReadyRef.current || !playerRef.current) {
      if (currentIndex >= 0) {
        const currentSong = queueRef.current[currentIndex];
        const videoId = currentSong ? extractYouTubeVideoId(currentSong.url) : null;
        if (videoId) {
          pendingVideoIdRef.current = videoId;
          setIsBuffering(true);
        }
      } else if (queueRef.current.length > 0) {
        void playSong(0);
      }
      return;
    }

    if (currentIndex === -1 && queueRef.current.length > 0) {
      void playSong(0);
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else if (playerError) {
      const currentSong = queueRef.current[currentIndex];
      const videoId = currentSong ? extractYouTubeVideoId(currentSong.url) : null;
      if (videoId) loadVideo(videoId);
    } else {
      playerRef.current.playVideo();
    }
  };

  const seekTo = (val: number) => {
    if (!playerReadyRef.current || !playerRef.current) return;
    playerRef.current.seekTo(val, true);
    setCurrentTime(val);
  };

  const changeVolume = (val: number) => {
    setVolume(val);
    volumeRef.current = val;
    if (playerReadyRef.current) playerRef.current?.setVolume(val);
  };

  return {
    songs, queue, currentIndex, isPlaying, isBuffering, playerError, mode,
    currentTime, duration, volume, meta, enriched, enriching,
    playSong, playDiscoveryTracks, playLibraryTrack, restoreLibraryQueue,
    nextSong, prevSong, togglePlay, toggleShuffle, seekTo, changeVolume,
  };
}
