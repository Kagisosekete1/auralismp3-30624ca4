import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Music2, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrackCard from "../TrackCard";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  genre?: string;
  play_count?: number;
  like_count?: number;
}

interface ExplorePageProps {
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  userPreferredGenre?: string;
}

const ExplorePage = ({ tracks = [], onPlayTrack, onAddToPlaylist, userPreferredGenre }: ExplorePageProps) => {
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingAndGenreTracks();

    // Realtime subscription for live play count updates
    const tracksChannel = supabase
      .channel('explore-tracks-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracks' }, (payload) => {
        const updated = payload.new as any;
        setTrendingTracks(prev => prev.map(t => t.id === updated.id ? { ...t, play_count: updated.play_count } : t));
        setGenreTracks(prev => prev.map(t => t.id === updated.id ? { ...t, play_count: updated.play_count } : t));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tracksChannel);
    };
  }, [userPreferredGenre]);

  const fetchTrendingAndGenreTracks = async () => {
    try {
      setLoading(true);
      
      const { data: trending } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(12);
      
      setTrendingTracks(trending || []);

      if (userPreferredGenre) {
        const { data: genreData } = await supabase
          .from("tracks")
          .select("*")
          .eq("is_approved", true)
          .eq("genre", userPreferredGenre)
          .order("play_count", { ascending: false })
          .limit(12);
        
        setGenreTracks(genreData || []);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  // Merge live track data from props with realtime updates
  const mergedTracks = tracks.map(t => {
    const trending = trendingTracks.find(tt => tt.id === t.id);
    return trending ? { ...t, play_count: trending.play_count } : t;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Explore
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Discover trending music and new releases
          </p>
        </motion.div>
      </div>

      {/* Trending Section */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Flame className="w-6 h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Trending Now
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trendingTracks.length === 0 ? (
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              No trending tracks yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Tracks with the most plays and likes will appear here
            </p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trendingTracks.map((track) => (
              <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Genre-based Section */}
      {userPreferredGenre && genreTracks.length > 0 && (
        <section className="px-4 md:px-8 py-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Music2 className="w-6 h-6 text-accent" />
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
              More {userPreferredGenre}
            </h2>
          </div>
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {genreTracks.map((track) => (
              <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </motion.div>
        </section>
      )}

      {/* All Tracks Section */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          All Tracks
        </h2>
        {mergedTracks.length === 0 ? (
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              No tracks uploaded yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Be the first to upload music! Tracks uploaded by artists will appear here for everyone to enjoy.
            </p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {mergedTracks.map((track) => (
              <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
