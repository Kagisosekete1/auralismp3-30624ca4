import { Home, Search, Library, Plus, Heart, Music2, Radio, Mic2, Disc3 } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Disc3, label: "Explore" },
    { id: "radio", icon: Radio, label: "Radio" },
    { id: "artists", icon: Mic2, label: "Artists" },
  ];

  const playlists = [
    { id: "liked", name: "Liked Songs", count: 234, gradient: "from-primary to-accent" },
    { id: "chill", name: "Chill Vibes", count: 48, gradient: "from-secondary to-primary" },
    { id: "workout", name: "Workout Mix", count: 62, gradient: "from-accent to-secondary" },
    { id: "focus", name: "Focus Mode", count: 35, gradient: "from-primary to-secondary" },
    { id: "night", name: "Night Drive", count: 41, gradient: "from-secondary to-accent" },
  ];

  return (
    <aside className="w-72 glass-strong flex flex-col h-full border-r border-border/50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-gradient">Auralis</h1>
        </motion.div>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 mb-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <motion.button
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all ${
                  activeSection === item.id
                    ? "glass border-glow text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? "text-primary" : ""}`} />
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Library Section */}
      <div className="flex-1 flex flex-col overflow-hidden px-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Library className="w-5 h-5" />
            <span className="font-semibold">Your Library</span>
          </div>
          <motion.button 
            className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search in Library */}
        <motion.button
          onClick={() => onSectionChange("search")}
          className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-xl bg-surface-elevated/30 hover:bg-surface-elevated/50 text-muted-foreground transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search library...</span>
        </motion.button>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {playlists.map((playlist, index) => (
            <motion.button
              key={playlist.id}
              onClick={() => onSectionChange(playlist.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeSection === playlist.id
                  ? "glass border-glow"
                  : "hover:bg-surface-elevated/50"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${playlist.gradient} flex items-center justify-center flex-shrink-0`}>
                {playlist.id === "liked" ? (
                  <Heart className="w-5 h-5 text-primary-foreground fill-current" />
                ) : (
                  <Music2 className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {playlist.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {playlist.count} songs
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
