import { motion } from "framer-motion";
import { User, Music2, Heart, Clock, Play, TrendingUp, Users, Edit, Camera } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
}

export interface ProfilePageProps {
  likedCount: number;
  playlistCount: number;
  tracks?: Track[];
}

const ProfilePage = ({ likedCount, playlistCount, tracks = [] }: ProfilePageProps) => {
  const stats = [
    { label: "Followers", value: "0", icon: Users },
    { label: "Following", value: "0", icon: Users },
    { label: "Playlists", value: playlistCount.toString(), icon: Music2 },
    { label: "Liked Songs", value: likedCount.toString(), icon: Heart },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Profile Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar */}
          <motion.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full gradient-primary flex items-center justify-center shadow-2xl">
              <User className="w-16 h-16 md:w-24 md:h-24 text-primary-foreground" />
            </div>
            <motion.button
              className="absolute bottom-2 right-2 w-10 h-10 rounded-full glass border-glow flex items-center justify-center text-foreground"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Profile Info */}
          <motion.div
            className="text-center md:text-left flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">PROFILE</p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
              Your Name
            </h1>
            <p className="text-muted-foreground mb-4">
              Music lover • Producer • Artist
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <span>{playlistCount} Playlists</span>
              <span>•</span>
              <span>0 Followers</span>
              <span>•</span>
              <span>0 Following</span>
            </div>
          </motion.div>

          {/* Edit Button */}
          <motion.button
            className="px-5 py-2.5 rounded-xl glass border-glow text-foreground font-medium flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <section className="px-4 md:px-8 py-6">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass rounded-xl p-4 md:p-6 border border-border/30 text-center"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Your Releases */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Your Releases
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No releases yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            Upload your music to start building your discography
          </p>
        </div>
      </section>

      {/* Listening Stats */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Listening Activity
        </h2>
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No listening data yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start listening to tracks to see your activity here
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
