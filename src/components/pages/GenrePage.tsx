import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Music2, Play, Search, X, TrendingUp } from "lucide-react";
import { allGenres, searchGenres } from "@/data/genres";
import { supabase } from "@/integrations/supabase/client";

interface GenreWithCount {
  name: string;
  region: string;
  color: string;
  trackCount: number;
}

const GenrePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch track counts per genre
  useEffect(() => {
    const fetchGenreCounts = async () => {
      try {
        const { data: tracks, error } = await supabase
          .from("tracks")
          .select("genre, secondary_genre")
          .eq("is_approved", true);

        if (error) throw error;

        const counts: Record<string, number> = {};
        tracks?.forEach(track => {
          if (track.genre) {
            counts[track.genre] = (counts[track.genre] || 0) + 1;
          }
          if (track.secondary_genre) {
            counts[track.secondary_genre] = (counts[track.secondary_genre] || 0) + 1;
          }
        });
        setGenreCounts(counts);
      } catch (error) {
        console.error("Error fetching genre counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('genre-track-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, () => {
        fetchGenreCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const genresWithCounts: GenreWithCount[] = useMemo(() => {
    const base = searchQuery.trim() ? searchGenres(searchQuery) : allGenres;
    return base.map(genre => ({
      ...genre,
      trackCount: genreCounts[genre.name] || 0
    }));
  }, [searchQuery, genreCounts]);

  // Sort by track count (most popular first), then alphabetically
  const sortedGenres = useMemo(() => {
    return [...genresWithCounts].sort((a, b) => {
      if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount;
      return a.name.localeCompare(b.name);
    });
  }, [genresWithCounts]);

  const totalTracks = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);
  const activeGenres = Object.keys(genreCounts).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.02 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">Genres</h1>
          <p className="text-muted-foreground text-base md:text-lg">Browse music by genre and discover your new favorites</p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="mt-4 flex gap-4 flex-wrap"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }}
        >
          <div className="glass rounded-xl px-4 py-2 border border-border/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{activeGenres} active genres</span>
            </div>
          </div>
          <div className="glass rounded-xl px-4 py-2 border border-border/30">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">{totalTracks} total tracks</span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div className="mt-6 relative max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search genres (e.g., Amapiano, Afrobeats, Drill...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Genre Grid */}
      <section className="px-4 md:px-8 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          {sortedGenres.length} genres available
          {loading && " • Loading track counts..."}
        </p>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" variants={containerVariants} initial="hidden" animate="visible">
          {sortedGenres.map((genre, index) => (
            <motion.button
              key={index}
              className={`group relative aspect-square rounded-xl bg-gradient-to-br ${genre.color} p-4 overflow-hidden`}
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="relative flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-display font-bold text-white text-sm md:text-base text-left">{genre.name}</h3>
                  {genre.trackCount > 0 && (
                    <p className="text-white/90 text-xs mt-1 flex items-center gap-1">
                      <Music2 className="w-3 h-3" />
                      {genre.trackCount} {genre.trackCount === 1 ? 'song' : 'songs'}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-xs">{genre.region}</span>
                  <motion.div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                  </motion.div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
            </motion.button>
          ))}
        </motion.div>
      </section>

      {sortedGenres.length === 0 && (
        <section className="px-4 md:px-8 py-6">
          <div className="glass rounded-2xl p-8 text-center border border-border/30">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">No genres found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default GenrePage;
