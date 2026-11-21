import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  videoReelUrl?: string;
  duration?: number;
}

const STORAGE_KEY = "auralis_last_track";
const PROGRESS_KEY = "auralis_last_progress";

export const useAudioPlayer = (onTrackEnd?: () => void, onPreviousTrack?: () => void) => {
  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;
  const onPreviousRef = useRef(onPreviousTrack);
  onPreviousRef.current = onPreviousTrack;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackSessionRef = useRef<{ id: string; trackId: string; sequence: number; pending: Promise<void> } | null>(null);
  const sessionStartRef = useRef<Promise<{ id: string; trackId: string; sequence: number; pending: Promise<void> } | null> | null>(null);
  const sessionGenerationRef = useRef(0);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const { user } = useAuth();
  const { profile } = useDatabase();
  
  const isPremium = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'artist';

  const sendPlaybackEvent = useCallback((session: NonNullable<typeof playbackSessionRef.current>, eventType: "heartbeat" | "pause" | "resume" | "seek", positionSeconds: number) => {
    const sequence = session.sequence++;
    const event = session.pending.then(async () => {
      const { error } = await (supabase as any).rpc("record_auralis_playback_event", {
        p_session_id: session.id,
        p_sequence: sequence,
        p_event_type: eventType,
        p_position_seconds: Math.max(0, positionSeconds),
      });
      if (error) console.error("Playback event was not recorded:", error);
    });
    session.pending = event.catch((error) => console.error("Playback event queue failed:", error));
  }, []);

  const ensurePlaybackSession = useCallback(async (trackId: string, positionSeconds: number) => {
    if (!user) return null;
    if (playbackSessionRef.current?.trackId === trackId) return playbackSessionRef.current;
    if (sessionStartRef.current) return sessionStartRef.current;
    const generation = sessionGenerationRef.current;

    const startPromise = (async () => {
      const { data, error } = await (supabase as any).rpc("start_auralis_playback", {
        p_track_id: trackId,
        p_position_seconds: Math.max(0, positionSeconds),
      });
      if (error) {
        console.error("Could not start validated playback session:", error);
        return null;
      }
      if (generation !== sessionGenerationRef.current) return null;
      const id = typeof data === "string" ? data : data?.id;
      if (!id) return null;
      const session = { id, trackId, sequence: 1, pending: Promise.resolve() };
      playbackSessionRef.current = session;
      return session;
    })();
    sessionStartRef.current = startPromise;
    const result = await startPromise;
    if (sessionStartRef.current === startPromise) sessionStartRef.current = null;
    return result;
  }, [user?.id]);

  // Load last played track from localStorage on mount
  useEffect(() => {
    try {
      const savedTrack = localStorage.getItem(STORAGE_KEY);
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      
      if (savedTrack) {
        const track = JSON.parse(savedTrack) as AudioTrack;
        setCurrentTrack(track);
        
        if (savedProgress) {
          setProgress(parseFloat(savedProgress));
        }
      }
    } catch (error) {
      console.error("Error loading saved track:", error);
    }
    setInitialized(true);
  }, []);

  // Save current track and progress to localStorage
  useEffect(() => {
    if (!initialized) return;
    
    if (currentTrack) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTrack));
      localStorage.setItem(PROGRESS_KEY, progress.toString());
    }
  }, [currentTrack, progress, initialized]);

  // Set media session metadata and action handlers for lock screen / notification controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: currentTrack.coverUrl ? [{ src: currentTrack.coverUrl, sizes: '512x512' }] : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(console.error);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime != null) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onTrackEndRef.current?.();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        onPreviousRef.current?.();
      });
    }
  }, [currentTrack]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume / 100;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      
      // Restore progress if we have a saved position
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      if (savedProgress && audio.duration) {
        const savedPercent = parseFloat(savedProgress);
        audio.currentTime = (savedPercent / 100) * audio.duration;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      const session = playbackSessionRef.current;
      if (session) {
        sendPlaybackEvent(session, "pause", audio.currentTime);
        playbackSessionRef.current = null;
      }
      sessionGenerationRef.current += 1;
      onTrackEndRef.current?.();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      const session = playbackSessionRef.current;
      if (session) sendPlaybackEvent(session, "pause", audio.currentTime);
    };
    const handleSeeked = () => {
      const session = playbackSessionRef.current;
      if (session) sendPlaybackEvent(session, "seek", audio.currentTime);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("seeked", handleSeeked);

    // If we have a saved track, load it
    const savedTrack = localStorage.getItem(STORAGE_KEY);
    if (savedTrack) {
      try {
        const track = JSON.parse(savedTrack) as AudioTrack;
        audio.src = track.audioUrl;
        audio.load();
      } catch (error) {
        console.error("Error loading saved audio:", error);
      }
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("seeked", handleSeeked);
      audio.pause();
    };
  }, [sendPlaybackEvent]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!isPlaying || !audio || !currentTrack) return;
    let disposed = false;
    let knownSessionId: string | null = null;

    const sendHeartbeat = async () => {
      if (disposed || audio.paused || audio.seeking) return;
      const session = await ensurePlaybackSession(currentTrack.id, audio.currentTime);
      if (!session || disposed) return;
      if (knownSessionId !== session.id) {
        knownSessionId = session.id;
        if (session.sequence > 1) sendPlaybackEvent(session, "resume", audio.currentTime);
      }
      sendPlaybackEvent(session, "heartbeat", audio.currentTime);
    };

    void sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 5000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [isPlaying, currentTrack?.id, ensurePlaybackSession, sendPlaybackEvent]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playTrack = useCallback((track: AudioTrack) => {
    if (!audioRef.current) return;

    // If same track, just toggle play
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    sessionGenerationRef.current += 1;
    const oldSession = playbackSessionRef.current;
    if (oldSession && audioRef.current) sendPlaybackEvent(oldSession, "pause", audioRef.current.currentTime);
    playbackSessionRef.current = null;
    sessionStartRef.current = null;

    // Load new track
    audioRef.current.src = track.audioUrl;
    audioRef.current.load();
    setCurrentTrack(track);
    setProgress(0);

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(console.error);
  }, [currentTrack, sendPlaybackEvent]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If audio source is not set (from localStorage restore), set it
      if (!audioRef.current.src || audioRef.current.src === "") {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((percent: number) => {
    if (!audioRef.current || !duration) return;
    
    const time = (percent / 100) * duration;
    audioRef.current.currentTime = time;
    setProgress(percent);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = duration ? (progress / 100) * duration : 0;

  return {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    currentTime,
    isPremium,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    setIsMuted,
    formatTime,
  };
};
