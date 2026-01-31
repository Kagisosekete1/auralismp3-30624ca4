import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Music2, Play, Plus, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allGenres } from "@/data/genres";

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
  }, [userPreferredGenre]);

  const fetchTrendingAndGenreTracks = async () => {
    try {
      setLoading(true);
      
      // Fetch trending tracks (sorted by plays + likes)
      const { data: trending } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(12);
      
      setTrendingTracks(trending || []);

      // Fetch tracks by preferred genre or most popular genre
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const TrackCard = ({ track }: { track: Track }) => (
    <motion.div
      className="group glass rounded-xl md:rounded-2xl p-3 md:p-4 text-left border border-border/30 hover:border-primary/30 transition-all"
      variants={itemVariants}
      whileHover={{ y: -8 }}
    >
      <div 
        className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-transform overflow-hidden cursor-pointer"
        onClick={() => onPlayTrack?.(track)}
      >
        {track.cover_url ? (
          <img 
            src={track.cover_url} 
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music2 className="w-8 md:w-12 h-8 md:h-12 text-primary/60" />
        )}
        <motion.div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </motion.div>
      </div>
      <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5 md:mb-1 truncate group-hover:text-primary transition-colors">
        {track.title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
        {track.artist_name}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {track.play_count || 0} plays
        </span>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist?.(track);
          }}
          className="p-1.5 rounded-lg bg-surface-elevated/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );

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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trendingTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {genreTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </motion.div>
        </section>
      )}

      {/* All Tracks Section */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          All Tracks
        </h2>
        {tracks.length === 0 ? (
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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
