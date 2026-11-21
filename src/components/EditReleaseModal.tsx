import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { allGenres } from "@/data/genres";
import SearchablePicker, { type PickerOption } from "@/components/SearchablePicker";

const editGenreOptions: PickerOption[] = allGenres.map(({ name }) => ({ value: name, label: name }));
const editVersionOptions: PickerOption[] = ["original", "remix", "acoustic", "instrumental", "live", "clean"].map((version) => ({ value: version, label: version.replace(/^./, (letter) => letter.toUpperCase()) }));

interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre?: string;
  secondary_genre?: string;
  bpm?: number;
  key?: string;
  is_explicit: boolean;
  version?: string;
  cover_url?: string;
}

interface EditReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onSuccess?: () => void;
  onDelete?: () => void;
}

const EditReleaseModal = ({ isOpen, onClose, track, onSuccess, onDelete }: EditReleaseModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    artist_name: "",
    genre: "",
    secondary_genre: "",
    bpm: "",
    key: "",
    is_explicit: false,
    version: "original",
  });

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || "",
        artist_name: track.artist_name || "",
        genre: track.genre || "",
        secondary_genre: track.secondary_genre || "",
        bpm: track.bpm?.toString() || "",
        key: track.key || "",
        is_explicit: track.is_explicit || false,
        version: track.version || "original",
      });
    }
  }, [track]);

  const handleSubmit = async () => {
    if (!user || !track) return;

    if (!formData.title.trim() || !formData.artist_name.trim()) {
      toast.error("Title and artist name are required");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("tracks")
        .update({
          title: formData.title.trim(),
          artist_name: formData.artist_name.trim(),
          genre: formData.genre || null,
          secondary_genre: formData.secondary_genre || null,
          bpm: formData.bpm ? parseInt(formData.bpm) : null,
          key: formData.key || null,
          is_explicit: formData.is_explicit,
          version: formData.version,
        })
        .eq("id", track.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Release updated successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating track:", error);
      toast.error("Failed to update release");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !track) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", track.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Release deleted");
      onDelete?.();
      onClose();
    } catch (error) {
      console.error("Error deleting track:", error);
      toast.error("Failed to delete release");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground">Edit Release</h2>
                <p className="text-sm text-muted-foreground">Update your track details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                placeholder="Track title"
              />
            </div>

            {/* Artist Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Artist Name *</label>
              <input
                type="text"
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                placeholder="Artist name"
              />
            </div>

            {/* Genres */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Primary Genre</label>
                <SearchablePicker value={formData.genre} options={editGenreOptions} onChange={(genre) => setFormData({ ...formData, genre })} title="Select primary genre" placeholder="Search genres..." emptyLabel="Select genre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Secondary Genre</label>
                <SearchablePicker value={formData.secondary_genre} options={editGenreOptions} onChange={(secondary_genre) => setFormData({ ...formData, secondary_genre })} title="Select secondary genre" placeholder="Search genres..." emptyLabel="Select genre" optional />
              </div>
            </div>

            {/* BPM and Key */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">BPM</label>
                <input
                  type="number"
                  value={formData.bpm}
                  onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground outline-none focus:border-primary/50"
                  placeholder="120"
                  min="1"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground outline-none focus:border-primary/50"
                  placeholder="C Major"
                />
              </div>
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Version</label>
              <SearchablePicker value={formData.version} options={editVersionOptions} onChange={(version) => setFormData({ ...formData, version })} title="Select release version" />
            </div>

            {/* Explicit */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_explicit}
                onChange={(e) => setFormData({ ...formData, is_explicit: e.target.checked })}
                className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/50"
              />
              <span className="text-sm text-foreground">Contains explicit content</span>
            </label>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/30 flex items-center justify-between">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-destructive">Delete this release?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg glass text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>
            )}

            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditReleaseModal;
