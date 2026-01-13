import { motion } from "framer-motion";
import { Music2, Disc3, Radio, Mic2, Sparkles, Plus } from "lucide-react";
import EmptyState from "./EmptyState";
import type { Playlist } from "@/hooks/useAppState";

interface MainContentProps {
  activeSection: string;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
}

const MainContent = ({ activeSection, playlists, onCreatePlaylist, onSelectPlaylist }: MainContentProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const features = [
    { 
      icon: Plus, 
      title: "Create Playlists", 
      description: "Organize your music into custom collections",
      action: onCreatePlaylist,
      gradient: "from-primary to-accent"
    },
    { 
      icon: Disc3, 
      title: "Explore", 
      description: "Discover new music and artists",
      gradient: "from-secondary to-primary"
    },
    { 
      icon: Radio, 
      title: "Radio", 
      description: "Listen to curated stations",
      gradient: "from-accent to-secondary"
    },
    { 
      icon: Mic2, 
      title: "Artists", 
      description: "Follow your favorite artists",
      gradient: "from-primary to-secondary"
    },
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
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Hero Section */}
      <div className="relative gradient-hero pt-8 pb-12 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            {getGreeting()}
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome to Auralis. Start building your music library.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => (
            <motion.button
              key={index}
              onClick={feature.action}
              className="group glass rounded-2xl p-6 text-left border border-border/30 hover:border-primary/30 transition-all"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Your Playlists Section */}
      <section className="px-8 py-8">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-foreground">Your Playlists</h2>
            <p className="text-sm text-muted-foreground">Your personal music collections</p>
          </div>
          <motion.button
            onClick={onCreatePlaylist}
            className="px-4 py-2 rounded-xl glass border-glow text-foreground font-medium flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            New Playlist
          </motion.button>
        </motion.div>

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
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {playlists.map((playlist, index) => (
              <motion.button
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                className="group glass rounded-2xl p-4 text-left border border-border/30 hover:border-primary/30 transition-all"
                variants={itemVariants}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${playlist.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Music2 className="w-12 h-12 text-primary-foreground/80" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                  {playlist.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {playlist.tracks.length} songs
                </p>
              </motion.button>
            ))}

            {/* Add New Playlist Card */}
            <motion.button
              onClick={onCreatePlaylist}
              className="group glass rounded-2xl p-4 text-left border border-dashed border-border/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center aspect-square"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 rounded-xl bg-surface-elevated/50 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Create Playlist
              </p>
            </motion.button>
          </motion.div>
        )}
      </section>
    </main>
  );
};

export default MainContent;
