import { motion } from "framer-motion";
import { Mic2, Search, UserPlus, Play, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Artist {
  id: string;
  user_id: string;
  display_name?: string;
  artist_name?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  total_plays: number;
  is_artist: boolean;
}

interface ArtistsPageProps {
  onViewArtist?: (artistUserId: string) => void;
}

const ArtistsPage = ({ onViewArtist }: ArtistsPageProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [followingArtists, setFollowingArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
    if (user) fetchFollowingArtists();
  }, [user]);

  const fetchArtists = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_artist", true)
        .order("followers_count", { ascending: false })
        .limit(20);
      
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingArtists = async () => {
    if (!user) return;
    
    try {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      
      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", followingIds);
        
        setFollowingArtists(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching following artists:", error);
    }
  };

  const filteredArtists = searchQuery.trim()
    ? artists.filter(a => 
        (a.artist_name || a.display_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : artists;

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

  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <motion.button
      onClick={() => onViewArtist?.(artist.user_id)}
      className="group glass rounded-2xl p-4 text-center border border-border/30 hover:border-primary/30 transition-all"
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
        {artist.avatar_url ? (
          <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {(artist.artist_name || artist.display_name || "A")[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <h3 className="font-medium text-foreground truncate">
        {artist.artist_name || artist.display_name || "Artist"}
      </h3>
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
        <Users className="w-3 h-3" />
        {artist.followers_count || 0} followers
      </p>
    </motion.button>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            Artists
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Find and follow your favorite artists
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mt-6 md:mt-8 relative max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 focus:bg-surface-elevated text-foreground placeholder:text-muted-foreground outline-none transition-all text-base"
          />
        </motion.div>
      </div>

      {/* Following Section */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Artists You Follow
        </h2>
        {followingArtists.length > 0 ? (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {followingArtists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </motion.div>
        ) : (
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
              <Mic2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              No artists followed yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Search for artists and follow them to see their music here
            </p>
          </div>
        )}
      </section>

      {/* Featured Artists */}
      <section className="px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4 md:mb-6">
          Featured Artists
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredArtists.length > 0 ? (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredArtists.map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </motion.div>
        ) : (
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-border/30">
            <div className="w-16 h-16 rounded-full gradient-secondary flex items-center justify-center mx-auto mb-4">
              <Mic2 className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              No featured artists yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Artists will appear here as they upload music
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ArtistsPage;
