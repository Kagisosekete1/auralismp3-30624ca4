import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Library, Music2, Clock, Plus, Play, AlertCircle } from "lucide-react";
import type { Playlist } from "@/hooks/useAppState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "../EmptyState";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
}

interface RecentPlay {
  id: string;
  track: Track;
  played_at: string;
}

export interface LibraryPageProps {
  playlists: Playlist[];
  likedCount: number;
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
  onLikedSongs: () => void;
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  isArtist?: boolean;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
}

const LibraryPage = ({ playlists, likedCount, onCreatePlaylist, onSelectPlaylist, onLikedSongs, tracks = [], onPlayTrack, isArtist = false }: LibraryPageProps) => {
  const { user } = useAuth();
  const [recentPlays, setRecentPlays] = useState<RecentPlay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPlays = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("play_history")
          .select(`*, tracks(*)`)
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(20);

        if (data) {
          setRecentPlays(data.map(p => ({
            id: p.id,
            track: p.tracks as unknown as Track,
            played_at: p.played_at,
          })).filter(p => p.track));
        }
      } catch (error) {
        console.error("Error fetching recent plays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPlays();

    // Realtime subscription
    const channel = supabase
      .channel('library-play-history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'play_history' }, () => {
        fetchRecentPlays();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">Your Library</h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">All your music in one place</p>
        </motion.div>
      </div>

      {/* Artist Notice */}
      {isArtist && (
        <section className="px-4 md:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 border border-border/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              As an artist, you cannot like your own songs. Your liked songs will appear here when you like songs from other artists.
            </p>
          </motion.div>
        </section>
      )}

      {/* Recently Played - Vertical List */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Recently Played</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : recentPlays.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center border border-border/30">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recently played tracks</p>
          </div>
        ) : (
          <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
            {recentPlays.map((play) => (
              <motion.button
                key={play.id}
                onClick={() => onPlayTrack?.(play.track)}
                className="w-full flex items-center gap-3 p-3 rounded-xl glass border border-border/30 hover:border-primary/30 transition-all text-left group"
                variants={itemVariants}
                whileHover={{ x: 4 }}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  {play.track.cover_url ? (
                    <img src={play.track.cover_url} alt={play.track.title} className="w-full h-full object-cover" />
                  ) : (
                    <Music2 className="w-5 h-5 text-primary/60" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">{play.track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{play.track.artist_name}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(play.played_at)}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>

      {/* Playlists */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Playlists</h2>
          <motion.button
            onClick={onCreatePlaylist}
            className="px-3 md:px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Playlist</span>
          </motion.button>
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No playlists yet"
            description="Create your first playlist to start organizing your music"
            actionLabel="Create Playlist"
            onAction={onCreatePlaylist}
          />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {playlists.map((playlist) => (
              <motion.button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className="group glass rounded-xl md:rounded-2xl p-3 md:p-4 text-left border border-border/30 hover:border-primary/30 transition-all"
                variants={itemVariants}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                  <Music2 className="w-8 md:w-12 h-8 md:h-12 text-primary-foreground/80" />
                  <motion.div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </motion.div>
                </div>
                <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5 md:mb-1 truncate group-hover:text-primary transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">{playlist.tracks.length} songs</p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default LibraryPage;
