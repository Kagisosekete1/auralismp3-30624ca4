import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Brain,
  Focus,
  PartyPopper,
  Snowflake,
  Calendar,
  ChevronRight,
  Cloud,
  Disc3,
  Dumbbell,
  Flame,
  Frown,
  Globe2,
  Headphones,
  Heart,
  Mic2,
  Moon,
  Music2,
  ListPlus,
  Play,
  Radio,
  Repeat2,
  Search,
  Smile,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { allGenres } from "@/data/genres";
import SearchModal from "../SearchModal";
import TrackCard from "../TrackCard";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import album4 from "@/assets/album-4.jpg";
import album5 from "@/assets/album-5.jpg";
import album6 from "@/assets/album-6.jpg";
import { countryName } from "@/data/countries";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  genre?: string;
  play_count?: number;
  like_count?: number;
  user_id?: string;
  is_explicit?: boolean;
  created_at?: string;
  mood_tags?: string[] | null;
  artist_country?: string;
}

interface ExplorePageProps {
  tracks?: Track[];
  onPlayTrack?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onCreatePlaylist?: () => void;
  onArtistClick?: (track: Track) => void;
  onSelectArtist?: (artistUserId: string) => void;
  onSectionChange?: (section: string) => void;
  userCountry?: string;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
}

type Collection = {
  title: string;
  subtitle: string;
  tracks: Track[];
  icon: LucideIcon;
};

