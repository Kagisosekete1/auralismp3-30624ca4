import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Music2, TrendingUp, Clock, Play, Send, ListPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedFeedPost from "../EnhancedFeedPost";
import CreatePostModal from "../CreatePostModal";
import type { Playlist } from "@/hooks/useAppState";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  play_count?: number;
}

export interface HomePageProps {
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
  onUploadMusic: () => void;
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  onViewProfile?: (userId: string) => void;
  onAddToPlaylist?: (trackId: string) => void;
}

const HomePage = ({ playlists, onCreatePlaylist, onSelectPlaylist, onUploadMusic, tracks = [], onPlayTrack, onViewProfile, onAddToPlaylist }: HomePageProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalListenTime, setTotalListenTime] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();

    // Realtime subscription for posts
    const postsChannel = supabase
      .channel('home-posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    // Realtime subscription for play stats
    const playsChannel = supabase
      .channel('home-plays-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_history' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(playsChannel);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`*, tracks(id, title, artist_name, cover_url, audio_url, video_reel_url), profiles(display_name, avatar_url)`)
      .order("created_at", { ascending: false })
      .limit(30);
    
    if (data) {
      setPosts(data.map(p => ({ ...p, track: p.tracks, profile: p.profiles })));
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch total plays on user's tracks (from other users)
      const { data: userTracks } = await supabase
        .from("tracks")
        .select("id, play_count")
        .eq("user_id", user.id);

      if (userTracks) {
        const plays = userTracks.reduce((sum, track) => sum + (track.play_count || 0), 0);
        setTotalPlays(plays);
      }

      // Fetch listen time (from play_history)
      const { count } = await supabase
        .from("play_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Approximate 3 minutes per play
      setTotalListenTime(Math.floor((count || 0) * 3 / 60));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Hero */}
      <div className="relative gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">{getGreeting()}</h1>
          <p className="text-muted-foreground text-base md:text-lg">Welcome to Auralis. Start building your music library.</p>
        </motion.div>
      </div>

      {/* Stats Bubbles - Realtime */}
      <section className="px-4 md:px-8 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <motion.div className="flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-border/30 whitespace-nowrap">
            <Music2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{tracks.length} Total Tracks</span>
          </motion.div>
          <motion.div className="flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-border/30 whitespace-nowrap">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{totalPlays.toLocaleString()} Plays</span>
          </motion.div>
          <motion.div className="flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-border/30 whitespace-nowrap">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{totalListenTime}h Listen Time</span>
          </motion.div>
        </div>
      </section>

      {/* Create Post Bar */}
      {user && (
        <section className="px-4 md:px-8 py-4">
          <motion.button
            onClick={() => setShowCreatePost(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl glass border border-border/30 hover:border-primary/30 transition-colors text-left"
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {(user.email?.[0] || "Y").toUpperCase()}
              </span>
            </div>
            <span className="flex-1 text-muted-foreground">Share your thoughts or a new release...</span>
            <Send className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </section>
      )}

      {/* Feed - Realtime */}
      <section className="px-4 md:px-8 py-4">
        <h2 className="text-xl font-display font-bold text-foreground mb-4">Feed</h2>
        {posts.length > 0 ? (
          <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
            {posts.map(post => (
              <EnhancedFeedPost 
                key={post.id} 
                post={post} 
                onPlayTrack={onPlayTrack}
                onViewProfile={onViewProfile}
              />
            ))}
          </motion.div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center border border-border/30">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-sm">Be the first to share something!</p>
          </div>
        )}
      </section>

      {/* Recently Uploaded */}
      {tracks.length > 0 && (
        <section className="px-4 md:px-8 py-6">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">Recently Uploaded</h2>
          <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" variants={containerVariants} initial="hidden" animate="visible">
            {tracks.slice(0, 12).map((track) => (
              <motion.div key={track.id} className="group glass rounded-xl p-3 border border-border/30 hover:border-primary/30 transition-all" variants={itemVariants} whileHover={{ y: -8 }}>
                <button onClick={() => onPlayTrack?.(track)} className="w-full text-left">
                  <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 overflow-hidden">
                    {track.cover_url ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" /> : <Music2 className="w-8 h-8 text-primary/60" />}
                    <motion.div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                    </motion.div>
                  </div>
                  <h3 className="font-medium text-foreground text-sm truncate">{track.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                </button>
                {/* Add to Playlist Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist?.(track.id);
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated text-xs text-muted-foreground hover:text-foreground transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  Add to Playlist
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} tracks={tracks} onSuccess={fetchPosts} />
    </div>
  );
};

export default HomePage;
