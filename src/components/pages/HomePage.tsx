import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Music2, TrendingUp, Clock, Flame, Headphones, ChevronRight, UserPlus, Check, Sparkles, Search, Bell, Play, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import TrackCard from "../TrackCard";
import PremiumUpsellBanner from "../PremiumUpsellBanner";
import SearchModal from "../SearchModal";
import type { Playlist } from "@/hooks/useAppState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dispatchPushNotification } from "@/lib/dispatchPushNotification";

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

interface ArtistCard {
  userId: string;
  name: string;
  avatarUrl?: string;
  totalPlays: number;
  latestTracks: Track[];
  isFollowed: boolean;
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
  onUpgrade?: () => void;
  onArtistClick?: (track: Track) => void;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
  onSectionChange?: (section: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const QuickPickTile = ({ item, onPlay }: { item: RecentPlaylistItem; onPlay: () => void }) => (
  <motion.button
    variants={itemVariants}
    onClick={onPlay}
    className="flex items-center gap-2.5 rounded-xl glass border border-border/20 overflow-hidden hover:border-primary/30 hover:bg-surface-elevated/60 transition-all group text-left w-full"
    whileTap={{ scale: 0.97 }}
  >
    <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden">
      {item.coverUrl ? (
        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
          <Music2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0 pr-2 py-2">
      <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
      <p className="text-[10px] text-muted-foreground truncate">{item.artist}</p>
    </div>
  </motion.button>
);

const TrackRow = ({ tracks, onPlayTrack, onAddToPlaylist, onArtistClick }: { tracks: Track[]; onPlayTrack?: (t: Track) => void; onAddToPlaylist?: (t: Track) => void; onArtistClick?: (t: Track) => void }) => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-8">
    {tracks.map((track) => (
      <div key={track.id} className="flex-shrink-0 w-36 md:w-40">
        <TrackCard track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} onArtistClick={onArtistClick} />
      </div>
    ))}
  </div>
);

const SectionHeader = ({ title, icon: Icon, onMore }: { title: string; icon?: any; onMore?: () => void }) => (
  <div className="flex items-center justify-between px-4 md:px-8 mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      <h2 className="text-lg md:text-xl font-display font-bold text-foreground">{title}</h2>
    </div>
    {onMore && (
      <button onClick={onMore} className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
        See all <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

const ArtistMiniCard = ({ artist, onViewProfile, onPlayTrack, onAddToPlaylist }: {
  artist: ArtistCard;
  onViewProfile?: (id: string) => void;
  onPlayTrack?: (t: Track) => void;
  onAddToPlaylist?: (t: Track) => void;
}) => {
  const [followed, setFollowed] = useState(artist.isFollowed);
  const { user } = useAuth();

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (followed) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", artist.userId);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: artist.userId });
      if (error) return;
      void dispatchPushNotification("follower", user.id, user.id);
    }
    setFollowed(!followed);
  };

  return (
    <motion.div
      className="flex-shrink-0 w-44 glass border border-border/20 rounded-2xl overflow-hidden hover:border-primary/20 transition-all"
      whileTap={{ scale: 0.98 }}
      variants={itemVariants}
    >
      {/* Artist header */}
      <div className="p-3 flex items-center gap-2.5 border-b border-border/10">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={artist.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
            {artist.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{artist.name}</p>
          <p className="text-[10px] text-muted-foreground">{artist.totalPlays.toLocaleString()} plays</p>
        </div>
        <motion.button
          onClick={handleFollow}
          whileTap={{ scale: 0.85 }}
          className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
            followed ? "bg-primary/20 text-primary" : "bg-surface-elevated text-muted-foreground hover:text-primary"
          }`}
        >
          {followed ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
        </motion.button>
      </div>

      {/* Latest track preview */}
      {artist.latestTracks[0] && (
        <button
          className="w-full text-left p-2 flex items-center gap-2 hover:bg-surface-elevated/40 transition-colors"
          onClick={() => onPlayTrack?.(artist.latestTracks[0])}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated">
            {artist.latestTracks[0].cover_url ? (
              <img src={artist.latestTracks[0].cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-foreground truncate">{artist.latestTracks[0].title}</p>
            <p className="text-[9px] text-muted-foreground">Latest track</p>
          </div>
        </button>
      )}
    </motion.div>
  );
};

const HomePage = ({ playlists, onCreatePlaylist, onSelectPlaylist, onUploadMusic, tracks = [], onPlayTrack, onViewProfile, onAddToPlaylist, onUpgrade, onArtistClick, onPlayAll, onShuffleAll, onSectionChange }: HomePageProps) => {
  const { user } = useAuth();
  const { profile } = useDatabase();
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalListenTime, setTotalListenTime] = useState(0);
  const [liveTracks, setLiveTracks] = useState<Track[]>(tracks);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentPlaylistItem[]>([]);
  const [weeklyTrending, setWeeklyTrending] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [forYouTracks, setForYouTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<ArtistCard[]>([]);
  const [userGenre, setUserGenre] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

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
      if (userTracks) setTotalPlays(userTracks.reduce((sum, t) => sum + (t.play_count || 0), 0));
      const { count } = await supabase.from("play_history").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setTotalListenTime(Math.floor((count || 0) * 3 / 60));
    } catch {}
  };

  const fetchHomeData = async () => {
    try {
      let topGenre: string | null = null;
      let listenedTrackIds: string[] = [];

      if (user) {
        const { data: history } = await supabase
          .from("play_history")
          .select("track_id, played_at, tracks(id, title, artist_name, cover_url, audio_url, duration, play_count, genre, user_id)")
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(50);

        if (history) {
          const seen = new Set<string>();
          const items: RecentPlaylistItem[] = [];
          const genreCount: Record<string, number> = {};

          for (const h of history) {
            const t = h.tracks as any;
            if (t) {
              listenedTrackIds.push(t.id);
              if (!seen.has(t.id)) {
                seen.add(t.id);
                items.push({ id: t.id, title: t.title, artist: t.artist_name, coverUrl: t.cover_url, trackId: t.id });
              }
              if (t.genre) genreCount[t.genre] = (genreCount[t.genre] || 0) + 1;
            }
          }

          setRecentlyPlayed(items.slice(0, 6));
          topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
          setUserGenre(topGenre);

          // Recommendations by genre
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

          // For You: mix of top genres + not yet listened tracks
          const { data: allTracks } = await supabase
            .from("tracks")
            .select("*")
            .eq("is_approved", true)
            .order("play_count", { ascending: false })
            .limit(100);

          if (allTracks) {
            const uniqueListened = new Set(listenedTrackIds);
            const notListened = allTracks.filter(t => !uniqueListened.has(t.id));
            const alreadyListened = allTracks.filter(t => uniqueListened.has(t.id));
            // Mix: 60% new + 40% familiar
            const forYou = [
              ...notListened.slice(0, 12),
              ...alreadyListened.slice(0, 8),
            ].sort(() => Math.random() - 0.5).slice(0, 20);
            setForYouTracks(forYou);
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
        const { data: fallback } = await supabase.from("tracks").select("*").eq("is_approved", true).order("play_count", { ascending: false }).limit(10);
        setWeeklyTrending(fallback || []);
      }

      // Top artists with profile info + follow status
      const { data: allApproved } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(80);

      if (allApproved) {
        const byUserId: Record<string, Track[]> = {};
        for (const t of allApproved) {
          if (t.user_id) {
            if (!byUserId[t.user_id]) byUserId[t.user_id] = [];
            byUserId[t.user_id].push(t);
          }
        }

        const topUserIds = Object.entries(byUserId)
          .filter(([, ts]) => ts.length >= 1)
          .sort((a, b) => b[1].reduce((s, t) => s + (t.play_count || 0), 0) - a[1].reduce((s, t) => s + (t.play_count || 0), 0))
          .slice(0, 8)
          .map(([uid]) => uid);

        if (topUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, artist_name, avatar_url")
            .in("user_id", topUserIds);

          let followedIds = new Set<string>();
          if (user) {
            const { data: follows } = await supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", user.id)
              .in("following_id", topUserIds);
            followedIds = new Set((follows || []).map(f => f.following_id));
          }

          const artistCards: ArtistCard[] = topUserIds
            .filter(uid => uid !== user?.id) // exclude self
            .map(uid => {
              const p = profiles?.find(pr => pr.user_id === uid);
              const ts = byUserId[uid] || [];
              return {
                userId: uid,
                name: p?.artist_name || p?.display_name || ts[0]?.artist_name || "Artist",
                avatarUrl: p?.avatar_url || undefined,
                totalPlays: ts.reduce((s, t) => s + (t.play_count || 0), 0),
                latestTracks: ts.slice(0, 3),
                isFollowed: followedIds.has(uid),
              };
            })
            .slice(0, 6);

          setTopArtists(artistCards);
        }
      }
    } catch (err) {
      console.error("fetchHomeData error:", err);
    }
  };

  const handleRecentPlay = (item: RecentPlaylistItem) => {
    const track = liveTracks.find(t => t.id === item.trackId);
    if (track && onPlayTrack) onPlayTrack(track);
    else {
      // Try fetching track if not in liveTracks
      supabase.from("tracks").select("*").eq("id", item.trackId).single().then(({ data }) => {
        if (data && onPlayTrack) onPlayTrack(data as Track);
      });
    }
  };

  const featuredTrack = useMemo(() => weeklyTrending[0] || liveTracks[0] || forYouTracks[0] || null, [weeklyTrending, liveTracks, forYouTracks]);
  const username = profile?.username ? `@${profile.username.toLowerCase()}` : `@${(profile?.display_name || profile?.artist_name || "auralisuser").toLowerCase().replace(/[^a-z0-9_]+/g, "_")}`;
  const mobileTrending = weeklyTrending.length > 0 ? weeklyTrending : liveTracks.slice(0, 10);

  return (
    <div className="relative flex-1 overflow-y-auto pb-36 scrollbar-hide">
      <div className="md:hidden relative overflow-hidden px-5 pt-0 pb-6 bg-[#030907]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_12%_8%,rgba(26,214,112,0.22),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(0,180,146,0.18),transparent_30%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/55">{getGreeting()}</p>
              <h1 className="mt-0.5 truncate text-lg leading-tight font-display font-semibold text-white">{username}</h1>
            </div>
            <button onClick={() => onSectionChange?.("notifications")} className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white backdrop-blur-xl" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <button onClick={() => setShowSearch(true)} className="mt-5 flex min-h-[60px] w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-5 text-left text-white/55 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <Search className="h-6 w-6 text-white" />
            <span className="min-w-0 flex-1 truncate text-[15px]">Search songs, artists, albums...</span>
          </button>

          {featuredTrack && (
            <button onClick={() => onPlayTrack?.(featuredTrack)} className="relative mt-6 h-[220px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5 text-left shadow-[0_28px_80px_rgba(0,0,0,0.48)]">
              {featuredTrack.cover_url ? (
                <img src={featuredTrack.cover_url} alt={featuredTrack.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#10221b] to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-between p-5">
                <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Featured</span>
                <div>
                  <h2 className="max-w-[82%] text-[30px] leading-[0.95] font-display font-bold tracking-normal text-white">{featuredTrack.title}</h2>
                  <p className="mt-2 text-sm font-medium text-white/72">{featuredTrack.artist_name}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#08783e] shadow-lg">
                    <Play className="h-4 w-4 fill-current" /> Play Now
                  </span>
                </div>
              </div>
            </button>
          )}

          <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-1 scrollbar-hide">
            <div className="flex gap-3">
              <button onClick={() => mobileTrending[0] && onPlayTrack?.(mobileTrending[0])} className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 text-sm font-semibold text-white"><Flame className="h-4 w-4 text-emerald-300" />Trending</button>
              <button onClick={() => onSectionChange?.("explore")} className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 text-sm font-semibold text-white"><TrendingUp className="h-4 w-4 text-emerald-300" />Charts</button>
              <button onClick={() => liveTracks[0] && onPlayTrack?.(liveTracks[0])} className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-emerald-300" />New Releases</button>
              <button onClick={() => forYouTracks[0] && onPlayTrack?.(forYouTracks[0])} className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 text-sm font-semibold text-white"><Headphones className="h-4 w-4 text-emerald-300" />For You</button>
              <button onClick={onUploadMusic} className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-4 text-sm font-semibold text-white"><UploadCloud className="h-4 w-4 text-emerald-300" />Upload</button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Greeting */}
      <div className="hidden md:block relative pt-5 pb-4 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">
            {getGreeting()}{profile?.username ? `, @${profile.username.toLowerCase()}` : profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
        </motion.div>
      </div>

      {/* Stats Pills */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-2 px-4 md:px-8 scrollbar-hide mb-2">
        {[
          { icon: Music2, label: `${liveTracks.length} Tracks` },
          { icon: TrendingUp, label: `${totalPlays.toLocaleString()} Plays` },
          { icon: Clock, label: `${totalListenTime}h Listened` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-border/30 whitespace-nowrap flex-shrink-0">
            <Icon className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Recently Played - Spotify quick grid */}
      {recentlyPlayed.length > 0 && (
        <section className="py-3">
          <SectionHeader title="Jump Back In" />
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
        <section className="py-3">
          <SectionHeader title="Trending This Week" icon={Flame} />
          <TrackRow tracks={weeklyTrending} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} onArtistClick={onArtistClick} />
        </section>
      )}

      {/* For You Daily Mix */}
      {forYouTracks.length > 0 && (
        <section className="py-3">
          <SectionHeader title="Made For You" icon={Sparkles} />
          <TrackRow tracks={forYouTracks} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} onArtistClick={onArtistClick} />
        </section>
      )}

      {/* Top Artists with follow + latest track */}
      {topArtists.length > 0 && (
        <section className="py-3">
          <SectionHeader title="Artists You May Like" />
          <motion.div
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {topArtists.map((artist) => (
              <ArtistMiniCard
                key={artist.userId}
                artist={artist}
                onViewProfile={onViewProfile}
                onPlayTrack={onPlayTrack}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Recommendations based on taste */}
      {recommendedTracks.length > 0 && userGenre && (
        <section className="py-3">
          <SectionHeader title={`More ${userGenre}`} icon={Headphones} />
          <TrackRow tracks={recommendedTracks} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} onArtistClick={onArtistClick} />
        </section>
      )}

      {/* New Uploads */}
      {liveTracks.length > 0 && (
        <section className="py-3">
          <SectionHeader title="New Uploads" icon={TrendingUp} />
          <TrackRow tracks={liveTracks.slice(0, 12)} onPlayTrack={onPlayTrack} onAddToPlaylist={onAddToPlaylist} onArtistClick={onArtistClick} />
        </section>
      )}

      {/* Premium Upsell for free users */}
      {profile?.subscription_tier !== 'pro' && profile?.subscription_tier !== 'artist' && onUpgrade && (
        <PremiumUpsellBanner onUpgrade={onUpgrade} />
      )}

      {/* Empty state */}
      {liveTracks.length === 0 && recentlyPlayed.length === 0 && (
        <div className="px-4 md:px-8 py-16 flex flex-col items-center text-center">
          <Music2 className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Your feed is empty</h3>
          <p className="text-muted-foreground text-sm">Upload your first track or explore music to get started.</p>
        </div>
      )}

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        tracks={liveTracks}
        onPlayTrack={onPlayTrack as any}
        onNavigate={(section) => onSectionChange?.(section)}
        onSelectArtist={onViewProfile}
      />
    </div>
  );
};

export default HomePage;