const fallbackArt = [album1, album2, album3, album4, album5, album6];
const preferredGenres = ["Afrobeats", "Amapiano", "Hip Hop", "Hip-Hop", "R&B", "Pop", "House", "Gospel", "Jazz", "Dance"];

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const formatCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 100) / 10}K`;
  return String(count);
};

const getTrackArt = (track: Track | undefined, index = 0) =>
  track?.cover_url || fallbackArt[index % fallbackArt.length];

const getCreatedTime = (track: Track) => track.created_at ? new Date(track.created_at).getTime() : 0;

const sectionMotion = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const ExplorePage = ({
  tracks = [],
  onPlayTrack,
  onAddToPlaylist,
  onCreatePlaylist,
  onArtistClick,
  onSelectArtist,
  onSectionChange,
  userCountry,
  onPlayAll,
  onShuffleAll,
}: ExplorePageProps) => {
  const { user } = useAuth();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [globalChartTracks, setGlobalChartTracks] = useState<Track[]>([]);
  const [countryChartTracks, setCountryChartTracks] = useState<Track[]>([]);
  const [weeklyTracks, setWeeklyTracks] = useState<Track[]>([]);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialSearch, setInitialSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    fetchAllSections();

    const tracksChannel = supabase
      .channel("explore-tracks-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tracks" }, (payload) => {
        const updated = payload.new as Track;
        const updater = (prev: Track[]) => prev.map((t) => (t.id === updated.id ? { ...t, play_count: updated.play_count } : t));
        setTrendingTracks(updater);
        setGlobalChartTracks((prev) => updater(prev).sort((a, b) => (b.play_count || 0) - (a.play_count || 0)));
        setCountryChartTracks((prev) => updater(prev).sort((a, b) => (b.play_count || 0) - (a.play_count || 0)));
        setWeeklyTracks(updater);
        setGenreTracks(updater);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tracksChannel);
    };
  }, [userCountry]);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("explore-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchUnreadCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAllSections = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: trending, error: trendingError } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(24);

      if (trendingError) throw trendingError;
      setTrendingTracks((trending as Track[]) || []);

      const { data: globalChart, error: globalChartError } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (globalChartError) throw globalChartError;
      setGlobalChartTracks((globalChart as Track[]) || []);

      if (userCountry) {
        const { data: countryArtists, error: countryArtistsError } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("country", userCountry)
          .limit(1000);
        if (countryArtistsError) throw countryArtistsError;
        const artistIds = [...new Set((countryArtists || []).map((artist) => artist.user_id).filter(Boolean))];
        if (artistIds.length) {
          const { data: countryTracks, error: countryTracksError } = await supabase
            .from("tracks")
            .select("*")
            .eq("is_approved", true)
            .in("user_id", artistIds)
            .order("play_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(50);
          if (countryTracksError) throw countryTracksError;
          setCountryChartTracks((countryTracks as Track[]) || []);
        } else {
          setCountryChartTracks([]);
        }
      } else {
        setCountryChartTracks([]);
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklyPlays } = await supabase
        .from("play_history")
        .select("track_id")
        .eq("is_validated", true)
        .gte("played_at", oneWeekAgo.toISOString());

      if (weeklyPlays && weeklyPlays.length > 0) {
        const playCounts: Record<string, number> = {};
        weeklyPlays.forEach((play) => {
          playCounts[play.track_id] = (playCounts[play.track_id] || 0) + 1;
        });

        const topIds = Object.entries(playCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 24)
          .map(([id]) => id);

        if (topIds.length > 0) {
          const { data: weeklyData } = await supabase
            .from("tracks")
            .select("*")
            .in("id", topIds)
            .eq("is_approved", true);

          const sorted = ((weeklyData as Track[]) || []).sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0));
          setWeeklyTracks(sorted);
        }
      } else {
        setWeeklyTracks([]);
      }

      setGenreTracks([]);
    } catch (fetchError) {
      console.error("Error fetching explore tracks:", fetchError);
      setError("Could not refresh Explore right now.");
    } finally {
      setLoading(false);
    }
  };

  const mergedTracks = useMemo(() => {
    const byId = new Map<string, Track>();
    [...tracks, ...trendingTracks, ...weeklyTracks, ...genreTracks].forEach((track) => byId.set(track.id, { ...byId.get(track.id), ...track }));
    return [...byId.values()];
  }, [tracks, trendingTracks, weeklyTracks, genreTracks]);

  const topTracks = useMemo(
    () => [...mergedTracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)),
    [mergedTracks]
  );

  const latestTracks = useMemo(
    () => [...mergedTracks].sort((a, b) => getCreatedTime(b) - getCreatedTime(a)).slice(0, 16),
    [mergedTracks]
  );

  const genreStats = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; track?: Track }>();
    mergedTracks.forEach((track) => {
      if (!track.genre) return;
      const key = normalize(track.genre);
      const current = counts.get(key) || { name: track.genre, count: 0, track };
      counts.set(key, {
        name: current.name,
        count: current.count + 1,
        track: current.track?.cover_url ? current.track : track,
      });
    });

    const seen = new Set<string>();
    const names = [...preferredGenres, ...allGenres.map((genre) => genre.name), ...counts.values()].map((item: any) =>
      typeof item === "string" ? item : item.name
    );

    return names
      .filter((name) => {
        const key = normalize(name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 14)
      .map((name, index) => {
        const stat = counts.get(normalize(name));
        const genreMeta = allGenres.find((genre) => normalize(genre.name) === normalize(name));
        return {
          name,
          count: stat?.count || 0,
          track: stat?.track,
          color: "from-emerald-600 to-teal-700",
          icon: [Music2, Disc3, Headphones, Sparkles, Radio][index % 5],
          art: stat?.track?.cover_url || null,
        };
      });
  }, [mergedTracks]);

  const moodDefinitions = useMemo(
    () => [
      { name: "Chill", icon: Snowflake, glow: "text-teal-300", match: (track: Track) => matchesMood(track, ["chill", "lofi", "lo-fi", "ambient", "jazz", "soul", "r&b"]) },
      { name: "Party", icon: PartyPopper, glow: "text-emerald-300", match: (track: Track) => matchesMood(track, ["party", "amapiano", "house", "dance", "edm", "afrobeat", "pop"]) },
      { name: "Love", icon: Heart, glow: "text-emerald-300", match: (track: Track) => matchesMood(track, ["love", "r&b", "soul", "romance"]) },
      { name: "Workout", icon: Dumbbell, glow: "text-teal-300", match: (track: Track) => matchesMood(track, ["workout", "energy", "drill", "trap", "hiphop", "hip-hop"]) || (track.play_count || 0) > 100 },
      { name: "Focus", icon: Focus, glow: "text-emerald-300", match: (track: Track) => matchesMood(track, ["focus", "instrumental", "ambient", "jazz", "lofi", "lo-fi"]) },
      { name: "Late Night", icon: Moon, glow: "text-teal-200", match: (track: Track) => matchesMood(track, ["late", "night", "r&b", "soul", "ambient", "chill"]) },
      { name: "Happy", icon: Smile, glow: "text-emerald-200", match: (track: Track) => matchesMood(track, ["happy", "pop", "dance", "afrobeat", "gospel"]) },
      { name: "Sad", icon: Frown, glow: "text-teal-200", match: (track: Track) => matchesMood(track, ["sad", "heartbreak", "soul", "r&b", "blues"]) },
      { name: "Energy", icon: Zap, glow: "text-emerald-200", match: (track: Track) => matchesMood(track, ["energy", "dance", "house", "amapiano", "drill", "trap"]) || (track.play_count || 0) > 250 },
    ],
    []
  );

  const selectedGenreTracks = useMemo(
    () => selectedGenre ? mergedTracks.filter((track) => normalize(track.genre) === normalize(selectedGenre)) : [],
    [mergedTracks, selectedGenre]
  );

  const selectedMoodTracks = useMemo(() => {
    const mood = moodDefinitions.find((item) => item.name === selectedMood);
    return mood ? mergedTracks.filter(mood.match) : [];
  }, [mergedTracks, moodDefinitions, selectedMood]);

  const charts = useMemo(() => {
    const weeklyOrTop = weeklyTracks.length > 0 ? weeklyTracks : topTracks;
    const risingArtists = [...mergedTracks]
      .sort((a, b) => (b.like_count || 0) + (b.play_count || 0) - ((a.like_count || 0) + (a.play_count || 0)))
      .filter((track, index, arr) => arr.findIndex((item) => item.artist_name === track.artist_name) === index);

    return [
      {
        id: "global",
        title: "Top 50 Global",
        shortTitle: "Global Top 50",
        description: "Most played across Auralis",
        icon: Globe2,
        tracks: globalChartTracks,
        art: getTrackArt(globalChartTracks[0] || topTracks[0], 1),
        className: "from-teal-950 via-emerald-900 to-black",
      },
      {
        id: "country",
        title: userCountry ? `Top 50 ${countryName(userCountry)}` : "Top 50 by Country",
        shortTitle: userCountry ? `${countryName(userCountry)} Top 50` : "Choose a country",
        description: userCountry ? `Most played by artists in ${countryName(userCountry)}` : "Set your country in your profile",
        icon: Trophy,
        tracks: countryChartTracks,
        art: getTrackArt(countryChartTracks[0] || topTracks[1], 2),
        className: "from-emerald-950 via-teal-950 to-black",
      },
      {
        id: "trending",
        title: "Trending Today",
        shortTitle: "Trending Today",
        description: "Most played songs",
        icon: TrendingUp,
        tracks: weeklyOrTop.slice(0, 50),
        art: getTrackArt(weeklyOrTop[0], 3),
        className: "from-blue-950 via-teal-950 to-black",
      },
      {
        id: "rising",
        title: "Rising Artists",
        shortTitle: "Rising Artists",
        description: "The future is here",
        icon: Users,
        tracks: risingArtists.slice(0, 50),
        art: getTrackArt(risingArtists[0], 4),
        className: "from-emerald-950 via-teal-950 to-black",
      },
    ];
  }, [mergedTracks, topTracks, weeklyTracks, globalChartTracks, countryChartTracks, userCountry]);

  const discoveryCards = useMemo(() => {
    const deepCuts = [...mergedTracks].sort((a, b) => (a.play_count || 0) - (b.play_count || 0)).slice(0, 20);
    const lateNight = mergedTracks.filter((track) => matchesMood(track, ["late", "night", "r&b", "soul", "ambient", "chill"])).slice(0, 20);
    const newUnknown = latestTracks.filter((track) => (track.play_count || 0) < 25).slice(0, 20);

    return [
      { title: "Surprise Me", subtitle: "Play random songs", icon: Sparkles, action: () => playRandomTrack() },
      { title: "Deep Cuts", subtitle: "Hidden gems", icon: Disc3, action: () => openCollection("Deep Cuts", "Quiet releases waiting to be found", deepCuts, Disc3) },
      { title: "On Repeat", subtitle: "Your top songs", icon: Repeat2, action: () => openCollection("On Repeat", "Most played music in the catalog", topTracks.slice(0, 30), Repeat2) },
      { title: "Late Night", subtitle: "Music for tonight", icon: Moon, action: () => openCollection("Late Night", "Smooth sounds for after dark", lateNight, Moon) },
      { title: "New & Unknown", subtitle: "Discover new artists", icon: Music2, action: () => openCollection("New & Unknown", "Fresh uploads with room to grow", newUnknown.length ? newUnknown : latestTracks, Music2) },
    ];
  }, [mergedTracks, latestTracks, topTracks]);

  const openSearch = (query = "") => {
    setInitialSearch(query);
    setSearchOpen(true);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      openSearch();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      openSearch(transcript);
    };
    recognition.onerror = () => openSearch();
    recognition.start();
  };

  const openCollection = (title: string, subtitle: string, list: Track[], icon: LucideIcon) => {
    setCollection({ title, subtitle, tracks: list, icon });
  };

  const playFirst = (list: Track[], fallbackMessage = "No tracks available yet") => {
    const first = list.find((track) => track.audio_url);
    if (first) onPlayTrack?.(first);
    else toast.info(fallbackMessage);
  };

  const playRandomTrack = () => {
    const playable = mergedTracks.filter((track) => track.audio_url);
    if (playable.length === 0) {
      toast.info("Upload music first, then Surprise Me can play something.");
      return;
    }
    onPlayTrack?.(playable[Math.floor(Math.random() * playable.length)]);
  };

  const handleGenreTap = (genre: string) => {
    setSelectedGenre((current) => (current === genre ? null : genre));
    setSelectedMood(null);
    setCollection(null);
  };

  const handleMoodTap = (mood: string) => {
    setSelectedMood((current) => (current === mood ? null : mood));
    setSelectedGenre(null);
    setCollection(null);
  };

  const activeFilteredTracks = selectedGenre ? selectedGenreTracks : selectedMood ? selectedMoodTracks : [];
  const activeTitle = selectedGenre || (selectedMood ? `${selectedMood} Vibes` : "");
  const activeSubtitle = selectedGenre ? "Filtered from real uploaded tracks" : selectedMood ? "Matched by genre, title, and mood tags" : "";
  const ActiveIcon = selectedGenre ? Music2 : Sparkles;
  const voiceSupported = typeof window !== "undefined" && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (collection) {
    return <CollectionDetail
      collection={collection}
      onBack={() => setCollection(null)}
      onPlayTrack={onPlayTrack}
      onArtistClick={onArtistClick}
      onSelectArtist={onSelectArtist}
    />;
  }

  return (
    <>
      <div className="min-h-full overflow-x-hidden bg-[#030307] text-white">
        <div className="relative mx-auto max-w-7xl px-5 pt-5 pb-32 md:px-8">
          <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,rgba(0,217,138,0.12),rgba(3,3,7,0))] pointer-events-none" />

          <motion.header
            className="relative z-10 mb-7"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-[44px] leading-none font-display font-bold tracking-normal text-white">Explore</h1>
              <motion.button
                onClick={() => onSectionChange?.("notifications")}
                className="relative w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                whileTap={{ scale: 0.94 }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 w-3 h-3 rounded-full bg-[#00d98a] ring-2 ring-[#050508]" />
                )}
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={onCreatePlaylist}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#00d98a]/30 bg-[#06221a] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,217,138,0.12)] transition-colors hover:bg-[#083126]"
              whileTap={{ scale: 0.98 }}
            >
              <ListPlus className="h-5 w-5 text-[#00d98a]" strokeWidth={1.6} />
              Create playlist
            </motion.button>

            <div className="mt-7 flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.055] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              <Search className="w-6 h-6 text-white/88 flex-shrink-0" />
              <button
                onClick={() => openSearch()}
                className="min-w-0 flex-1 text-left text-[15px] text-white/48"
              >
                Search songs, artists, albums...
              </button>
              {voiceSupported && (
                <motion.button
                  onClick={startVoiceSearch}
                  className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,#00d98a,#00b89c)] flex items-center justify-center shadow-[0_0_30px_rgba(0,210,145,0.35)]"
                  whileTap={{ scale: 0.92 }}
                  aria-label="Voice search"
                >
                  <Mic2 className="w-5 h-5 text-white" />
                </motion.button>
              )}
            </div>
          </motion.header>

          <main className="relative z-10 space-y-9">
            <MobileSection title="Genres" actionLabel="See all" onAction={() => onSectionChange?.("genre")}>
              {loading && genreStats.every((genre) => genre.count === 0) ? (
                <HorizontalSkeleton count={4} className="w-[152px] h-[178px] rounded-[20px]" />
              ) : (
                <div className="-mx-5 overflow-x-auto px-5 pb-1">
                  <div className="flex gap-3.5">
                    {genreStats.map((genre, index) => {
                      const Icon = genre.icon;
                      const active = selectedGenre === genre.name;
                      return (
                        <motion.button
                          key={genre.name}
                          onClick={() => handleGenreTap(genre.name)}
                          className={`relative h-[178px] w-[152px] flex-shrink-0 overflow-hidden rounded-[20px] border text-left shadow-[0_18px_45px_rgba(0,0,0,0.42)] ${active ? "border-[#00d98a]" : "border-white/12"}`}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.025 }}
                        >
                          {genre.art ? (
                            <img src={genre.art} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-[#020b08]" />
                          )}
                          <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-55`} />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.78))]" />
                          <div className="relative flex h-full flex-col justify-between p-4">
                            <span className="w-9 h-9 rounded-full bg-black/28 border border-white/12 backdrop-blur-md flex items-center justify-center">
                              <Icon className="w-4 h-4 text-white" />
                            </span>
                            <span>
                              <span className="block text-[18px] leading-5 font-bold text-white">{genre.name}</span>
                              <span className="mt-1 block text-[13px] text-white/82">{genre.count > 0 ? `${formatCount(genre.count)} songs` : "Explore catalog"}</span>
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </MobileSection>

            <MobileSection title="Moods & Vibes" actionLabel="See all" onAction={() => openCollection("All Vibes", "Every uploaded track ready for discovery", mergedTracks, Sparkles)}>
              <div className="-mx-5 overflow-x-auto px-5 pb-1">
                <div className="flex gap-5">
                  {moodDefinitions.map((mood) => {
                    const Icon = mood.icon;
                    const active = selectedMood === mood.name;
                    return (
                      <motion.button
                        key={mood.name}
                        onClick={() => handleMoodTap(mood.name)}
                        className="w-[82px] flex-shrink-0 text-center"
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className={`mx-auto flex w-[74px] h-[74px] items-center justify-center rounded-full border bg-[#071b16]/90 shadow-[0_0_30px_rgba(0,210,145,0.16)] ${active ? "border-[#00d98a]" : "border-white/10"}`}>
                          <Icon className={`w-8 h-8 ${mood.glow}`} strokeWidth={1.45} />
                        </span>
                        <span className={`mt-2 block text-[13px] font-semibold ${active ? "text-[#00d98a]" : "text-white/88"}`}>{mood.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </MobileSection>

            {(selectedGenre || selectedMood) && (
              <AnimatePresence mode="wait">
                <motion.section
                  key={activeTitle}
                  className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.36)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-[#00d98a]/15 flex items-center justify-center">
                          <ActiveIcon className="w-4 h-4 text-[#00d98a]" />
                        </span>
                        <h2 className="truncate text-[19px] font-display font-bold text-white">{activeTitle}</h2>
                      </div>
                      <p className="mt-1 text-[12px] text-white/50">{activeSubtitle}</p>
                    </div>
                    <button onClick={() => { setSelectedGenre(null); setSelectedMood(null); }} className="text-[12px] font-semibold text-[#00d98a]">
                      Clear
                    </button>
                  </div>
                  {activeFilteredTracks.length > 0 ? (
                    <div className="space-y-2.5">
                  {activeFilteredTracks.map((track, index) => (
                        <CompactTrackRow key={track.id} track={track} index={index} onPlayTrack={onPlayTrack} onArtistClick={onArtistClick} onSelectArtist={onSelectArtist} />
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel title="No matching tracks yet" body="Upload or discover tracks in this style and they will appear here." />
                  )}
                </motion.section>
              </AnimatePresence>
            )}

            <MobileSection title="Top Charts" actionLabel="See all" onAction={() => openCollection("Top Charts", "The 50 most-played songs in Auralis", globalChartTracks, Trophy)}>
              <div className="-mx-5 overflow-x-auto px-5 pb-1">
                <div className="flex gap-3.5">
                  {charts.map((chart, index) => {
                    const Icon = chart.icon;
                    return (
                      <motion.div
                        key={chart.id}
                        onClick={() => openCollection(chart.title, chart.description, chart.tracks, Icon)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openCollection(chart.title, chart.description, chart.tracks, Icon);
                          }
                        }}
                        className={`relative h-[190px] w-[166px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[20px] border border-white/12 bg-gradient-to-br ${chart.className} p-4 text-left shadow-[0_20px_48px_rgba(0,0,0,0.42)]`}
                        whileTap={{ scale: 0.97 }}
                        variants={sectionMotion}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.04 }}
                      >
                        <img src={chart.art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" loading="lazy" />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.82))]" />
                        <div className="relative flex h-full flex-col justify-between">
                          <div className="flex justify-end">
                            <Icon className="w-6 h-6 text-white/80" />
                          </div>
                          <div>
                            <p className="mb-8 text-center text-[22px] leading-6 font-display font-bold uppercase text-white drop-shadow">{chart.title}</p>
                            <div className="flex items-end justify-between gap-2">
                              <span className="min-w-0">
                                <span className="block truncate text-[14px] font-bold text-white">{chart.shortTitle}</span>
                                <span className="mt-1 block text-[12px] text-white/62">{chart.description}</span>
                              </span>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  playFirst(chart.tracks, "This chart needs more plays first.");
                                }}
                                className="w-9 h-9 flex-shrink-0 rounded-full bg-white text-[#008e68] flex items-center justify-center"
                                aria-label={`Play ${chart.title}`}
                              >
                                <Play className="ml-0.5 w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </MobileSection>

            <MobileSection title="New Releases" actionLabel="See all" onAction={() => openCollection("New Releases", "Fresh uploads from the catalog", [...mergedTracks].sort((a, b) => getCreatedTime(b) - getCreatedTime(a)), Calendar)}>
              {loading && latestTracks.length === 0 ? (
                <HorizontalSkeleton count={4} className="w-[150px] h-[230px] rounded-[18px]" />
              ) : latestTracks.length > 0 ? (
                <div className="-mx-5 overflow-x-auto px-5 pb-1">
                  <div className="flex gap-3.5">
                    {latestTracks.slice(0, 12).map((track, index) => (
                      <ReleaseCard
                        key={track.id}
                        track={track}
                        index={index}
                        onPlayTrack={onPlayTrack}
                        onArtistClick={onArtistClick}
                        onSelectArtist={onSelectArtist}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyPanel title="No releases yet" body="New uploads will appear here as soon as artists publish music." />
              )}
            </MobileSection>

            <MobileSection title="Try Something New" actionLabel="See all" onAction={() => openCollection("Discovery Mix", "Explore the full catalog", mergedTracks, Sparkles)}>
              <div className="-mx-5 overflow-x-auto px-5 pb-1">
                <div className="flex gap-3">
                  {discoveryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <motion.button
                        key={card.title}
                        onClick={card.action}
                        className="flex h-[74px] w-[218px] flex-shrink-0 items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.055] px-4 text-left shadow-[0_16px_36px_rgba(0,0,0,0.30)]"
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="w-10 h-10 rounded-2xl bg-[#00d98a]/13 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#00d98a]" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-bold text-white">{card.title}</span>
                          <span className="mt-0.5 block truncate text-[12px] text-white/50">{card.subtitle}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </MobileSection>

            {error && (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </main>
        </div>
      </div>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        tracks={mergedTracks}
        onNavigate={(section) => onSectionChange?.(section)}
        onSelectArtist={onSelectArtist}
        onPlayTrack={(track) => {
          onPlayTrack?.(track);
          setSearchOpen(false);
        }}
        initialQuery={initialSearch}
      />
    </>
  );
};

const matchesMood = (track: Track, terms: string[]) => {
  const haystack = normalize([
    track.title,
    track.artist_name,
    track.genre,
    ...(track.mood_tags || []),
  ].filter(Boolean).join(" "));
  return terms.some((term) => haystack.includes(normalize(term)));
};

const CollectionDetail = ({
  collection,
  onBack,
  onPlayTrack,
  onArtistClick,
  onSelectArtist,
}: {
  collection: Collection;
  onBack: () => void;
  onPlayTrack?: (track: Track) => void;
  onArtistClick?: (track: Track) => void;
  onSelectArtist?: (artistUserId: string) => void;
}) => {
  const Icon = collection.icon;
  return (
    <div className="min-h-full overflow-x-hidden bg-[#030907] px-5 pb-32 pt-3 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex items-center gap-4 border-b border-white/10 pb-5">
          <button type="button" onClick={onBack} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back to Explore">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00d98a]/10 text-[#00d98a]"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-display font-bold">{collection.title}</h1>
              <p className="mt-1 text-sm text-white/55">{collection.subtitle}</p>
            </div>
          </div>
        </header>
        {collection.tracks.length ? (
          <div className="space-y-2.5">
            {collection.tracks.map((track, index) => <CompactTrackRow key={track.id} track={track} index={index} onPlayTrack={onPlayTrack} onArtistClick={onArtistClick} onSelectArtist={onSelectArtist} />)}
          </div>
        ) : (
          <EmptyPanel title="No tracks in this collection yet" body="As artists from this country publish music, its most-played releases will appear here." />
        )}
      </div>
    </div>
  );
};

const MobileSection = ({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) => (
  <motion.section variants={sectionMotion} initial="hidden" animate="visible" transition={{ duration: 0.32 }}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[23px] leading-none font-display font-bold text-white">{title}</h2>
      {actionLabel && (
        <button onClick={onAction} className="flex items-center gap-1 text-[14px] font-semibold text-[#00d98a]">
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    {children}
  </motion.section>
);

const HorizontalSkeleton = ({ count, className }: { count: number; className: string }) => (
  <div className="-mx-5 overflow-hidden px-5">
    <div className="flex gap-3.5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${className} flex-shrink-0 animate-pulse bg-white/[0.07]`} />
      ))}
    </div>
  </div>
);

const EmptyPanel = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-5 text-center">
    <Music2 className="mx-auto mb-3 w-8 h-8 text-white/35" />
    <h3 className="font-display text-[17px] font-bold text-white">{title}</h3>
    <p className="mt-1 text-[13px] text-white/48">{body}</p>
  </div>
);

const CompactTrackRow = ({
  track,
  index,
  onPlayTrack,
  onArtistClick,
  onSelectArtist,
}: {
  track: Track;
  index: number;
  onPlayTrack?: (track: Track) => void;
  onArtistClick?: (track: Track) => void;
  onSelectArtist?: (artistUserId: string) => void;
}) => (
  <motion.div
    className="flex items-center gap-3 rounded-2xl bg-black/22 p-2.5"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.025 }}
  >
    <span className="w-6 flex-shrink-0 text-center text-sm font-bold tabular-nums text-white/40">{index + 1}</span>
    <img src={getTrackArt(track, index)} alt={track.title} className="w-12 h-12 rounded-xl object-cover" loading="lazy" />
    <div className="min-w-0 flex-1">
      <button onClick={() => onPlayTrack?.(track)} className="block max-w-full truncate text-left text-[14px] font-bold text-white">
        {track.title}
      </button>
      <button
        onClick={() => track.user_id ? onSelectArtist?.(track.user_id) : onArtistClick?.(track)}
        className="mt-0.5 block max-w-full truncate text-left text-[12px] text-white/52"
      >
        {track.artist_name}
      </button>
    </div>
    <button onClick={() => onPlayTrack?.(track)} className="w-10 h-10 rounded-full bg-white text-[#008e68] flex items-center justify-center" aria-label={`Play ${track.title}`}>
      <Play className="ml-0.5 w-4 h-4 fill-current" />
    </button>
  </motion.div>
);

const ReleaseCard = ({
  track,
  index,
  onPlayTrack,
  onArtistClick,
  onSelectArtist,
}: {
  track: Track;
  index: number;
  onPlayTrack?: (track: Track) => void;
  onArtistClick?: (track: Track) => void;
  onSelectArtist?: (artistUserId: string) => void;
}) => (
  <motion.article
    className="w-[150px] flex-shrink-0"
    initial={{ opacity: 0, x: 18 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.025 }}
  >
    <button
      onClick={() => onPlayTrack?.(track)}
      className="group relative block h-[150px] w-[150px] overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.05] shadow-[0_18px_42px_rgba(0,0,0,0.40)]"
    >
      <img src={getTrackArt(track, index)} alt={track.title} className="h-full w-full object-cover transition-transform duration-500 group-active:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.72))]" />
      <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-[#008e68] flex items-center justify-center shadow-lg">
        <Play className="ml-0.5 w-4 h-4 fill-current" />
      </span>
    </button>
    <button onClick={() => onPlayTrack?.(track)} className="mt-2 block max-w-full truncate text-left text-[14px] font-bold text-white">
      {track.title}
    </button>
    <div className="mt-0.5 flex items-center gap-1.5">
      <button
        onClick={() => track.user_id ? onSelectArtist?.(track.user_id) : onArtistClick?.(track)}
        className="min-w-0 truncate text-left text-[12px] text-white/54"
      >
        {track.artist_name}
      </button>
      {track.is_explicit && (
        <span className="flex-shrink-0 rounded-[4px] border border-white/20 px-1 text-[9px] font-bold text-white/72">E</span>
      )}
    </div>
  </motion.article>
);

const DesktopExplore = ({
  loading,
  error,
  tracks,
  trendingTracks,
  weeklyTracks,
  genreTracks,
  userPreferredGenre,
  onPlayTrack,
  onAddToPlaylist,
  onPlayAll,
  onShuffleAll,
}: {
  loading: boolean;
  error: string | null;
  tracks: Track[];
  trendingTracks: Track[];
  weeklyTracks: Track[];
  genreTracks: Track[];
  userPreferredGenre?: string;
  onPlayTrack?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const SectionHeader = ({ icon: Icon, title, color = "text-primary" }: { icon: LucideIcon; title: string; color?: string }) => (
    <div className="flex items-center gap-2.5 mb-5 md:mb-6">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <h2 className="text-lg md:text-2xl font-display font-bold text-foreground">{title}</h2>
    </div>
  );

  const renderTrackGrid = (list: Track[], emptyIcon: LucideIcon, emptyTitle: string, emptyBody: string) => {
    const EmptyIcon = emptyIcon;
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="glass rounded-2xl p-6 md:p-10 text-center border border-border/30">
          <EmptyIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-display font-bold text-foreground mb-1">{emptyTitle}</h3>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto">{emptyBody}</p>
        </div>
      );
    }

    return (
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5" variants={containerVariants} initial="hidden" animate="visible">
        {list.map((track) => (
          <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onAddToPlaylist={onAddToPlaylist} />
        ))}
      </motion.div>
    );
  };

  return (
    <div className="pb-32">
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-5xl font-display font-bold text-foreground mb-1.5">Explore</h1>
          <p className="text-muted-foreground text-sm md:text-lg">Discover trending music and new releases</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={onPlayAll} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
              Play All
            </button>
            <button onClick={onShuffleAll} className="px-4 py-2 rounded-xl glass border border-border/30 text-foreground text-sm font-semibold">
              Shuffle All
            </button>
          </div>
        </motion.div>
      </div>

      {error && <div className="mx-4 md:mx-8 mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <section className="px-4 md:px-8 pt-6 pb-2">
        <SectionHeader icon={Calendar} title="Most Played This Week" color="text-accent" />
        {renderTrackGrid(weeklyTracks, Calendar, "No weekly data yet", "Play some tracks and they'll show up here!")}
      </section>

      <section className="px-4 md:px-8 py-5">
        <SectionHeader icon={Flame} title="Trending Now" />
        {renderTrackGrid(trendingTracks, TrendingUp, "No trending tracks yet", "Tracks with the most plays will appear here")}
      </section>

      {userPreferredGenre && genreTracks.length > 0 && (
        <section className="px-4 md:px-8 py-5">
          <SectionHeader icon={Music2} title={`More ${userPreferredGenre}`} color="text-secondary" />
          {renderTrackGrid(genreTracks, Music2, "No genre tracks yet", "Tracks from this genre will appear here.")}
        </section>
      )}

      <section className="px-4 md:px-8 py-5">
        <h2 className="text-lg md:text-2xl font-display font-bold text-foreground mb-5 md:mb-6">All Tracks</h2>
        {renderTrackGrid(tracks, Music2, "No tracks uploaded yet", "Be the first to upload music!")}
      </section>
    </div>
  );
};

export default ExplorePage;
