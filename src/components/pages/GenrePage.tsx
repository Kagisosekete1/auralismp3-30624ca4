import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Music2, Play, Search, X } from "lucide-react";
import { allGenres, searchGenres } from "@/data/genres";

const GenrePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return allGenres;
    return searchGenres(searchQuery);
  }, [searchQuery]);

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
        <p className="text-sm text-muted-foreground mb-4">{filteredGenres.length} genres available</p>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" variants={containerVariants} initial="hidden" animate="visible">
          {filteredGenres.map((genre, index) => (
            <motion.button
              key={index}
              className={`group relative aspect-square rounded-xl bg-gradient-to-br ${genre.color} p-4 overflow-hidden`}
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="relative flex flex-col h-full justify-between">
                <h3 className="font-display font-bold text-white text-sm md:text-base">{genre.name}</h3>
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

      {filteredGenres.length === 0 && (
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
