import { motion } from "framer-motion";
import { Disc3, TrendingUp, Sparkles, Clock, Music2, Play } from "lucide-react";

const ExplorePage = () => {
  const categories = [
    { name: "New Releases", icon: Sparkles, gradient: "from-primary to-accent" },
    { name: "Trending", icon: TrendingUp, gradient: "from-secondary to-primary" },
    { name: "Top Charts", icon: Disc3, gradient: "from-accent to-secondary" },
    { name: "Recently Played", icon: Clock, gradient: "from-primary to-secondary" },
  ];

  const moodPlaylists = [
    { name: "Chill Vibes", color: "from-blue-500 to-purple-600" },
    { name: "Workout Energy", color: "from-orange-500 to-red-600" },
    { name: "Focus Mode", color: "from-green-500 to-teal-600" },
    { name: "Party Time", color: "from-pink-500 to-purple-600" },
    { name: "Sleep & Relax", color: "from-indigo-500 to-blue-600" },
    { name: "Morning Boost", color: "from-yellow-500 to-orange-600" },
  ];

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
            Explore
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Discover new music, artists, and trending tracks
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map((category, index) => (
            <motion.button
              key={index}
              className="group glass rounded-xl md:rounded-2xl p-4 md:p-6 text-left border border-border/30 hover:border-primary/30 transition-all"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-sm md:text-base group-hover:text-primary transition-colors">
                {category.name}
              </h3>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Browse by Mood */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Browse by Mood
        </h2>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {moodPlaylists.map((mood, index) => (
            <motion.button
              key={index}
              className={`group relative h-24 md:h-32 rounded-xl md:rounded-2xl bg-gradient-to-br ${mood.color} p-4 overflow-hidden`}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <span className="relative font-display font-bold text-white text-sm md:text-base">
                {mood.name}
              </span>
              <motion.div
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </motion.div>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Empty State for Recommended */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Recommended for You
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No recommendations yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start listening to music and we'll personalize your recommendations based on your taste
          </p>
        </div>
      </section>
    </div>
  );
};

export default ExplorePage;
