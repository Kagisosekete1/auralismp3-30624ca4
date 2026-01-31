import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Music2, Heart, Play, TrendingUp, Users, Edit, Camera, Trash2, Save, X, Loader2, Plus, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  play_count?: number;
  like_count?: number;
  created_at?: string;
}

export interface ProfilePageProps {
  likedCount: number;
  playlistCount: number;
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

const ProfilePage = ({ likedCount, playlistCount, tracks = [], onPlayTrack, onAddToPlaylist }: ProfilePageProps) => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refetchTracks } = useDatabase();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [editData, setEditData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    instagram: profile?.instagram || "",
    tiktok: profile?.tiktok || "",
    youtube: profile?.youtube || "",
    website: profile?.website || "",
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        instagram: profile.instagram || "",
        tiktok: profile.tiktok || "",
        youtube: profile.youtube || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
      
      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);
      
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
    };
    
    fetchCounts();
  }, [user]);

  const userTracks = tracks.filter(t => t.artist_name === profile?.display_name || t.artist_name === profile?.artist_name);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(editData);
    setSaving(false);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error("Failed to upload avatar");
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this release?");
    if (!confirmed) return;

    const { error } = await supabase.from("tracks").delete().eq("id", trackId);
    if (error) {
      toast.error("Failed to delete track");
      return;
    }
    toast.success("Track deleted");
    refetchTracks();
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your profile? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await signOut();
      toast.success("Account deleted");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const stats = [
    { label: "Followers", value: followersCount.toString(), icon: Users },
    { label: "Following", value: followingCount.toString(), icon: Users },
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
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full gradient-primary flex items-center justify-center shadow-2xl">
                <User className="w-16 h-16 md:w-24 md:h-24 text-primary-foreground" />
              </div>
            )}
            <motion.button
              onClick={() => avatarInputRef.current?.click()}
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
            {isEditing ? (
              <input
                type="text"
                value={editData.display_name}
                onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                className="text-3xl md:text-5xl font-display font-bold text-foreground bg-transparent border-b border-primary outline-none mb-2 w-full"
                placeholder="Your Name"
              />
            ) : (
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
                {profile?.display_name || "Your Name"}
              </h1>
            )}
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className="text-muted-foreground bg-transparent border border-border/50 rounded-lg p-2 w-full resize-none h-20 mb-4"
                placeholder="Your bio..."
              />
            ) : (
              <p className="text-muted-foreground mb-4">
                {profile?.bio || "Music lover • Producer • Artist"}
              </p>
            )}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <span>{playlistCount} Playlists</span>
              <span>•</span>
              <span>{followersCount} Followers</span>
              <span>•</span>
              <span>{followingCount} Following</span>
            </div>
          </motion.div>

          {/* Edit Button */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <motion.button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl glass border-glow text-foreground font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl glass border-glow text-foreground font-medium flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </motion.button>
            )}
          </div>
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
              className="glass rounded-xl p-4 md:p-6 border border-border/30 text-center cursor-pointer hover:border-primary/30 transition-colors"
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
        {userTracks.length > 0 ? (
          <div className="space-y-3">
            {userTracks.map((track) => (
              <motion.div
                key={track.id}
                className="glass rounded-xl p-4 border border-border/30 flex items-center gap-4"
                whileHover={{ x: 4 }}
              >
                <div 
                  className="relative w-16 h-16 rounded-xl bg-surface-elevated flex items-center justify-center cursor-pointer group"
                  onClick={() => onPlayTrack?.(track)}
                >
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Music2 className="w-6 h-6 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{track.artist_name}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{track.play_count || 0} plays</span>
                    <span>{track.like_count || 0} likes</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => onAddToPlaylist?.(track)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  whileTap={{ scale: 0.9 }}
                  title="Add to playlist"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteTrack(track.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              No releases yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Upload your music to start building your discography
            </p>
          </div>
        )}
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

      {/* Danger Zone */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl font-display font-bold text-destructive mb-4">Danger Zone</h2>
        <motion.button
          onClick={handleDeleteProfile}
          className="w-full glass rounded-xl p-4 border border-destructive/30 hover:border-destructive/50 transition-colors flex items-center gap-4 text-destructive"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <span className="font-medium">Delete Account</span>
        </motion.button>
      </section>
    </div>
  );
};

export default ProfilePage;
