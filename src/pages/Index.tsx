import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import NowPlayingBar from "@/components/NowPlayingBar";
import TopBar from "@/components/TopBar";

import album1 from "@/assets/album-1.jpg";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");

  const currentTrack = {
    title: "Midnight City",
    artist: "M83",
    albumArt: album1,
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
          onSectionChange={setActiveSection}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <MainContent />
        </div>
      </div>

      {/* Now Playing Bar */}
      <NowPlayingBar currentTrack={currentTrack} />
    </motion.div>
  );
};

export default Index;
