import { useState, useEffect, useCallback } from "react";

const SESSION_KEY = "auralis_session_state";
const DEBOUNCE_MS = 500;

interface SessionState {
  activeSection: string;
  selectedPlaylistId: string | null;
  selectedArtistId: string | null;
  sidebarOpen: boolean;
  lastUpdated: number;
}

const defaultState: SessionState = {
  activeSection: "home",
  selectedPlaylistId: null,
  selectedArtistId: null,
  sidebarOpen: true,
  lastUpdated: Date.now(),
};

export const useSessionPersistence = () => {
  const [state, setState] = useState<SessionState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionState;
        // Check if session is still fresh (within 24 hours)
        if (Date.now() - parsed.lastUpdated < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading session state:", error);
    }
    return defaultState;
  });

  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced save to sessionStorage
  const saveState = useCallback((newState: SessionState) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          ...newState,
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        console.error("Error saving session state:", error);
      }
    }, DEBOUNCE_MS);
    
    setSaveTimeout(timeout);
  }, [saveTimeout]);

  // Update state and save
  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Handle page visibility changes - preserve state when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Immediately save state when page becomes hidden
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            ...state,
            lastUpdated: Date.now(),
          }));
        } catch (error) {
          console.error("Error saving session on hide:", error);
        }
      }
    };

    // Also save on beforeunload
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          ...state,
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        console.error("Error saving session on unload:", error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state]);

  return {
    activeSection: state.activeSection,
    selectedPlaylistId: state.selectedPlaylistId,
    selectedArtistId: state.selectedArtistId,
    sidebarOpen: state.sidebarOpen,
    setActiveSection: (section: string) => updateState({ activeSection: section }),
    setSelectedPlaylistId: (id: string | null) => updateState({ selectedPlaylistId: id }),
    setSelectedArtistId: (id: string | null) => updateState({ selectedArtistId: id }),
    setSidebarOpen: (open: boolean) => updateState({ sidebarOpen: open }),
  };
};
