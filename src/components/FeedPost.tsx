import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Play, Music2, MoreHorizontal } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  cover_url?: string;
}

interface PostProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    track?: Track | null;
    profile?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  onPlayTrack?: (track: any) => void;
}

const FeedPost = ({ post, onPlayTrack }: PostProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleShare = async () => {
    const shareText = post.track 
      ? `Check out "${post.track.title}" by ${post.track.artist_name} on Auralis!`
      : post.content;

    if (navigator.share) {
      await navigator.share({ text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <motion.div
      className="glass rounded-2xl border border-border/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          {post.profile?.avatar_url ? (
            <img src={post.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-primary-foreground font-bold text-sm">
              {(post.profile?.display_name || "U")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{post.profile?.display_name || "User"}</p>
          <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
        </div>
        <button className="w-8 h-8 rounded-lg hover:bg-surface-elevated/50 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground">{post.content}</p>
        </div>
      )}

      {/* Track Card */}
      {post.track && (
        <div className="mx-4 mb-4">
          <motion.button
            onClick={() => onPlayTrack?.(post.track)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors text-left group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {post.track.cover_url ? (
                <img src={post.track.cover_url} alt={post.track.title} className="w-full h-full object-cover" />
              ) : (
                <Music2 className="w-6 h-6 text-primary/60" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{post.track.title}</p>
              <p className="text-sm text-muted-foreground truncate">{post.track.artist_name}</p>
            </div>
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </motion.button>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center gap-6">
        <motion.button
          onClick={handleLike}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
        </motion.button>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default FeedPost;
