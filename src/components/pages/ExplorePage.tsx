import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Music2, Flame, Calendar } from "lucide-react";
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
  const [weeklyTracks, setWeeklyTracks] = useState<Track[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSections();

    const tracksChannel = supabase
      .channel('explore-tracks-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracks' }, (payload) => {
        const updated = payload.new as any;
        const updater = (prev: Track[]) => prev.map(t => t.id === updated.id ? { ...t, play_count: updated.play_count } : t);
        setTrendingTracks(updater);
        setWeeklyTracks(updater);
        setGenreTracks(updater);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tracksChannel);
    };
  }, [userPreferredGenre]);

  const fetchAllSections = async () => {
    try {
      setLoading(true);

      // Fetch all-time trending
      const { data: trending } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(12);
      setTrendingTracks(trending || []);

      // Fetch most played this week via play_history
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklyPlays } = await supabase
        .from("play_history")
        .select("track_id")
        .gte("played_at", oneWeekAgo.toISOString());

      if (weeklyPlays && weeklyPlays.length > 0) {
        // Count plays per track
        const playCounts: Record<string, number> = {};
        weeklyPlays.forEach(p => {
          playCounts[p.track_id] = (playCounts[p.track_id] || 0) + 1;
        });

        // Sort by count, take top 12
        const topIds = Object.entries(playCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12)
          .map(([id]) => id);

        if (topIds.length > 0) {
          const { data: weeklyData } = await supabase
            .from("tracks")
            .select("*")
            .in("id", topIds)
            .eq("is_approved", true);

          // Sort by weekly play count
          const sorted = (weeklyData || []).sort((a, b) => {
            return (playCounts[b.id] || 0) - (playCounts[a.id] || 0);
          });
          setWeeklyTracks(sorted);
        }
      }

      // Fetch genre-based
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
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const mergedTracks = tracks.map(t => {
    const trending = trendingTracks.find(tt => tt.id === t.id);
    return trending ? { ...t, play_count: trending.play_count } : t;
  });

  const SectionHeader = ({ icon: Icon, title, color = "text-primary" }: { icon: any; title: string; color?: string }) => (
    <div className="flex items-center gap-2.5 mb-5 md:mb-6">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <h2 className="text-lg md:text-2xl font-display font-bold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-5xl font-display font-bold text-foreground mb-1.5">Explore</h1>
          <p className="text-muted-foreground text-sm md:text-lg">Discover trending music and new releases</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={onPlayAll} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
              Play All
            </button>
            <button onClick={onShuffleAll} className="px-4 py-2 rounded-xl glass border border-border/30 text-foreground text-sm font-semibold">
              Shuffle All
            </button>
          </div>
        </motion.div>
      </div>

      {/* Most Played This Week */}
      <section className="px-4 md:px-8 pt-6 pb-2">
        <SectionHeader icon={Calendar} title="Most Played This Week" color="text-accent" />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : weeklyTracks.length === 0 ? (
          <div className="glass rounded-2xl p-6 md:p-10 text-center border border-border/30">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-display font-bold text-foreground mb-1">No weekly data yet</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">Play some tracks and they'll show up here!</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {weeklyTracks.map((track) => (
              <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Trending Now */}
      <section className="px-4 md:px-8 py-5">
        <SectionHeader icon={Flame} title="Trending Now" />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trendingTracks.length === 0 ? (
          <div className="glass rounded-2xl p-6 md:p-10 text-center border border-border/30">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-display font-bold text-foreground mb-1">No trending tracks yet</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">Tracks with the most plays will appear here</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
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

      {/* Genre-based */}
      {userPreferredGenre && genreTracks.length > 0 && (
        <section className="px-4 md:px-8 py-5">
          <SectionHeader icon={Music2} title={`More ${userPreferredGenre}`} color="text-secondary" />
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
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

      {/* All Tracks */}
      <section className="px-4 md:px-8 py-5">
        <h2 className="text-lg md:text-2xl font-display font-bold text-foreground mb-5 md:mb-6">All Tracks</h2>
        {mergedTracks.length === 0 ? (
          <div className="glass rounded-2xl p-6 md:p-10 text-center border border-border/30">
            <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-display font-bold text-foreground mb-1">No tracks uploaded yet</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">Be the first to upload music!</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
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
