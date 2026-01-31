import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Plus, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  gradient?: string;
  track_count?: number;
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

const AddToPlaylistModal = ({ isOpen, onClose, trackId, trackTitle }: AddToPlaylistModalProps) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      fetchPlaylists();
      checkExistingAdditions();
    }
  }, [isOpen, user, trackId]);

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) {
        // Get track counts for each playlist
        const playlistsWithCounts = await Promise.all(
          data.map(async (playlist) => {
            const { count } = await supabase
              .from("playlist_tracks")
              .select("*", { count: "exact", head: true })
              .eq("playlist_id", playlist.id);
            
            return { ...playlist, track_count: count || 0 };
          })
        );
        setPlaylists(playlistsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAdditions = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("playlist_tracks")
      .select("playlist_id")
      .eq("track_id", trackId);
    
    if (data) {
      setAddedTo(new Set(data.map(pt => pt.playlist_id)));
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user || addedTo.has(playlistId)) return;
    
    try {
      setAddingTo(playlistId);
      
      // Get current max position
      const { data: existing } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      
      const nextPosition = (existing?.[0]?.position ?? -1) + 1;
      
      const { error } = await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: nextPosition,
        });
      
      if (error) throw error;
      
      setAddedTo(prev => new Set([...prev, playlistId]));
      toast.success("Added to playlist!");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.info("Track already in playlist");
        setAddedTo(prev => new Set([...prev, playlistId]));
      } else {
        toast.error("Failed to add to playlist");
      }
    } finally {
      setAddingTo(null);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;
    
    try {
      setCreating(true);
      
      const gradients = [
        "from-primary to-accent",
        "from-secondary to-primary",
        "from-accent to-secondary",
      ];
      
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
          gradient: gradients[Math.floor(Math.random() * gradients.length)],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add track to new playlist
      await supabase
        .from("playlist_tracks")
        .insert({
          playlist_id: data.id,
          track_id: trackId,
          position: 0,
        });
      
      setPlaylists(prev => [{ ...data, track_count: 1 }, ...prev]);
      setAddedTo(prev => new Set([...prev, data.id]));
      setNewPlaylistName("");
      setShowCreate(false);
      toast.success(`Created "${data.name}" and added track!`);
    } catch (error) {
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md glass-strong rounded-2xl border border-border/50 overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground">
                      Add to Playlist
                    </h2>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {trackTitle}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Create New */}
              <div className="p-4 border-b border-border/30">
                {showCreate ? (
                  <form onSubmit={handleCreatePlaylist} className="flex gap-2">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name..."
                      className="flex-1 px-3 py-2 rounded-lg bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground outline-none"
                      autoFocus
                    />
                    <motion.button
                      type="submit"
                      disabled={creating || !newPlaylistName.trim()}
                      className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                      whileTap={{ scale: 0.95 }}
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-3 py-2 rounded-lg glass text-foreground text-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                  </form>
                ) : (
                  <motion.button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass border border-dashed border-border/50 hover:border-primary/30 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground text-sm">Create New Playlist</span>
                  </motion.button>
                )}
              </div>

              {/* Playlists List */}
              <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No playlists yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create one above to get started</p>
                  </div>
                ) : (
                  playlists.map((playlist) => {
                    const isAdded = addedTo.has(playlist.id);
                    const isAdding = addingTo === playlist.id;
                    
                    return (
                      <motion.button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={isAdded || isAdding}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isAdded 
                            ? "glass border border-primary/30 bg-primary/5" 
                            : "glass border border-border/30 hover:border-primary/30"
                        }`}
                        whileHover={!isAdded ? { scale: 1.01 } : undefined}
                        whileTap={!isAdded ? { scale: 0.99 } : undefined}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${playlist.gradient || 'from-primary to-accent'} flex items-center justify-center`}>
                          <Music2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground text-sm truncate">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground">{playlist.track_count} tracks</p>
                        </div>
                        {isAdding ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddToPlaylistModal;
