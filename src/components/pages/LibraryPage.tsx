import { motion } from "framer-motion";
import { Library, Music2, Heart, Clock, Download, Plus, Play } from "lucide-react";
import type { Playlist } from "@/hooks/useAppState";
import EmptyState from "../EmptyState";

interface LibraryPageProps {
  playlists: Playlist[];
  likedCount: number;
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
  onLikedSongs: () => void;
}

const LibraryPage = ({ playlists, likedCount, onCreatePlaylist, onSelectPlaylist, onLikedSongs }: LibraryPageProps) => {
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

  const libraryCategories = [
    { 
      icon: Heart, 
      title: "Liked Songs", 
      count: likedCount,
      gradient: "from-primary to-accent",
      action: onLikedSongs
    },
    { 
      icon: Clock, 
      title: "Recently Played", 
      count: 0,
      gradient: "from-secondary to-primary"
    },
    { 
      icon: Download, 
      title: "Downloads", 
      count: 0,
      gradient: "from-accent to-secondary"
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Your Library
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            All your music in one place
          </p>
        </motion.div>
      </div>

      {/* Quick Access */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Quick Access
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {libraryCategories.map((category, index) => (
            <motion.button
              key={index}
              onClick={category.action}
              className="group glass rounded-xl md:rounded-2xl p-4 md:p-6 text-left border border-border/30 hover:border-primary/30 transition-all flex items-center gap-4"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-foreground text-sm md:text-base group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {category.count} items
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Playlists */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            Playlists
          </h2>
          <motion.button
            onClick={onCreatePlaylist}
            className="px-3 md:px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Playlist</span>
          </motion.button>
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No playlists yet"
            description="Create your first playlist to start organizing your music"
            actionLabel="Create Playlist"
            onAction={onCreatePlaylist}
          />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {playlists.map((playlist) => (
              <motion.button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className="group glass rounded-xl md:rounded-2xl p-3 md:p-4 text-left border border-border/30 hover:border-primary/30 transition-all"
                variants={itemVariants}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                  <Music2 className="w-8 md:w-12 h-8 md:h-12 text-primary-foreground/80" />
                  <motion.div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </motion.div>
                </div>
                <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5 md:mb-1 truncate group-hover:text-primary transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {playlist.tracks.length} songs
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default LibraryPage;
