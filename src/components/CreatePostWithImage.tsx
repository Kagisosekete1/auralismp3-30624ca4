import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Music2, Loader2, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  cover_url?: string;
}

interface CreatePostWithImageProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  userProfile?: {
    display_name?: string;
    avatar_url?: string;
  };
  onSuccess?: () => void;
}

const CreatePostWithImage = ({ isOpen, onClose, tracks, userProfile, onSuccess }: CreatePostWithImageProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }

    if (!content.trim() && !selectedTrack && !imageFile) {
      toast.error("Please add some content, an image, or share a track");
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("covers")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create post
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim() || null,
        track_id: selectedTrack?.id || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Post shared!");
      setContent("");
      setSelectedTrack(null);
      handleRemoveImage();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to share post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full md:max-w-lg glass rounded-t-2xl md:rounded-2xl border border-border/50 overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center">
                    <span className="font-bold text-primary-foreground">
                      {(userProfile?.display_name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{userProfile?.display_name || "You"}</p>
                <p className="text-xs text-muted-foreground">Public post</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[120px] bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-lg"
              autoFocus
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <motion.button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            )}

            {/* Selected Track */}
            {selectedTrack && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/30 border border-border/30">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  {selectedTrack.cover_url ? (
                    <img src={selectedTrack.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{selectedTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedTrack.artist_name}</p>
                </div>
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Track Picker */}
            {showTrackPicker && (
              <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border border-border/30">
                {tracks.length > 0 ? (
                  tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrack(track);
                        setShowTrackPicker(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-elevated/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full gradient-secondary flex items-center justify-center">
                            <Music2 className="w-4 h-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-foreground text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground text-sm">No tracks to share</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Image className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={() => setShowTrackPicker(!showTrackPicker)}
                className={`w-10 h-10 rounded-xl glass flex items-center justify-center transition-colors ${
                  showTrackPicker ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Music2 className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !selectedTrack && !imageFile)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium disabled:opacity-50"
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
    </AnimatePresence>
  );
};

export default CreatePostWithImage;
