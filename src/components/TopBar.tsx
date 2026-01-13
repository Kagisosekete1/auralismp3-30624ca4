import { Bell, Settings, User, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TopBarProps {
  onSearch?: (query: string) => void;
}

const TopBar = ({ onSearch }: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-10 glass-strong border-b border-border/30">
      {/* Left - Navigation & Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <motion.button 
            className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button 
            className="w-9 h-9 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div 
          className={`relative flex items-center transition-all duration-300 ${showSearch ? "w-80" : "w-64"}`}
          onFocus={() => setShowSearch(true)}
          onBlur={() => setShowSearch(false)}
        >
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 focus:bg-surface-elevated text-foreground placeholder:text-muted-foreground outline-none transition-all"
          />
        </motion.div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <motion.button 
          className="px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Upgrade Pro
        </motion.button>

        <motion.button 
          className="w-10 h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
        </motion.button>

        <motion.button 
          className="w-10 h-10 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        <motion.button 
          className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center text-secondary-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-5 h-5" />
        </motion.button>
      </div>
    </header>
  );
};

export default TopBar;
