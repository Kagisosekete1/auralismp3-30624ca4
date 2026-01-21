import { motion } from "framer-motion";
import { Music2, Disc3, Mic2, TrendingUp, Clock, Sparkles, Play, Plus, Upload } from "lucide-react";
import EmptyState from "../EmptyState";
import type { Playlist } from "@/hooks/useAppState";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
}

export interface HomePageProps {
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
  onUploadMusic: () => void;
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
}

const HomePage = ({ playlists, onCreatePlaylist, onSelectPlaylist, onUploadMusic, tracks = [], onPlayTrack }: HomePageProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    { 
      icon: Plus, 
      title: "Create Playlist", 
      description: "Organize your music",
      action: onCreatePlaylist,
      gradient: "from-primary to-accent"
    },
    { 
      icon: Upload, 
      title: "Upload Music", 
      description: "Submit your tracks",
      action: onUploadMusic,
      gradient: "from-secondary to-primary"
    },
    { 
      icon: Disc3, 
      title: "Explore", 
      description: "Discover new music",
      gradient: "from-accent to-secondary"
    },
    { 
      icon: Mic2, 
      title: "Artists", 
      description: "Find your favorites",
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
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Hero Section */}
      <div className="relative gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            {getGreeting()}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Welcome to Auralis. Start building your music library.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={action.action}
              className="group glass rounded-xl md:rounded-2xl p-4 md:p-6 text-left border border-border/30 hover:border-primary/30 transition-all"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-sm md:text-base mb-0.5 md:mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">{action.description}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Stats Section */}
      <section className="px-4 md:px-8 py-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { icon: Music2, label: "Total Tracks", value: "0" },
            { icon: Disc3, label: "Playlists", value: playlists.length.toString() },
            { icon: TrendingUp, label: "Plays", value: "0" },
            { icon: Clock, label: "Listen Time", value: "0h" },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass rounded-xl p-4 border border-border/30"
            >
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Your Playlists Section */}
      <section className="px-4 md:px-8 py-6">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Your Playlists</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Your personal music collections</p>
          </div>
          <motion.button
            onClick={onCreatePlaylist}
            className="px-3 md:px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Playlist</span>
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
                    whileHover={{ opacity: 1 }}
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

            {/* Add New Playlist Card */}
            <motion.button
              onClick={onCreatePlaylist}
              className="group glass rounded-xl md:rounded-2xl p-3 md:p-4 border border-dashed border-border/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center aspect-square"
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl bg-surface-elevated/50 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Create Playlist
              </p>
            </motion.button>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
