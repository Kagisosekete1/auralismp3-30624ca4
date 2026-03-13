import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";

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
      onTrackEndRef.current?.();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

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
      audio.pause();
    };
  }, []);

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

    // Load new track
    audioRef.current.src = track.audioUrl;
    audioRef.current.load();
    setCurrentTrack(track);
    setProgress(0);

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(console.error);
  }, [currentTrack]);

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
