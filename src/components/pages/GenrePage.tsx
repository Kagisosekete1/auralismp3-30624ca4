import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { allGenres, searchGenres } from "@/data/genres";
import { supabase } from "@/integrations/supabase/client";

interface GenreWithCount {
  name: string;
  region: string;
  color: string;
  trackCount: number;
}

interface GenrePageProps {
  onSelectGenre?: (genre: string) => void;
}

const GenrePage = ({ onSelectGenre }: GenrePageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

  const sortedGenres = useMemo(() => {
    return [...genresWithCounts].sort((a, b) => {
      if (b.trackCount !== a.trackCount) return b.trackCount - a.trackCount;
      return a.name.localeCompare(b.name);
    });
  }, [genresWithCounts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.01 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-6 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2">Genres</h1>
          <p className="text-muted-foreground text-sm md:text-base">Browse by genre</p>
        </motion.div>

        {/* Search */}
        <motion.div className="mt-4 relative max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search genres..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-lg bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Genre List - Compact chips */}
      <section className="px-4 md:px-8 py-4">
        <p className="text-xs text-muted-foreground mb-3">
          {sortedGenres.length} genres{loading && " • Loading..."}
        </p>
        <motion.div 
          className="flex flex-wrap gap-2" 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
        >
          {sortedGenres.map((genre, index) => (
            <motion.button
              key={index}
              onClick={() => onSelectGenre?.(genre.name)}
              className="px-3 py-1.5 rounded-full bg-surface-elevated/50 border border-border/30 hover:border-primary/50 hover:bg-surface-elevated transition-all text-left group"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {genre.name}
              </span>
              {genre.trackCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({genre.trackCount})
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {sortedGenres.length === 0 && (
        <section className="px-4 md:px-8 py-6">
          <div className="glass rounded-xl p-6 text-center border border-border/30">
            <h3 className="text-sm font-medium text-foreground mb-1">No genres found</h3>
            <p className="text-muted-foreground text-xs">Try a different search term</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default GenrePage;
