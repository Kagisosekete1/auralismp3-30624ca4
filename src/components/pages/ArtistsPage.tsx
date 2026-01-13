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

      {/* Featured Artists */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Featured Artists
        </h2>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Empty artist cards as placeholders */}
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <motion.button
              key={index}
              className="group glass rounded-xl md:rounded-2xl p-4 md:p-6 text-center border border-border/30 hover:border-primary/30 transition-all"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full gradient-secondary mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mic2 className="w-8 h-8 md:w-10 md:h-10 text-secondary-foreground" />
                <motion.div
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </motion.div>
              </div>
              <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                Artist Name
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">
                0 followers
              </p>
              <motion.div
                className="flex items-center justify-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.05 }}
              >
                <UserPlus className="w-3 h-3" />
                Follow
              </motion.div>
            </motion.button>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default ArtistsPage;
