import { motion } from "framer-motion";
import { Music2, Play } from "lucide-react";

const GenrePage = () => {
  const genres = [
    { name: "Hip-Hop", color: "from-orange-500 to-red-600", tracks: 0 },
    { name: "Pop", color: "from-pink-500 to-rose-600", tracks: 0 },
    { name: "Afrobeats", color: "from-green-500 to-emerald-600", tracks: 0 },
    { name: "EDM", color: "from-cyan-500 to-blue-600", tracks: 0 },
    { name: "R&B", color: "from-purple-500 to-violet-600", tracks: 0 },
    { name: "Rock", color: "from-slate-500 to-gray-700", tracks: 0 },
    { name: "Drill", color: "from-red-600 to-rose-700", tracks: 0 },
    { name: "Trap", color: "from-amber-500 to-orange-600", tracks: 0 },
    { name: "House", color: "from-blue-500 to-indigo-600", tracks: 0 },
    { name: "Jazz", color: "from-yellow-600 to-amber-700", tracks: 0 },
    { name: "Classical", color: "from-stone-500 to-neutral-700", tracks: 0 },
    { name: "Country", color: "from-amber-600 to-yellow-700", tracks: 0 },
    { name: "Reggae", color: "from-green-600 to-lime-700", tracks: 0 },
    { name: "Soul", color: "from-rose-600 to-pink-700", tracks: 0 },
    { name: "Latin", color: "from-red-500 to-orange-600", tracks: 0 },
    { name: "Electronic", color: "from-violet-500 to-purple-600", tracks: 0 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
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
            Genres
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Browse music by genre and discover your new favorites
          </p>
        </motion.div>
      </div>

      {/* Genre Grid */}
      <section className="px-4 md:px-8 py-6">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {genres.map((genre, index) => (
            <motion.button
              key={index}
              className={`group relative aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br ${genre.color} p-4 md:p-6 overflow-hidden`}
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="relative flex flex-col h-full justify-between">
                <h3 className="font-display font-bold text-white text-lg md:text-xl">
                  {genre.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-xs md:text-sm">
                    {genre.tracks} tracks
                  </span>
                  <motion.div
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </motion.div>
                </div>
              </div>
              
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Empty State */}
      <section className="px-4 md:px-8 py-6">
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No music in genres yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Upload your music or explore to start building your genre collections
          </p>
        </div>
      </section>
    </div>
  );
};

export default GenrePage;
