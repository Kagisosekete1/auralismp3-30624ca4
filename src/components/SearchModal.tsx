import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Music2, Mic2, Play, Clock } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  genre?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onNavigate?: (section: string) => void;
}

const SearchModal = ({ isOpen, onClose, tracks, onPlayTrack, onNavigate }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("auralis-recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return { tracks: [], artists: [] };

    const lower = query.toLowerCase();
    
    const matchedTracks = tracks.filter(t => 
      t.title.toLowerCase().includes(lower) || 
      t.artist_name.toLowerCase().includes(lower) ||
      (t.genre && t.genre.toLowerCase().includes(lower))
    );

    const artistNames = [...new Set(tracks.map(t => t.artist_name))];
    const matchedArtists = artistNames.filter(a => 
      a.toLowerCase().includes(lower)
    );

    return { tracks: matchedTracks.slice(0, 10), artists: matchedArtists.slice(0, 5) };
  }, [query, tracks]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches.slice(0, 9)];
      setRecentSearches(updated);
      localStorage.setItem("auralis-recent-searches", JSON.stringify(updated));
    }
  };

  const handlePlayTrack = (track: Track) => {
    onPlayTrack(track);
    handleSearch(track.title);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("auralis-recent-searches");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 md:pt-32 px-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl glass rounded-2xl border border-border/50 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-border/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tracks, artists, or genres..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-10 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Navigation */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { onNavigate?.("explore"); onClose(); }}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore
                </button>
                <button
                  onClick={() => { onNavigate?.("artists"); onClose(); }}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Artists
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* Results */}
              {query.trim() ? (
                <div className="p-4 space-y-6">
                  {/* Artists */}
                  {results.artists.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Artists</h3>
                      <div className="space-y-2">
                        {results.artists.map((artist, i) => (
                          <motion.button
                            key={i}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated/50 transition-colors text-left"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                              <Mic2 className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{artist}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracks */}
                  {results.tracks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Tracks</h3>
                      <div className="space-y-2">
                        {results.tracks.map((track, i) => (
                          <motion.button
                            key={track.id}
                            onClick={() => handlePlayTrack(track)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated/50 transition-colors text-left group"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-elevated flex items-center justify-center">
                              {track.cover_url ? (
                                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <Music2 className="w-5 h-5 text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{track.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.tracks.length === 0 && results.artists.length === 0 && (
                    <div className="text-center py-8">
                      <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No results found for "{query}"</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Recent Searches */
                <div className="p-4">
                  {recentSearches.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search, i) => (
                          <button
                            key={i}
                            onClick={() => setQuery(search)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated/50 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">{search}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Search for tracks, artists, or genres</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
