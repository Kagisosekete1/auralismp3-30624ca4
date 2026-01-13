import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import NowPlayingBar from "@/components/NowPlayingBar";
import TopBar from "@/components/TopBar";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import AddTrackModal from "@/components/AddTrackModal";
import PlaylistView from "@/components/PlaylistView";
import { useAppState } from "@/hooks/useAppState";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const {
    playlists,
    currentTrack,
    isPlaying,
    likedSongs,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    toggleLike,
    playTrack,
    togglePlay,
  } = useAppState();

  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist = createPlaylist(name, description);
    toast.success(`Playlist "${name}" created!`);
    setActiveSection(`playlist-${newPlaylist.id}`);
  };

  const handleDeletePlaylist = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    deletePlaylist(id);
    toast.success(`Playlist "${playlist?.name}" deleted`);
    if (activeSection === `playlist-${id}`) {
      setActiveSection("home");
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

  const handleAddTrackToPlaylist = (track: Omit<typeof currentTrack, "id">) => {
    if (selectedPlaylistId && track) {
      addTrackToPlaylist(selectedPlaylistId, track as any);
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

  return (
    <motion.div 
      className="h-screen flex flex-col bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main App */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          playlists={playlists}
          onCreatePlaylist={() => setShowCreatePlaylist(true)}
          onDeletePlaylist={handleDeletePlaylist}
          likedCount={likedSongs.length}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          
          {selectedPlaylist ? (
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
          ) : (
            <MainContent 
              activeSection={activeSection}
              playlists={playlists}
              onCreatePlaylist={() => setShowCreatePlaylist(true)}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}
        </div>
      </div>

      {/* Now Playing Bar */}
      <NowPlayingBar 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        isLiked={isCurrentTrackLiked}
        onToggleLike={handleToggleLikeCurrentTrack}
      />

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreate={handleCreatePlaylist}
      />

      <AddTrackModal
        isOpen={showAddTrack}
        onClose={() => setShowAddTrack(false)}
        onAdd={handleAddTrackToPlaylist}
        playlistName={selectedPlaylist?.name || ""}
      />
    </motion.div>
  );
};

export default Index;
