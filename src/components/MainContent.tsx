import { motion } from "framer-motion";
import { TrendingUp, Clock, Sparkles } from "lucide-react";
import PlaylistCard from "./PlaylistCard";
import QuickPlayCard from "./QuickPlayCard";
import TrackRow from "./TrackRow";

import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import album4 from "@/assets/album-4.jpg";
import album5 from "@/assets/album-5.jpg";
import album6 from "@/assets/album-6.jpg";

const MainContent = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickPlayItems = [
    { title: "Liked Songs", image: album1 },
    { title: "Daily Mix 1", image: album2 },
    { title: "Chill Hits", image: album3 },
    { title: "Discover Weekly", image: album4 },
    { title: "Release Radar", image: album5 },
    { title: "Indie Vibes", image: album6 },
  ];

  const featuredPlaylists = [
    { title: "Cosmic Dreams", description: "Ambient electronic for deep focus", image: album1 },
    { title: "Neon Nights", description: "Synthwave and retro beats", image: album2 },
    { title: "Acoustic Sessions", description: "Stripped back and raw performances", image: album3 },
    { title: "Future Bass", description: "Heavy drops and euphoric melodies", image: album4 },
    { title: "Jazz Lounge", description: "Smooth jazz for relaxation", image: album5 },
    { title: "Indie Discovery", description: "Fresh indie tracks handpicked", image: album6 },
  ];

  const trendingTracks = [
    { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration: "4:03", image: album1 },
    { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: "3:20", image: album2 },
    { title: "Electric Feel", artist: "MGMT", album: "Oracular Spectacular", duration: "3:49", image: album3 },
    { title: "Starboy", artist: "The Weeknd", album: "Starboy", duration: "3:50", image: album4 },
    { title: "Take On Me", artist: "a-ha", album: "Hunting High and Low", duration: "3:46", image: album5 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="flex-1 overflow-y-auto">
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
            Ready to discover something new?
          </p>
        </motion.div>

        {/* Quick Play Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickPlayItems.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <QuickPlayCard
                title={item.title}
                imageUrl={item.image}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Featured Section */}
      <section className="px-8 py-8">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Made For You</h2>
            <p className="text-sm text-muted-foreground">Personalized mixes based on your taste</p>
          </div>
          <motion.button
            className="ml-auto text-sm font-semibold text-primary hover:underline"
            whileHover={{ x: 4 }}
          >
            See all
          </motion.button>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {featuredPlaylists.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <PlaylistCard
                title={item.title}
                description={item.description}
                imageUrl={item.image}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trending Tracks */}
      <section className="px-8 py-8 pb-32">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Trending Now</h2>
            <p className="text-sm text-muted-foreground">What everyone's listening to</p>
          </div>
          <motion.button
            className="ml-auto text-sm font-semibold text-primary hover:underline"
            whileHover={{ x: 4 }}
          >
            See all
          </motion.button>
        </motion.div>

        {/* Track Headers */}
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2 text-sm text-muted-foreground border-b border-border/30 mb-2">
          <span className="w-10 text-center">#</span>
          <span>Title</span>
          <span>Album</span>
          <div className="flex items-center gap-3">
            <span className="w-4" />
            <Clock className="w-4 h-4" />
            <span className="w-4" />
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {trendingTracks.map((track, index) => (
            <motion.div key={index} variants={itemVariants}>
              <TrackRow
                index={index + 1}
                title={track.title}
                artist={track.artist}
                album={track.album}
                duration={track.duration}
                imageUrl={track.image}
                isCurrentlyPlaying={index === 0}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
};

export default MainContent;
