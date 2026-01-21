import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Heart, Share2, Music2, Clock, TrendingUp, User, Disc3, BarChart2 } from "lucide-react";
import { useState } from "react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: number;
  play_count?: number;
  like_count?: number;
  created_at?: string;
  is_explicit?: boolean;
}

interface TrackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onPlay: (track: Track) => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onViewArtist?: (artistName: string) => void;
}

const TrackDetailModal = ({ isOpen, onClose, track, onPlay, isLiked, onToggleLike, onViewArtist }: TrackDetailModalProps) => {
  if (!track) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    const shareText = `Check out "${track.title}" by ${track.artist_name} on Auralis!`;
    if (navigator.share) {
      await navigator.share({ text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg glass rounded-2xl border border-border/50 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cover Art */}
            <div className="relative aspect-square max-h-64 w-full">
              {track.cover_url ? (
                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <Music2 className="w-24 h-24 text-primary-foreground/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Play Button */}
              <motion.button
                onClick={() => onPlay(track)}
                className="absolute bottom-4 right-4 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-1" />
              </motion.button>

              {/* Title Overlay */}
              <div className="absolute bottom-4 left-4 right-20">
                <div className="flex items-center gap-2 mb-1">
                  {track.is_explicit && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">E</span>
                  )}
                  {track.genre && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">{track.genre}</span>
                  )}
                </div>
                <h2 className="text-xl font-display font-bold text-white truncate">{track.title}</h2>
                <button
                  onClick={() => onViewArtist?.(track.artist_name)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {track.artist_name}
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{track.play_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Plays</p>
                </div>
                <div className="text-center">
                  <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{track.like_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{formatDuration(track.duration)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {track.bpm && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated/30">
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">BPM</p>
                      <p className="text-sm font-medium text-foreground">{track.bpm}</p>
                    </div>
                  </div>
                )}
                {track.key && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated/30">
                    <Disc3 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Key</p>
                      <p className="text-sm font-medium text-foreground">{track.key}</p>
                    </div>
                  </div>
                )}
              </div>

              {track.created_at && (
                <p className="text-sm text-muted-foreground text-center">
                  Released {formatDate(track.created_at)}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  onClick={onToggleLike}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                    isLiked 
                      ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                      : 'border-border/50 text-foreground hover:bg-surface-elevated/50'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </motion.button>
                <motion.button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/50 text-foreground hover:bg-surface-elevated/50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </motion.button>
              </div>

              {/* View Artist */}
              <motion.button
                onClick={() => onViewArtist?.(track.artist_name)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors"
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{track.artist_name}</p>
                  <p className="text-sm text-muted-foreground">View artist profile</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrackDetailModal;
