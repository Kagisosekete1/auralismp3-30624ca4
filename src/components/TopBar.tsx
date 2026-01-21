import { Bell, Settings, User, ChevronLeft, ChevronRight, Search, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import SearchModal from "./SearchModal";

interface TopBarProps {
  onSearch?: (query: string) => void;
  onSectionChange?: (section: string) => void;
  onUploadMusic?: () => void;
  tracks?: any[];
  onPlayTrack?: (track: any) => void;
}

const TopBar = ({ onSearch, onSectionChange, onUploadMusic, tracks = [], onPlayTrack }: TopBarProps) => {
  const [showSearchModal, setShowSearchModal] = useState(false);

  return (
    <>
      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 glass-strong border-b border-border/30">
        {/* Left - Navigation & Search */}
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <div className="hidden md:flex items-center gap-2">
            <motion.button 
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button 
              onClick={() => window.history.forward()}
              className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Search Bar - Opens Modal */}
          <motion.button 
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 flex-1 max-w-xs md:max-w-md px-4 py-2 md:py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 hover:border-primary/50 text-muted-foreground transition-all text-sm"
            whileHover={{ scale: 1.01 }}
          >
            <Search className="w-4 h-4" />
            <span>Search tracks, artists, genres...</span>
          </motion.button>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <motion.button 
            onClick={onUploadMusic} 
            className="hidden sm:flex px-3 md:px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-xs md:text-sm items-center gap-2" 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Upload</span>
          </motion.button>

          <motion.button 
            onClick={() => onSectionChange?.("upgrade")} 
            className="hidden sm:flex px-3 md:px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs md:text-sm hover:opacity-90 transition-opacity glow-primary" 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <span className="hidden md:inline">Upgrade Pro</span>
            <span className="md:hidden">Pro</span>
          </motion.button>

          <motion.button 
            onClick={() => onSectionChange?.("notifications")} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 rounded-full bg-accent" />
          </motion.button>

          <motion.button 
            onClick={() => onSectionChange?.("settings")} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>

          <motion.button 
            onClick={() => onSectionChange?.("profile")} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        </div>
      </header>

      <SearchModal 
        isOpen={showSearchModal} 
        onClose={() => setShowSearchModal(false)} 
        tracks={tracks}
        onPlayTrack={(track) => {
          onPlayTrack?.(track);
          setShowSearchModal(false);
        }}
      />
    </>
  );
};

export default TopBar;
