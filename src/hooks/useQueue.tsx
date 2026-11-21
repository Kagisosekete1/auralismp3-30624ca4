import { useState, useCallback } from "react";

export interface QueueTrack {
  id: string;
  title: string;
  artist: string;
  artistUserId?: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: number;
}

export const useQueue = () => {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [history, setHistory] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const addToQueue = useCallback((track: QueueTrack) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const addMultipleToQueue = useCallback((tracks: QueueTrack[]) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
  }, []);

  const playNext = useCallback((): QueueTrack | null => {
    if (repeatMode === 'one' && currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }

    let nextIndex = currentIndex + 1;

    if (shuffleEnabled && queue.length > 1) {
      // Get random index excluding current
      const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return null;
      }
    }

    if (currentIndex >= 0 && currentIndex < queue.length) {
      setHistory(prev => [...prev.slice(-49), queue[currentIndex]]);
    }

    setCurrentIndex(nextIndex);
    return queue[nextIndex] || null;
  }, [queue, currentIndex, shuffleEnabled, repeatMode]);

  const playPrevious = useCallback((): QueueTrack | null => {
    if (history.length > 0) {
      const previousTrack = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      
      if (currentIndex >= 0 && currentIndex < queue.length) {
        setQueue(prev => [previousTrack, ...prev]);
        setCurrentIndex(0);
      }
      
      return previousTrack;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1;
      } else {
        return null;
      }
    }

    setCurrentIndex(prevIndex);
    return queue[prevIndex] || null;
  }, [queue, currentIndex, history, repeatMode]);

  const playFromQueue = useCallback((index: number): QueueTrack | null => {
    if (index < 0 || index >= queue.length) return null;
    
    if (currentIndex >= 0 && currentIndex < queue.length) {
      setHistory(prev => [...prev.slice(-49), queue[currentIndex]]);
    }
    
    setCurrentIndex(index);
    return queue[index];
  }, [queue, currentIndex]);

  const setQueueAndPlay = useCallback((tracks: QueueTrack[], startIndex = 0) => {
    setQueue(tracks);
    setCurrentIndex(startIndex);
    setHistory([]);
    return tracks[startIndex] || null;
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled(prev => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const getCurrentTrack = useCallback((): QueueTrack | null => {
    return queue[currentIndex] || null;
  }, [queue, currentIndex]);

  return {
    queue,
    history,
    currentIndex,
    shuffleEnabled,
    repeatMode,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,
    playFromQueue,
    setQueueAndPlay,
    toggleShuffle,
    cycleRepeat,
    getCurrentTrack,
  };
};
