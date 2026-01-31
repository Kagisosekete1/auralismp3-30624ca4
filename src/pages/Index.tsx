import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NowPlayingBar from "@/components/NowPlayingBar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import AddTrackModal from "@/components/AddTrackModal";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import FullUploadForm from "@/components/FullUploadForm";
import ArtistProfilePage from "@/components/pages/ArtistProfilePage";
import InboxModal from "@/components/InboxModal";
import QueueModal from "@/components/QueueModal";
import HomePage from "@/components/pages/HomePage";
import ExplorePage from "@/components/pages/ExplorePage";
import GenrePage from "@/components/pages/GenrePage";
import ArtistsPage from "@/components/pages/ArtistsPage";
import LibraryPage from "@/components/pages/LibraryPage";
import ProfilePage from "@/components/pages/ProfilePage";
import SettingsPage from "@/components/pages/SettingsPage";
import NotificationsPage from "@/components/pages/NotificationsPage";
import UpgradePage from "@/components/pages/UpgradePage";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useQueue } from "@/hooks/useQueue";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tracks, playlists, likedTrackIds, profile, loading: dbLoading, createPlaylist, deletePlaylist, toggleLike, refetchTracks } = useDatabase();
  const { currentTrack, isPlaying, progress, duration, volume, isMuted, isPremium, playTrack, togglePlay, seek, setVolume, setIsMuted, formatTime } = useAudioPlayer();
  const { queue, history, shuffleEnabled, repeatMode, addToQueue, removeFromQueue, clearQueue, toggleShuffle, cycleRepeat, playNext, playPrevious } = useQueue();

  const [activeSection, setActiveSection] = useState("home");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showUploadMusic, setShowUploadMusic] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<{ id: string; title: string } | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleCreatePlaylist = async (name: string, description: string) => {
    const newPlaylist = await createPlaylist(name, description);
    if (newPlaylist) {
      toast.success(`Playlist "${name}" created!`);
      setActiveSection(`playlist-${newPlaylist.id}`);
      setSelectedPlaylistId(newPlaylist.id);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    await deletePlaylist(id);
    toast.success(`Playlist "${playlist?.name}" deleted`);
    if (activeSection === `playlist-${id}`) {
      setActiveSection("home");
      setSelectedPlaylistId(null);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (section.startsWith("playlist-")) {
      setSelectedPlaylistId(section.replace("playlist-", ""));
    } else {
      setSelectedPlaylistId(null);
    }
  };

  const handleSelectPlaylist = (id: string) => {
    setActiveSection(`playlist-${id}`);
    setSelectedPlaylistId(id);
  };

  const handlePlayTrack = (track: any) => {
    const audioTrack = {
      id: track.id,
      title: track.title || track.name,
      artist: track.artist_name || track.artist,
      audioUrl: track.audio_url || track.audioUrl,
      coverUrl: track.cover_url || track.coverUrl,
      videoReelUrl: track.video_reel_url || track.videoReelUrl,
      duration: track.duration,
    };
    playTrack(audioTrack);
    addToQueue(audioTrack);
  };

  const handleToggleLikeCurrentTrack = () => {
    if (currentTrack) {
      toggleLike(currentTrack.id);
      toast.success(likedTrackIds.includes(currentTrack.id) ? "Removed from Liked Songs" : "Added to Liked Songs");
    }
  };

  const handleRemoveFromQueue = (trackId: string) => {
    const index = queue.findIndex(t => t.id === trackId);
    if (index !== -1) removeFromQueue(index);
  };

  const sidebarPlaylists = playlists.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    tracks: [],
    gradient: p.gradient,
    createdAt: new Date(p.created_at),
  }));

  if (authLoading || dbLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleViewArtist = (artistUserId: string) => {
    setSelectedArtistId(artistUserId);
    setActiveSection("artist-profile");
  };

  const handleMessageArtist = (artistUserId: string) => {
    setShowInbox(true);
  };

  const handleAddToPlaylist = (track: any) => {
    setSelectedTrackForPlaylist({ id: track.id, title: track.title || track.name });
    setShowAddToPlaylist(true);
  };

  const renderContent = () => {
    // Handle artist profile view
    if (activeSection === "artist-profile" && selectedArtistId) {
      return (
        <ArtistProfilePage 
          artistUserId={selectedArtistId} 
          onBack={() => {
            setSelectedArtistId(null);
            setActiveSection("artists");
          }} 
          onPlayTrack={handlePlayTrack}
          onMessage={handleMessageArtist}
          onAddToPlaylist={handleAddToPlaylist}
        />
      );
    }

    switch (activeSection) {
      case "home":
        return <HomePage playlists={sidebarPlaylists} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onUploadMusic={() => setShowUploadMusic(true)} tracks={tracks} onPlayTrack={handlePlayTrack} onViewProfile={handleViewArtist} onAddToPlaylist={handleAddToPlaylist} />;
      case "explore":
        return <ExplorePage tracks={tracks} onPlayTrack={handlePlayTrack} onAddToPlaylist={handleAddToPlaylist} userPreferredGenre={profile?.country} />;
      case "genre":
        return <GenrePage />;
      case "artists":
        return <ArtistsPage onViewArtist={handleViewArtist} />;
      case "library":
        return <LibraryPage playlists={sidebarPlaylists} likedCount={likedTrackIds.length} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onLikedSongs={() => handleSectionChange("liked")} tracks={tracks} onPlayTrack={handlePlayTrack} isArtist={profile?.is_artist || false} />;
      case "profile":
        return <ProfilePage likedCount={likedTrackIds.length} playlistCount={playlists.length} tracks={tracks} onPlayTrack={handlePlayTrack} onAddToPlaylist={handleAddToPlaylist} />;
      case "settings":
        return <SettingsPage onSectionChange={handleSectionChange} />;
      case "notifications":
        return <NotificationsPage />;
      case "upgrade":
        return <UpgradePage />;
      default:
        return <HomePage playlists={sidebarPlaylists} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onUploadMusic={() => setShowUploadMusic(true)} tracks={tracks} onPlayTrack={handlePlayTrack} onViewProfile={handleViewArtist} onAddToPlaylist={handleAddToPlaylist} />;
    }
  };

  const nowPlayingTrack = currentTrack ? { id: currentTrack.id, title: currentTrack.title, artist: currentTrack.artist, coverUrl: currentTrack.coverUrl, videoReelUrl: currentTrack.videoReelUrl, duration: currentTrack.duration } : null;

  return (
    <motion.div className="h-screen flex flex-col bg-background overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-1 overflow-hidden">
        <div className={`hidden md:block ${sidebarOpen ? 'w-72' : 'w-0'} transition-all`}>
          <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} playlists={sidebarPlaylists} onCreatePlaylist={() => setShowCreatePlaylist(true)} onDeletePlaylist={handleDeletePlaylist} likedCount={likedTrackIds.length} onUploadMusic={() => setShowUploadMusic(true)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar onSectionChange={handleSectionChange} onUploadMusic={() => setShowUploadMusic(true)} tracks={tracks} onPlayTrack={handlePlayTrack} />
          <div className="flex-1 overflow-y-auto pb-36 md:pb-24">{renderContent()}</div>
        </div>
      </div>

      <NowPlayingBar
        currentTrack={nowPlayingTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        onToggleLike={handleToggleLikeCurrentTrack}
        progress={progress}
        duration={duration}
        onSeek={seek}
        volume={volume}
        onVolumeChange={setVolume}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        formatTime={formatTime}
        onNext={() => playNext()}
        onPrevious={() => playPrevious()}
        onShuffle={toggleShuffle}
        onRepeat={cycleRepeat}
        isShuffled={shuffleEnabled}
        repeatMode={repeatMode}
        onShowQueue={() => setShowQueue(true)}
        isPremium={isPremium}
      />

      <MobileNav activeSection={activeSection} onSectionChange={handleSectionChange} onUploadMusic={() => setShowUploadMusic(true)} />

      <CreatePlaylistModal isOpen={showCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} onCreate={handleCreatePlaylist} />
      <AddTrackModal isOpen={showAddTrack} onClose={() => setShowAddTrack(false)} onAdd={() => {}} playlistName="" />
      <AddToPlaylistModal 
        isOpen={showAddToPlaylist} 
        onClose={() => {
          setShowAddToPlaylist(false);
          setSelectedTrackForPlaylist(null);
        }} 
        trackId={selectedTrackForPlaylist?.id || ""} 
        trackTitle={selectedTrackForPlaylist?.title || ""} 
      />
      <FullUploadForm isOpen={showUploadMusic} onClose={() => setShowUploadMusic(false)} onSuccess={refetchTracks} />
      <InboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />
      <QueueModal isOpen={showQueue} onClose={() => setShowQueue(false)} queue={queue} currentTrack={nowPlayingTrack} onPlayTrack={(t) => playTrack({ id: t.id, title: t.title, artist: t.artist, audioUrl: t.audioUrl, coverUrl: t.coverUrl, duration: t.duration })} onRemoveFromQueue={handleRemoveFromQueue} onClearQueue={clearQueue} history={history} />
    </motion.div>
  );
};

export default Index;
