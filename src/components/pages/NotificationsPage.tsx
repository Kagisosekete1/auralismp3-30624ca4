import { motion } from "framer-motion";
import { Bell, Music2, Heart, User, Disc3, Check, Trash2 } from "lucide-react";

const NotificationsPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Stay updated with your music
              </p>
            </div>
          </div>
          <motion.button
            className="px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Notification Types */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["All", "New Releases", "Follows", "Likes", "System"].map((type, index) => (
            <motion.button
              key={type}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                index === 0 ? 'gradient-primary text-primary-foreground' : 'glass border border-border/30 text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {type}
            </motion.button>
          ))}
        </div>

        {/* Empty State */}
        <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            No notifications yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            When you get notifications about new releases, follows, or likes, they'll appear here
          </p>
        </div>
      </section>

      {/* Sample Notification Types (for future) */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">
          Notification Types
        </h2>
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: Music2, title: "New Release", description: "Get notified when artists you follow release new music", color: "from-primary to-accent" },
            { icon: User, title: "New Follower", description: "Someone started following your profile", color: "from-secondary to-primary" },
            { icon: Heart, title: "Liked Song", description: "Someone liked your uploaded track", color: "from-accent to-secondary" },
            { icon: Disc3, title: "Playlist Update", description: "Playlists you follow have been updated", color: "from-primary to-secondary" },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="glass rounded-xl p-4 border border-border/30 flex items-center gap-4"
              variants={itemVariants}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm md:text-base">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default NotificationsPage;
