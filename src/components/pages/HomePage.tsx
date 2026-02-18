import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Music2, TrendingUp, Clock, Flame, Headphones, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import TrackCard from "../TrackCard";
import type { Playlist } from "@/hooks/useAppState";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  play_count?: number;
  genre?: string;
  user_id?: string;
}

interface RecentPlaylistItem {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  trackId: string;
}

export interface HomePageProps {
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onSelectPlaylist: (id: string) => void;
  onUploadMusic: () => void;
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  onViewProfile?: (userId: string) => void;
  onAddToPlaylist?: (track: Track) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

// Compact 2-column tile (like Spotify home "quick picks")
const QuickPickTile = ({ item, onPlay }: { item: RecentPlaylistItem; onPlay: () => void }) => (
  <motion.button
    variants={itemVariants}
    onClick={onPlay}
    className="flex items-center gap-3 rounded-xl glass border border-border/20 overflow-hidden hover:border-primary/30 hover:bg-surface-elevated/60 transition-all group text-left w-full"
    whileTap={{ scale: 0.97 }}
  >
    <div className="w-14 h-14 flex-shrink-0 relative overflow-hidden">
      {item.coverUrl ? (
        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
          <Music2 className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0 pr-2 py-2">
      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
      <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
    </div>
  </motion.button>
);

// Horizontal scrollable track row
const TrackRow = ({ tracks, onPlayTrack, onAddToPlaylist }: { tracks: Track[]; onPlayTrack?: (t: Track) => void; onAddToPlaylist?: (t: Track) => void }) => (
  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-8">
    {tracks.map((track) => (
      <div key={track.id} className="flex-shrink-0 w-44">
        <TrackCard track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
      </div>
    ))}
  </div>
);

const SectionHeader = ({ title, icon: Icon, onMore }: { title: string; icon?: any; onMore?: () => void }) => (
  <div className="flex items-center justify-between px-4 md:px-8 mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-primary" />}
      <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{title}</h2>
    </div>
    {onMore && (
      <button onClick={onMore} className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
        See all <ChevronRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const HomePage = ({ playlists, onCreatePlaylist, onSelectPlaylist, onUploadMusic, tracks = [], onPlayTrack, onViewProfile, onAddToPlaylist }: HomePageProps) => {
  const { user } = useAuth();
  const { profile } = useDatabase();
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalListenTime, setTotalListenTime] = useState(0);
  const [liveTracks, setLiveTracks] = useState<Track[]>(tracks);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentPlaylistItem[]>([]);
  const [weeklyTrending, setWeeklyTrending] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [topArtistTracks, setTopArtistTracks] = useState<{ artist: string; tracks: Track[] }[]>([]);
  const [userGenre, setUserGenre] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => { setLiveTracks(tracks); }, [tracks]);

  useEffect(() => {
    fetchStats();
    fetchHomeData();

    const playsChannel = supabase
      .channel('home-plays-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'play_history' }, () => {
        fetchStats();
        fetchHomeData();
      })
      .subscribe();

    const tracksChannel = supabase
      .channel('home-tracks-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracks' }, (payload) => {
        const updated = payload.new as any;
        setLiveTracks(prev => prev.map(t => t.id === updated.id ? { ...t, play_count: updated.play_count } : t));
        setWeeklyTrending(prev => prev.map(t => t.id === updated.id ? { ...t, play_count: updated.play_count } : t));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playsChannel);
      supabase.removeChannel(tracksChannel);
    };
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { data: userTracks } = await supabase.from("tracks").select("id, play_count").eq("user_id", user.id);
      if (userTracks) {
        setTotalPlays(userTracks.reduce((sum, t) => sum + (t.play_count || 0), 0));
      }
      const { count } = await supabase.from("play_history").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setTotalListenTime(Math.floor((count || 0) * 3 / 60));
    } catch {}
  };

  const fetchHomeData = async () => {
    try {
      // Recently played by this user
      if (user) {
        const { data: history } = await supabase
          .from("play_history")
          .select("track_id, played_at, tracks(id, title, artist_name, cover_url, audio_url, duration, play_count, genre, user_id)")
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(20);

        if (history) {
          const seen = new Set<string>();
          const items: RecentPlaylistItem[] = [];
          for (const h of history) {
            const t = h.tracks as any;
            if (t && !seen.has(t.id)) {
              seen.add(t.id);
              items.push({ id: t.id, title: t.title, artist: t.artist_name, coverUrl: t.cover_url, trackId: t.id });
            }
          }
          setRecentlyPlayed(items.slice(0, 6));

          // Determine user's most listened genre
          const genreCount: Record<string, number> = {};
          for (const h of history) {
            const t = h.tracks as any;
            if (t?.genre) genreCount[t.genre] = (genreCount[t.genre] || 0) + 1;
          }
          const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
          setUserGenre(topGenre);

          // Recommendations based on preferred genre
          if (topGenre) {
            const { data: recs } = await supabase
              .from("tracks")
              .select("*")
              .eq("genre", topGenre)
              .eq("is_approved", true)
              .order("play_count", { ascending: false })
              .limit(10);
            setRecommendedTracks(recs || []);
          }
        }
      }

      // Weekly trending
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { data: weeklyPlays } = await supabase
        .from("play_history")
        .select("track_id")
        .gte("played_at", oneWeekAgo.toISOString());

      if (weeklyPlays && weeklyPlays.length > 0) {
        const counts: Record<string, number> = {};
        weeklyPlays.forEach(p => { counts[p.track_id] = (counts[p.track_id] || 0) + 1; });
        const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
        if (topIds.length > 0) {
          const { data: wTracks } = await supabase.from("tracks").select("*").in("id", topIds).eq("is_approved", true);
          if (wTracks) setWeeklyTrending(wTracks.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)));
        }
      } else {
        // Fallback: just use play_count
        const { data: fallback } = await supabase.from("tracks").select("*").eq("is_approved", true).order("play_count", { ascending: false }).limit(10);
        setWeeklyTrending(fallback || []);
      }

      // Best of artists - group tracks by artist, pick top artists
      const { data: allApproved } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(60);

      if (allApproved) {
        const byArtist: Record<string, Track[]> = {};
        for (const t of allApproved) {
          if (!byArtist[t.artist_name]) byArtist[t.artist_name] = [];
          byArtist[t.artist_name].push(t);
        }
        const topArtists = Object.entries(byArtist)
          .filter(([, tracks]) => tracks.length >= 2)
          .sort((a, b) => b[1].reduce((s, t) => s + (t.play_count || 0), 0) - a[1].reduce((s, t) => s + (t.play_count || 0), 0))
          .slice(0, 3)
          .map(([artist, tracks]) => ({ artist, tracks: tracks.slice(0, 6) }));
        setTopArtistTracks(topArtists);
      }
    } catch (err) {
      console.error("fetchHomeData error:", err);
    }
  };

  const handleRecentPlay = (item: RecentPlaylistItem) => {
    const track = liveTracks.find(t => t.id === item.trackId);
    if (track && onPlayTrack) onPlayTrack(track);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-36 scrollbar-hide">
      {/* Hero Greeting */}
      <div className="relative pt-6 md:pt-8 pb-6 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground">
            {getGreeting()}{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
        </motion.div>
      </div>

      {/* Stats Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-8 scrollbar-hide mb-2">
        {[
          { icon: Music2, label: `${liveTracks.length} Tracks` },
          { icon: TrendingUp, label: `${totalPlays.toLocaleString()} Plays` },
          { icon: Clock, label: `${totalListenTime}h Listened` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border/30 whitespace-nowrap flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Recently Played - Spotify quick grid */}
      {recentlyPlayed.length > 0 && (
        <section className="py-4">
          <SectionHeader title="Jump back in" />
          <motion.div
            className="grid grid-cols-2 gap-2 px-4 md:px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {recentlyPlayed.map((item) => (
              <QuickPickTile key={item.id} item={item} onPlay={() => handleRecentPlay(item)} />
            ))}
          </motion.div>
        </section>
      )}

      {/* Trending This Week */}
      {weeklyTrending.length > 0 && (
        <section className="py-4">
          <SectionHeader title="Trending This Week" icon={Flame} />
          <TrackRow tracks={weeklyTrending} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
        </section>
      )}

      {/* Recommendations based on taste */}
      {recommendedTracks.length > 0 && userGenre && (
        <section className="py-4">
          <SectionHeader title={`More ${userGenre}`} icon={Headphones} />
          <TrackRow tracks={recommendedTracks} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
        </section>
      )}

      {/* Best of Artists */}
      {topArtistTracks.map(({ artist, tracks: artistTracks }) => (
        <section key={artist} className="py-4">
          <SectionHeader title={`Best of ${artist}`} />
          <TrackRow tracks={artistTracks} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
        </section>
      ))}

      {/* Recently Uploaded */}
      {liveTracks.length > 0 && (
        <section className="py-4">
          <SectionHeader title="New Uploads" icon={TrendingUp} />
          <TrackRow tracks={liveTracks.slice(0, 12)} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
        </section>
      )}

      {/* Empty state */}
      {liveTracks.length === 0 && recentlyPlayed.length === 0 && (
        <div className="px-4 md:px-8 py-16 flex flex-col items-center text-center">
          <Music2 className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Your feed is empty</h3>
          <p className="text-muted-foreground text-sm">Upload your first track or explore music to get started.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
