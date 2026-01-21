import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  cover_url?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onSuccess?: () => void;
}

const CreatePostModal = ({ isOpen, onClose, tracks, onSuccess }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }

    if (!content.trim() && !selectedTrack) {
      toast.error("Please add some content or share a track");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        track_id: selectedTrack?.id || null,
      });

      if (error) throw error;

      toast.success("Posted!");
      setContent("");
      setSelectedTrack(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Post error:", error);
      toast.error("Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTracks = tracks.filter(t => t.id); // In real app, filter by user_id

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg glass rounded-2xl border border-border/50 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-foreground">Create Post</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-surface-elevated/50 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your thoughts or a new release..."
                className="w-full h-32 px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none resize-none"
              />

              {/* Selected Track */}
              {selectedTrack && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/30">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    {selectedTrack.cover_url ? (
                      <img src={selectedTrack.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music2 className="w-5 h-5 text-primary/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{selectedTrack.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{selectedTrack.artist_name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTrack(null)}
                    className="w-8 h-8 rounded-lg hover:bg-surface-elevated/50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              {/* Track Picker */}
              {showTrackPicker && !selectedTrack && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userTracks.length > 0 ? (
                    userTracks.map(track => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setSelectedTrack(track);
                          setShowTrackPicker(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          {track.cover_url ? (
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music2 className="w-4 h-4 text-primary/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">No tracks to share</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border/30 flex items-center justify-between">
              <button
                onClick={() => setShowTrackPicker(!showTrackPicker)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-elevated/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Music2 className="w-4 h-4" />
                <span className="text-sm">Share Track</span>
              </button>

              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !selectedTrack)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
