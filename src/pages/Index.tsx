import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import NowPlayingBar from "@/components/NowPlayingBar";
import TopBar from "@/components/TopBar";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import AddTrackModal from "@/components/AddTrackModal";
import UploadMusicModal from "@/components/UploadMusicModal";
import PlaylistView from "@/components/PlaylistView";
import HomePage from "@/components/pages/HomePage";
import ExplorePage from "@/components/pages/ExplorePage";
import GenrePage from "@/components/pages/GenrePage";
import ArtistsPage from "@/components/pages/ArtistsPage";
import LibraryPage from "@/components/pages/LibraryPage";
import ProfilePage from "@/components/pages/ProfilePage";
import SettingsPage from "@/components/pages/SettingsPage";
import NotificationsPage from "@/components/pages/NotificationsPage";
import UpgradePage from "@/components/pages/UpgradePage";
import { useAppState } from "@/hooks/useAppState";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showUploadMusic, setShowUploadMusic] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    playlists, currentTrack, isPlaying, likedSongs,
    createPlaylist, deletePlaylist, addTrackToPlaylist,
    removeTrackFromPlaylist, toggleLike, playTrack, togglePlay,
  } = useAppState();

  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist = createPlaylist(name, description);
    toast.success(`Playlist "${name}" created!`);
    setActiveSection(`playlist-${newPlaylist.id}`);
    setSelectedPlaylistId(newPlaylist.id);
  };

  const handleDeletePlaylist = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    deletePlaylist(id);
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

  const handleAddTrackToPlaylist = (track: any) => {
    if (selectedPlaylistId && track) {
      addTrackToPlaylist(selectedPlaylistId, track);
      toast.success("Track added to playlist!");
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const isCurrentTrackLiked = currentTrack ? likedSongs.includes(currentTrack.id) : false;

  const handleToggleLikeCurrentTrack = () => {
    if (currentTrack) {
      toggleLike(currentTrack.id);
      toast.success(isCurrentTrackLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
    }
  };

  const renderContent = () => {
    if (selectedPlaylist) {
      return (
        <PlaylistView
          playlist={selectedPlaylist}
          onAddTrack={() => setShowAddTrack(true)}
          onRemoveTrack={(trackId) => {
            removeTrackFromPlaylist(selectedPlaylist.id, trackId);
            toast.success("Track removed");
          }}
          onPlayTrack={playTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />
      );
    }

    switch (activeSection) {
      case "home":
        return <HomePage playlists={playlists} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onUploadMusic={() => setShowUploadMusic(true)} />;
      case "explore":
        return <ExplorePage />;
      case "genre":
        return <GenrePage />;
      case "artists":
        return <ArtistsPage />;
      case "library":
        return <LibraryPage playlists={playlists} likedCount={likedSongs.length} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onLikedSongs={() => handleSectionChange("liked")} />;
      case "profile":
        return <ProfilePage likedCount={likedSongs.length} playlistCount={playlists.length} />;
      case "settings":
        return <SettingsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "upgrade":
        return <UpgradePage />;
      default:
        return <HomePage playlists={playlists} onCreatePlaylist={() => setShowCreatePlaylist(true)} onSelectPlaylist={handleSelectPlaylist} onUploadMusic={() => setShowUploadMusic(true)} />;
    }
  };

  return (
    <motion.div className="h-screen flex flex-col bg-background overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile */}
        <div className={`hidden md:block ${sidebarOpen ? 'w-72' : 'w-0'} transition-all`}>
          <Sidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            playlists={playlists}
            onCreatePlaylist={() => setShowCreatePlaylist(true)}
            onDeletePlaylist={handleDeletePlaylist}
            likedCount={likedSongs.length}
            onUploadMusic={() => setShowUploadMusic(true)}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onSectionChange={handleSectionChange}
            onUploadMusic={() => setShowUploadMusic(true)}
          />
          {renderContent()}
        </div>
      </div>

      <NowPlayingBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        isLiked={isCurrentTrackLiked}
        onToggleLike={handleToggleLikeCurrentTrack}
      />

      {/* Modals */}
      <CreatePlaylistModal isOpen={showCreatePlaylist} onClose={() => setShowCreatePlaylist(false)} onCreate={handleCreatePlaylist} />
      <AddTrackModal isOpen={showAddTrack} onClose={() => setShowAddTrack(false)} onAdd={handleAddTrackToPlaylist} playlistName={selectedPlaylist?.name || ""} />
      <UploadMusicModal isOpen={showUploadMusic} onClose={() => setShowUploadMusic(false)} />
    </motion.div>
  );
};

export default Index;
