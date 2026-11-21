import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Music2, Heart, Play, TrendingUp, Users, Edit, Camera, Trash2, Save, X, Loader2, Plus, ImageIcon, Download, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SearchablePicker, { type PickerOption } from "@/components/SearchablePicker";
import { countries, countryFlag } from "@/data/countries";
import auralisWordmark from "@/assets/auralis-wordmark-source.webp";
import { Capacitor } from "@capacitor/core";

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
  onViewArtist?: (artistUserId: string) => void;
}

const ProfilePage = ({ playlistCount, tracks = [], onPlayTrack, onAddToPlaylist, onViewArtist }: ProfilePageProps) => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refetchTracks } = useDatabase();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [receivedLikes, setReceivedLikes] = useState(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [monthlyListeners, setMonthlyListeners] = useState<number | null>(null);
  const [returningListeners, setReturningListeners] = useState(0);
  const [coverSource, setCoverSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      const [monthly, returning] = await Promise.all([
        supabase.rpc("get_artist_monthly_listeners", { artist_user_id: user.id }),
        supabase.rpc("get_artist_returning_listeners", { artist_user_id: user.id }),
      ]);
      if (!active) return;
      if (!monthly.error) setMonthlyListeners(Number(monthly.data) || 0);
      if (!returning.error) setReturningListeners(Number(returning.data) || 0);
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    const channel = supabase.channel(`profile-listeners-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "artist_listener_stats", filter: `artist_user_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "artist_listener_stats", filter: `artist_user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { active = false; clearInterval(timer); void supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => () => { if (coverSource) URL.revokeObjectURL(coverSource); }, [coverSource]);

  const [editData, setEditData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    instagram: profile?.instagram || "",
    tiktok: profile?.tiktok || "",
    youtube: profile?.youtube || "",
    website: profile?.website || "",
    country: profile?.country || "",
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
        country: profile.country || "",
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
    
    const refreshReceivedLikes = async () => {
      const { data } = await supabase.from("tracks").select("like_count").eq("user_id", user.id);
      setReceivedLikes((data || []).reduce((sum, track) => sum + (track.like_count || 0), 0));
    };
    void fetchCounts();
    void refreshReceivedLikes();
    const channel = supabase.channel(`profile-social-counts-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follows", filter: `following_id=eq.${user.id}` }, () => { void fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${user.id}` }, () => { void fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "liked_tracks" }, refreshReceivedLikes)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tracks", filter: `user_id=eq.${user.id}` }, refreshReceivedLikes)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCoverSource(URL.createObjectURL(file));
  };

  const saveCover = async () => {
    if (!coverSource || !cropPixels || !user) return;
    setIsUploadingCover(true);
    try {
      const image = new window.Image();
      image.src = coverSource;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cropPixels.width);
      canvas.height = Math.round(cropPixels.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not crop image");
      context.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Could not create cover image");
      const path = `${user.id}/cover_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg" });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ cover_photo_url: data.publicUrl });
      setCoverSource(null);
      toast.success("Cover photo updated!");
    } catch (error) {
      toast.error("Failed to upload cover photo");
    } finally {
      setIsUploadingCover(false);
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

  const countryOptions: PickerOption[] = countries.map(({ code, name, flag }) => ({ value: name, label: name, prefix: flag }));

  const downloadListenerCard = async () => {
    try {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const context = canvas.getContext("2d");
    if (!context) return toast.error("Could not create the listener image");
    context.fillStyle = "#03130f";
    context.fillRect(0, 0, 1000, 1000);
    const gradient = context.createLinearGradient(0, 0, 1000, 1000);
    gradient.addColorStop(0, "rgba(0,217,138,.22)");
    gradient.addColorStop(1, "rgba(0,184,156,.06)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(0,217,138,.45)";
    context.lineWidth = 2;
    context.strokeRect(32, 32, 936, 936);
    context.fillStyle = "#e9fff7";
    context.textAlign = "center";
    context.font = "700 30px Arial";
    context.fillText("MONTHLY LISTENERS", 500, 300);
    context.fillStyle = "#00d98a";
    context.font = "700 128px Arial";
    context.fillText((monthlyListeners ?? 0).toLocaleString(), 500, 445);
    context.fillStyle = "#9bb7ad";
    context.font = "400 28px Arial";
    context.fillText(profile?.artist_name || profile?.display_name || "Auralis Artist", 500, 510, 840);
    context.font = "400 24px Arial";
    context.fillText(`${returningListeners.toLocaleString()} returned after 24 hours`, 500, 555);
    const logo = new window.Image();
    logo.src = auralisWordmark;
    try {
      await logo.decode();
      const maxWidth = 360;
      const scale = Math.min(maxWidth / logo.naturalWidth, 150 / logo.naturalHeight);
      const width = logo.naturalWidth * scale;
      const height = logo.naturalHeight * scale;
      context.drawImage(logo, (1000 - width) / 2, 655, width, height);
    } catch {
      context.fillStyle = "#00d98a";
      context.font = "700 32px Arial";
      context.fillText("Auralis", 500, 720);
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not render your listener image");
    const fileName = `auralis-monthly-listeners-${new Date().toISOString().slice(0, 10)}.png`;

    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
      ]);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not prepare the listener image"));
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.readAsDataURL(blob);
      });
      const { uri } = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title: "Auralis monthly listeners", text: "My Auralis artist audience", files: [uri], dialogTitle: "Save or share your listener image" });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    toast.success("Listener image is ready to save or share");
    } catch (error) {
      console.error("Could not export monthly listeners:", error);
      toast.error(error instanceof Error ? error.message : "Could not download the listener image");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <Dialog open={Boolean(coverSource)} onOpenChange={(open) => { if (!open && !isUploadingCover) setCoverSource(null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg border-border bg-background text-foreground">
          <DialogTitle>Adjust cover photo</DialogTitle>
          <div className="relative h-56 w-full overflow-hidden bg-black">
            {coverSource && <Cropper image={coverSource} crop={crop} zoom={zoom} aspect={3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setCropPixels(pixels)} />}
          </div>
          <label className="text-sm text-muted-foreground">Zoom<input aria-label="Cover zoom" className="mt-2 w-full accent-primary" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <button type="button" disabled={isUploadingCover || !cropPixels} onClick={saveCover} className="rounded-lg gradient-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{isUploadingCover ? "Saving..." : "Save cover"}</button>
        </DialogContent>
      </Dialog>
      {/* Cover Photo Header */}
      <div className="relative">
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
        
        {/* Cover Photo Banner */}
        <div className="relative h-40 md:h-56 w-full overflow-hidden">
          {profile?.cover_photo_url ? (
            <img 
              src={profile.cover_photo_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-hero" />
          )}
          {/* Gradient overlay for blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          
          {/* Cover photo upload button */}
          <motion.button
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            className="absolute top-4 right-4 px-3 py-2 rounded-lg glass border border-border/30 flex items-center gap-2 text-foreground text-sm hover:bg-surface-elevated/80 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isUploadingCover ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            {isUploadingCover ? "Uploading..." : "Edit Cover"}
          </motion.button>
        </div>

        {/* Profile content overlapping cover */}
        <div className="relative px-4 md:px-8 -mt-16 md:-mt-24">
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
            {isEditing ? (
              <div className="mb-4 max-w-sm">
                <label className="mb-2 flex items-center gap-2 text-left text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />Country</label>
                <SearchablePicker value={editData.country} options={countryOptions} onChange={(country) => setEditData({ ...editData, country })} title="Select your country" placeholder="Search all countries..." emptyLabel="Choose country" />
              </div>
            ) : profile?.country ? (
              <p className="mb-4 text-sm text-muted-foreground">{countryFlag(profile.country)} {profile.country}</p>
            ) : null}
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <span>{followingCount} Following</span>
              <span>•</span>
              <span>{followersCount} Followers</span>
              <span>•</span>
              <span>{receivedLikes.toLocaleString()} Likes</span>
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
      </div>
      {/* Stats */}
      <section className="px-4 md:px-8 py-6">
        <motion.div
          className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.045] px-4 py-3 md:px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Music2 className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-lg font-display font-bold text-foreground">{monthlyListeners === null ? "—" : monthlyListeners.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Monthly listeners</p>
              <p className="text-[10px] text-muted-foreground">{returningListeners.toLocaleString()} returned after 24 hours</p>
            </div>
          </div>
          <button type="button" onClick={() => void downloadListenerCard()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-primary/25 px-3 text-sm font-medium text-primary hover:bg-primary/10" aria-label="Download monthly listeners image">
            <Download className="h-4 w-4" /><span className="hidden sm:inline">Download</span>
          </button>
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
                  <button type="button" onClick={() => user && onViewArtist?.(user.id)} className="block max-w-full truncate text-left text-sm text-muted-foreground hover:text-primary">{track.artist_name}</button>
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

    </div>
  );
};

export default ProfilePage;
