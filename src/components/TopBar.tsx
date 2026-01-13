import { Bell, Settings, User, ChevronLeft, ChevronRight, Search, Upload, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopBarProps {
  onSearch?: (query: string) => void;
  onSectionChange?: (section: string) => void;
  onUploadMusic?: () => void;
}

const TopBar = ({ onSearch, onSectionChange, onUploadMusic }: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 glass-strong border-b border-border/30">
      {/* Left - Navigation & Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2">
          <motion.button className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div className={`relative flex items-center transition-all duration-300 flex-1 max-w-xs md:max-w-md ${showSearch ? "w-full" : ""}`} onFocus={() => setShowSearch(true)} onBlur={() => setShowSearch(false)}>
          <Search className="absolute left-3 md:left-4 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 focus:bg-surface-elevated text-foreground placeholder:text-muted-foreground outline-none transition-all text-sm"
          />
        </motion.div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <motion.button onClick={onUploadMusic} className="hidden sm:flex px-3 md:px-4 py-2 rounded-xl glass border-glow text-foreground font-medium text-xs md:text-sm items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Upload className="w-4 h-4" />
          <span className="hidden md:inline">Upload</span>
        </motion.button>

        <motion.button onClick={() => onSectionChange?.("upgrade")} className="hidden sm:flex px-3 md:px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-xs md:text-sm hover:opacity-90 transition-opacity glow-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <span className="hidden md:inline">Upgrade Pro</span>
          <span className="md:hidden">Pro</span>
        </motion.button>

        <motion.button onClick={() => onSectionChange?.("notifications")} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 rounded-full bg-accent" />
        </motion.button>

        <motion.button onClick={() => onSectionChange?.("settings")} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </motion.button>

        <motion.button onClick={() => onSectionChange?.("profile")} className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <User className="w-4 h-4 md:w-5 md:h-5" />
        </motion.button>
      </div>
    </header>
  );
};

export default TopBar;
