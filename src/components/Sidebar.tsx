import { Home, Search, Library, Plus, Heart, Music2, Radio, Mic2, Disc3, Trash2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Playlist } from "@/hooks/useAppState";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  likedCount: number;
  onUploadMusic?: () => void;
}

const Sidebar = ({ activeSection, onSectionChange, playlists, onCreatePlaylist, onDeletePlaylist, likedCount, onUploadMusic }: SidebarProps) => {
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Disc3, label: "Explore" },
    { id: "genre", icon: Radio, label: "Genre" },
    { id: "artists", icon: Mic2, label: "Artists" },
    { id: "library", icon: Library, label: "Library" },
  ];

  return (
    <aside className="w-72 glass-strong flex flex-col h-full border-r border-border/50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <motion.button className="flex items-center gap-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onSectionChange("home")}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-gradient">Auralis</h1>
        </motion.button>
      </div>

      {/* Main Navigation */}
      <nav className="px-4 mb-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <motion.button
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all ${activeSection === item.id ? "glass border-glow text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"}`}
                whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? "text-primary" : ""}`} />
                {item.label}
                {activeSection === item.id && <motion.div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" layoutId="activeIndicator" />}
              </motion.button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Upload Button */}
      <div className="px-4 mb-4">
        <motion.button
          onClick={onUploadMusic}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl gradient-primary text-primary-foreground font-medium"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-5 h-5" />
          Upload Music
        </motion.button>
      </div>

      {/* Library Section */}
      <div className="flex-1 flex flex-col overflow-hidden px-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-semibold text-muted-foreground text-sm">Your Library</span>
          <motion.button onClick={onCreatePlaylist} className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-muted-foreground transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Liked Songs */}
        <motion.button
          onClick={() => onSectionChange("liked")}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-2 ${activeSection === "liked" ? "glass border-glow" : "hover:bg-surface-elevated/50"}`}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="font-medium text-foreground text-sm truncate">Liked Songs</p>
            <p className="text-xs text-muted-foreground">{likedCount} songs</p>
          </div>
        </motion.button>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          <AnimatePresence>
            {playlists.length === 0 ? (
              <motion.div className="text-center py-6 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-muted-foreground text-xs mb-2">No playlists yet</p>
                <motion.button onClick={onCreatePlaylist} className="text-primary text-xs font-medium hover:underline" whileHover={{ scale: 1.05 }}>
                  Create your first
                </motion.button>
              </motion.div>
            ) : (
              playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  className="relative"
                  onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <motion.button
                    onClick={() => onSectionChange(`playlist-${playlist.id}`)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${activeSection === `playlist-${playlist.id}` ? "glass border-glow" : "hover:bg-surface-elevated/50"}`}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${playlist.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Music2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm truncate">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">{playlist.tracks.length} songs</p>
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {hoveredPlaylist === playlist.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => { e.stopPropagation(); onDeletePlaylist(playlist.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-destructive/20 hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
