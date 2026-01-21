import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Play, Music2, MoreHorizontal, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  cover_url?: string;
  video_reel_url?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profile?: {
    display_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  like_count: number;
  is_liked: boolean;
}

interface PostProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    image_url?: string;
    track?: Track | null;
    profile?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  onPlayTrack?: (track: any) => void;
  onViewProfile?: (userId: string) => void;
}

const EnhancedFeedPost = ({ post, onPlayTrack, onViewProfile }: PostProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikeStatus();
    if (showComments) {
      fetchComments();
    }
  }, [post.id, showComments]);

  const fetchLikeStatus = async () => {
    try {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      
      setLikeCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single();
        
        setLiked(!!data);
      }
    } catch (error) {
      // Silent fail for like status
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (!data) return;

      // Fetch profiles for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Fetch like counts and status
      const commentIds = data.map(c => c.id);
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

      // Build comment tree
      const commentsWithData = data.map(comment => {
        const profile = profiles?.find(p => p.user_id === comment.user_id);
        const commentLikes = likes?.filter(l => l.comment_id === comment.id) || [];
        return {
          ...comment,
          profile,
          like_count: commentLikes.length,
          is_liked: user ? commentLikes.some(l => l.user_id === user.id) : false,
        };
      });

      // Organize into parent/child structure
      const topLevel = commentsWithData.filter(c => !c.parent_comment_id);
      const replies = commentsWithData.filter(c => c.parent_comment_id);

      const withReplies = topLevel.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_comment_id === comment.id),
      }));

      setComments(withReplies);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Sign in to like posts");
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: post.id, user_id: user.id });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) {
      toast.error("Sign in to like comments");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
      }
      fetchComments();
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim(),
        parent_comment_id: replyingTo?.id || null,
      });

      setNewComment("");
      setReplyingTo(null);
      fetchComments();
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
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
      toast.success("Copied to clipboard!");
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
        <motion.button
          onClick={() => onViewProfile?.(post.user_id)}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center overflow-hidden"
          whileHover={{ scale: 1.05 }}
        >
          {post.profile?.avatar_url ? (
            <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-foreground font-bold text-sm">
              {(post.profile?.display_name || "U")[0].toUpperCase()}
            </span>
          )}
        </motion.button>
        <div className="flex-1">
          <button 
            onClick={() => onViewProfile?.(post.user_id)}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {post.profile?.display_name || "User"}
          </button>
          <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
        </div>
        <button className="w-8 h-8 rounded-lg hover:bg-surface-elevated/50 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img 
            src={post.image_url} 
            alt="" 
            className="w-full aspect-square object-cover rounded-xl"
          />
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
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {comments.length > 0 && <span className="text-sm">{comments.length}</span>}
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/30 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Comment Input */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {user ? (user.email?.[0] || "U").toUpperCase() : "?"}
                  </span>
                </div>
                <div className="flex-1 relative">
                  {replyingTo && (
                    <div className="absolute -top-5 left-0 text-xs text-primary">
                      Replying to @{replyingTo.username}
                      <button 
                        onClick={() => setReplyingTo(null)} 
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 rounded-xl bg-surface-elevated/50 border border-border/50 text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  />
                </div>
                <motion.button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50"
                  whileTap={{ scale: 0.95 }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-primary-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Comments List */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => onViewProfile?.(comment.user_id)}
                          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                        >
                          {comment.profile?.avatar_url ? (
                            <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full gradient-secondary flex items-center justify-center">
                              <span className="text-xs font-bold text-secondary-foreground">
                                {(comment.profile?.display_name || "U")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onViewProfile?.(comment.user_id)}
                              className="text-sm font-medium text-foreground hover:text-primary"
                            >
                              {comment.profile?.display_name || "User"}
                            </button>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <button
                              onClick={() => handleLikeComment(comment.id, comment.is_liked)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                              {comment.like_count > 0 && comment.like_count}
                            </button>
                            <button
                              onClick={() => setReplyingTo({ id: comment.id, username: comment.profile?.display_name || "User" })}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <button
                                onClick={() => onViewProfile?.(reply.user_id)}
                                className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                              >
                                {reply.profile?.avatar_url ? (
                                  <img src={reply.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full gradient-secondary flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-secondary-foreground">
                                      {(reply.profile?.display_name || "U")[0].toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onViewProfile?.(reply.user_id)}
                                    className="text-xs font-medium text-foreground hover:text-primary"
                                  >
                                    {reply.profile?.display_name || "User"}
                                  </button>
                                  <span className="text-[10px] text-muted-foreground">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-xs text-foreground mt-0.5">{reply.content}</p>
                                <button
                                  onClick={() => handleLikeComment(reply.id, reply.is_liked)}
                                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1"
                                >
                                  <Heart className={`w-2.5 h-2.5 ${reply.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                  {reply.like_count > 0 && reply.like_count}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedFeedPost;
