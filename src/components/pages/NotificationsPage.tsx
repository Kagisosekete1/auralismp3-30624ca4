import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Music2, Heart, User, Check, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
  related_id?: string;
}

interface NotificationsPageProps {
  onSectionChange?: (section: string) => void;
  onViewArtist?: (artistId: string) => void;
  onPlayTrack?: (track: any) => void;
  onViewPost?: (postId: string) => void;
}

const NotificationsPage = ({ onSectionChange, onViewArtist, onPlayTrack, onViewPost }: NotificationsPageProps) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ["All", "New Releases", "Follows", "Likes", "System"];

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      return;
    }

    setNotifications(data as Notification[] || []);
    setLoading(false);
  }, [user]);

  // Generate notifications from activities if none exist
  const generateNotifications = useCallback(async () => {
    if (!user) return;

    // Check if user has any notifications already
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count && count > 0) return;

    // Fetch recent activities and create notifications
    const [tracksRes, likesRes, followsRes] = await Promise.all([
      supabase
        .from("tracks")
        .select("id, title, artist_name, created_at, cover_url")
        .neq("user_id", user.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("liked_tracks")
        .select("id, track_id, created_at, tracks(title, user_id)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("follows")
        .select("id, follower_id, created_at")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const notifs: any[] = [];

    tracksRes.data?.forEach(track => {
      notifs.push({
        user_id: user.id,
        type: "new_release",
        title: "New Release",
        message: `${track.artist_name} released "${track.title}"`,
        read: false,
        related_id: track.id,
        data: track,
        created_at: track.created_at,
      });
    });

    likesRes.data?.forEach((like: any) => {
      if (like.tracks?.user_id === user.id) {
        notifs.push({
          user_id: user.id,
          type: "like",
          title: "New Like",
          message: `Someone liked your track "${like.tracks.title}"`,
          read: false,
          related_id: like.track_id,
          created_at: like.created_at,
        });
      }
    });

    followsRes.data?.forEach((follow: any) => {
      notifs.push({
        user_id: user.id,
        type: "follow",
        title: "New Follower",
        message: "Someone started following you",
        read: false,
        related_id: follow.follower_id,
        created_at: follow.created_at,
      });
    });

    if (notifs.length > 0) {
      await supabase.from("notifications").insert(notifs);
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications().then(() => {
      generateNotifications();
    });

    // Set up realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tracks" },
        async (payload) => {
          const track = payload.new as any;
          if (track.user_id !== user.id && track.is_approved) {
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "new_release",
              title: "New Release",
              message: `${track.artist_name} released "${track.title}"`,
              related_id: track.id,
              data: track,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows", filter: `following_id=eq.${user.id}` },
        async (payload) => {
          const follow = payload.new as any;
          // Fetch follower profile
          const { data: followerProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", follow.follower_id)
            .single();

          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "follow",
            title: "New Follower",
            message: `${followerProfile?.display_name || "Someone"} started following you`,
            related_id: follow.follower_id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, generateNotifications]);

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === "All") return true;
    if (activeFilter === "New Releases") return notif.type === "new_release";
    if (activeFilter === "Follows") return notif.type === "follow" || notif.type === "follower";
    if (activeFilter === "Likes") return notif.type === "like" || notif.type === "song_like" || notif.type === "post_like";
    if (activeFilter === "System") return notif.type === "system";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const markAllRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      toast.error("Failed to mark notifications as read");
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read first
    await markAsRead(notif.id);

    // Navigate based on type
    switch (notif.type) {
      case "new_release":
        if (notif.data?.audio_url) {
          onPlayTrack?.(notif.data);
        } else if (notif.related_id) {
          const { data } = await supabase.from("tracks").select("*").eq("id", notif.related_id).maybeSingle();
          if (data) onPlayTrack?.(data);
        }
        break;
      case "follow":
      case "follower":
        if (notif.related_id) {
          onViewArtist?.(notif.related_id);
        }
        break;
      case "like":
      case "song_like":
        onSectionChange?.("profile");
        break;
      case "post_like":
      case "post_comment":
      case "comment": {
        const postId = notif.data?.post_id || notif.related_id;
        if (postId) onViewPost?.(postId);
        break;
      }
      case "system":
        onSectionChange?.("settings");
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_release": return Music2;
      case "follow": return User;
      case "like":
      case "song_like":
      case "post_like": return Heart;
      case "system": return Settings;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "new_release": return "from-primary to-accent";
      case "follow":
      case "follower": return "from-secondary to-primary";
      case "like":
      case "song_like":
      case "post_like": return "from-accent to-secondary";
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
            <div className="relative">
              <Bell className="w-8 h-8 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-xs font-bold flex items-center justify-center text-accent-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          <motion.button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className={`px-4 py-2 rounded-xl glass border-glow font-medium text-sm flex items-center gap-2 transition-opacity ${
              unreadCount === 0 ? "opacity-50 cursor-not-allowed" : "text-foreground hover:bg-surface-elevated"
            }`}
            whileHover={unreadCount > 0 ? { scale: 1.02 } : {}}
            whileTap={unreadCount > 0 ? { scale: 0.98 } : {}}
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
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass rounded-xl p-4 border border-border/30 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-elevated" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-elevated rounded w-1/3 mb-2" />
                    <div className="h-3 bg-surface-elevated rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
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
                  onClick={() => handleNotificationClick(notif)}
                  className={`glass rounded-xl p-4 border transition-all cursor-pointer ${
                    notif.read ? 'border-border/30 opacity-70' : 'border-primary/30 bg-primary/5'
                  }`}
                  variants={itemVariants}
                  whileHover={{ x: 4, backgroundColor: "hsl(var(--surface-elevated) / 0.3)" }}
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
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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
