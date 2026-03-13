import { useState, useCallback, useRef } from "react";

export interface UploadState {
  phase: "idle" | "uploading-audio" | "uploading-cover" | "saving" | "done" | "error";
  audioProgress: number; // 0-100
  coverProgress: number; // 0-100
  overallProgress: number; // 0-100
  error: string | null;
  currentTrackIndex: number;
  totalTracks: number;
}

const initialState: UploadState = {
  phase: "idle",
  audioProgress: 0,
  coverProgress: 0,
  overallProgress: 0,
  error: null,
  currentTrackIndex: 0,
  totalTracks: 1,
};

export const useUploadProgress = () => {
  const [state, setState] = useState<UploadState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(initialState);
  }, []);

  const setPhase = useCallback((phase: UploadState["phase"], error?: string) => {
    setState(prev => ({ ...prev, phase, error: error || null }));
  }, []);

  const setAudioProgress = useCallback((progress: number) => {
    setState(prev => {
      const trackWeight = 1 / prev.totalTracks;
      const trackBase = (prev.currentTrackIndex / prev.totalTracks) * 80;
      const overallProgress = Math.round(trackBase + progress * trackWeight * 0.8);
      return { ...prev, audioProgress: progress, overallProgress };
    });
  }, []);

  const setCoverProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, coverProgress: progress, overallProgress: Math.min(95, prev.overallProgress) }));
  }, []);

  const setTrackInfo = useCallback((index: number, total: number) => {
    setState(prev => ({ ...prev, currentTrackIndex: index, totalTracks: total }));
  }, []);

  const complete = useCallback(() => {
    setState(prev => ({ ...prev, phase: "done", overallProgress: 100 }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, phase: "error", error }));
  }, []);

  return {
    state,
    reset,
    setPhase,
    setAudioProgress,
    setCoverProgress,
    setTrackInfo,
    complete,
    setError,
    abortRef,
  };
};
