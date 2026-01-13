import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import NowPlayingBar from "@/components/NowPlayingBar";
import TopBar from "@/components/TopBar";

import album1 from "@/assets/album-1.jpg";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");

  const currentTrack = {
    title: "Blinding Lights",
    artist: "The Weeknd",
    albumArt: album1,
  };

  return (
    <div className="h-screen flex flex-col bg-sidebar overflow-hidden">
      {/* Main App */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-lg m-2 ml-0 bg-background">
          <TopBar />
          <MainContent />
        </div>
      </div>

      {/* Now Playing Bar */}
      <NowPlayingBar currentTrack={currentTrack} />
    </div>
  );
};

export default Index;
