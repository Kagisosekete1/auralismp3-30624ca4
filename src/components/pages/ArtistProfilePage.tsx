import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Music2, Users, Play, Heart, Share2, UserPlus, UserCheck, MessageCircle, Calendar, MapPin, Globe, Instagram, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  artist_name?: string;
  bio?: string;
  avatar_url?: string;
  country?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  followers_count: number;
  total_plays: number;
  is_artist: boolean;
}

interface ArtistProfilePageProps {
  artistUserId: string;
  onBack: () => void;
  onPlayTrack: (track: any) => void;
  onMessage?: (userId: string) => void;
  onAddToPlaylist?: (track: any) => void;
}

const ArtistProfilePage = ({ artistUserId, onBack, onPlayTrack, onMessage, onAddToPlaylist }: ArtistProfilePageProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistData();
    
    // Real-time subscription for follow count updates
    const channel = supabase
      .channel(`artist-follows-${artistUserId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'follows',
        filter: `following_id=eq.${artistUserId}`
      }, () => {
        // Refetch the actual count from DB
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", artistUserId)
          .then(({ count }) => {
            setFollowersCount(count || 0);
          });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistUserId]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", artistUserId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setFollowersCount(profileData.followers_count || 0);
      }

      // Fetch tracks
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*")
        .eq("user_id", artistUserId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      
      setTracks(tracksData || []);

      // Check if following
      if (user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", artistUserId)
          .single();
        
        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error("Error fetching artist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Sign in to follow artists");
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", artistUserId);
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success("Unfollowed artist");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: artistUserId });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success("Following artist!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/artist/${artistUserId}`;
    if (navigator.share) {
      await navigator.share({
        title: profile?.artist_name || profile?.display_name,
        text: `Check out ${profile?.artist_name || profile?.display_name} on Auralis!`,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Music2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Artist not found</h2>
        <button onClick={onBack} className="text-primary hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 glass-strong p-4 flex items-center gap-3">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-full glass flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-display font-bold text-foreground truncate">
          {profile.artist_name || profile.display_name}
        </h1>
      </div>

      {/* Profile Header */}
      <div className="gradient-hero p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/20">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-primary-foreground">
                  {(profile.artist_name || profile.display_name || "A")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            {profile.is_artist && (
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-2">
                Verified Artist
              </span>
            )}
            <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2">
              {profile.artist_name || profile.display_name}
            </h1>
            
            {profile.bio && (
              <p className="text-muted-foreground mb-4 max-w-xl">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{followersCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{tracks.length}</p>
                <p className="text-xs text-muted-foreground">Tracks</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{profile.total_plays || 0}</p>
                <p className="text-xs text-muted-foreground">Plays</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              {profile.country && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile.country}
                </span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Actions */}
            {user?.id !== artistUserId && (
              <div className="flex items-center justify-center md:justify-start gap-3">
                <motion.button
                  onClick={handleFollow}
                  className={`px-6 py-2.5 rounded-full font-medium flex items-center gap-2 ${
                    isFollowing 
                      ? "glass border border-primary/30 text-primary" 
                      : "gradient-primary text-primary-foreground"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </motion.button>
                
                {onMessage && (
                  <motion.button
                    onClick={() => onMessage(artistUserId)}
                    className="px-6 py-2.5 rounded-full glass border border-border/30 text-foreground font-medium flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </motion.button>
                )}
                
                <motion.button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4 text-foreground" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <section className="p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-6">
          Releases ({tracks.length})
        </h2>
        
        {tracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                className="group glass rounded-xl p-3 text-left border border-border/30 hover:border-primary/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div 
                  className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-surface-elevated cursor-pointer"
                  onClick={() => onPlayTrack(track)}
                >
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center gradient-secondary">
                      <Music2 className="w-8 h-8 text-secondary-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-foreground truncate text-sm">{track.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {formatDate(track.created_at)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {track.play_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {track.like_count || 0}
                    </span>
                  </div>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToPlaylist?.(track);
                    }}
                    className="p-1.5 rounded-lg bg-surface-elevated/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    whileTap={{ scale: 0.9 }}
                    title="Add to playlist"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center border border-border/30">
            <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No releases yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ArtistProfilePage;
