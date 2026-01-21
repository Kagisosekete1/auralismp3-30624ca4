import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Music2, Heart, User, Disc3, Check, Trash2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "new_release" | "follow" | "like" | "system";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const filters = ["All", "New Releases", "Follows", "Likes", "System"];

  // Fetch latest tracks as "new release" notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      // Fetch recent tracks from followed artists or all tracks as notifications
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id, title, artist_name, created_at, cover_url")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch likes on user's tracks
      const { data: likes } = await supabase
        .from("liked_tracks")
        .select("id, track_id, created_at, tracks(title)")
        .eq("tracks.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch new followers
      const { data: follows } = await supabase
        .from("follows")
        .select("id, follower_id, created_at, profiles!follows_follower_id_fkey(display_name)")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const notifs: Notification[] = [];

      tracks?.forEach(track => {
        notifs.push({
          id: `release-${track.id}`,
          type: "new_release",
          title: "New Release",
          message: `${track.artist_name} released "${track.title}"`,
          read: false,
          created_at: track.created_at,
          data: track,
        });
      });

      likes?.forEach((like: any) => {
        if (like.tracks) {
          notifs.push({
            id: `like-${like.id}`,
            type: "like",
            title: "New Like",
            message: `Someone liked your track "${like.tracks.title}"`,
            read: false,
            created_at: like.created_at,
          });
        }
      });

      follows?.forEach((follow: any) => {
        const name = follow.profiles?.display_name || "Someone";
        notifs.push({
          id: `follow-${follow.id}`,
          type: "follow",
          title: "New Follower",
          message: `${name} started following you`,
          read: false,
          created_at: follow.created_at,
        });
      });

      // Sort by date
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Remove duplicates
      const uniqueNotifs = notifs.filter((notif, index, self) => 
        index === self.findIndex(n => n.id === notif.id)
      );

      setNotifications(uniqueNotifs);
    };

    fetchNotifications();

    // Set up realtime subscription for new tracks
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tracks" },
        (payload) => {
          const track = payload.new as any;
          if (track.user_id !== user?.id) {
            setNotifications(prev => {
              const newNotif: Notification = {
                id: `release-${track.id}`,
                type: "new_release",
                title: "New Release",
                message: `${track.artist_name} released "${track.title}"`,
                read: false,
                created_at: track.created_at,
                data: track,
              };
              // Check for duplicates before adding
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows", filter: `following_id=eq.${user?.id}` },
        (payload) => {
          const follow = payload.new as any;
          setNotifications(prev => {
            const newNotif: Notification = {
              id: `follow-${follow.id}`,
              type: "follow",
              title: "New Follower",
              message: "Someone started following you",
              read: false,
              created_at: follow.created_at,
            };
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === "All") return true;
    if (activeFilter === "New Releases") return notif.type === "new_release";
    if (activeFilter === "Follows") return notif.type === "follow";
    if (activeFilter === "Likes") return notif.type === "like";
    if (activeFilter === "System") return notif.type === "system";
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_release": return Music2;
      case "follow": return User;
      case "like": return Heart;
      case "system": return Settings;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "new_release": return "from-primary to-accent";
      case "follow": return "from-secondary to-primary";
      case "like": return "from-accent to-secondary";
      case "system": return "from-muted to-primary";
      default: return "from-primary to-secondary";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Filters */}
      <section className="px-4 md:px-8 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter ? 'gradient-primary text-primary-foreground' : 'glass border border-border/30 text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filter}
            </motion.button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredNotifications.map((notif) => {
              const Icon = getIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  className={`glass rounded-xl p-4 border transition-all cursor-pointer ${
                    notif.read ? 'border-border/30 opacity-70' : 'border-primary/30 bg-primary/5'
                  }`}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(notif.type)} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground text-sm md:text-base">
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
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
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;
