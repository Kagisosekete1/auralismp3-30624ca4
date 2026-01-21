import { motion } from "framer-motion";
import { Mic2, Search, UserPlus, Play } from "lucide-react";
import { useState } from "react";

const ArtistsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Artists
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Find and follow your favorite artists
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-6 md:mt-8 relative max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 focus:bg-surface-elevated text-foreground placeholder:text-muted-foreground outline-none transition-all text-base"
          />
        </motion.div>
      </div>

      {/* Following Section */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Artists You Follow
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Mic2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No artists followed yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            Search for artists and follow them to see their music here
          </p>
        </div>
      </section>

      {/* Featured Artists - Empty state waiting for real artists */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Featured Artists
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-4">
            <Mic2 className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No featured artists yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Artists will appear here as they upload music
          </p>
        </div>
      </section>

    </div>
  );
};

export default ArtistsPage;
