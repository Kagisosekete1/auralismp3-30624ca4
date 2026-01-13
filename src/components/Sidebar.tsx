import { Home, Search, Library, Plus, Heart } from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const playlists = [
    "Liked Songs",
    "Chill Vibes",
    "Workout Mix",
    "Road Trip",
    "Late Night Jazz",
    "Focus Mode",
  ];

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full p-2 gap-2">
      {/* Main Navigation */}
      <nav className="bg-card rounded-lg p-4">
        <ul className="space-y-4">
          <li>
            <button
              onClick={() => onSectionChange("home")}
              className={`flex items-center gap-4 font-semibold transition-colors w-full text-left ${
                activeSection === "home"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="w-6 h-6" />
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => onSectionChange("search")}
              className={`flex items-center gap-4 font-semibold transition-colors w-full text-left ${
                activeSection === "search"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="w-6 h-6" />
              Search
            </button>
          </li>
        </ul>
      </nav>

      {/* Library Section */}
      <div className="bg-card rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-semibold">
            <Library className="w-6 h-6" />
            Your Library
          </button>
          <button className="text-muted-foreground hover:text-foreground hover:bg-surface-elevated rounded-full p-1 transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Playlists */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="space-y-1">
            {/* Liked Songs Card */}
            <button
              onClick={() => onSectionChange("liked")}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                activeSection === "liked"
                  ? "bg-surface-elevated"
                  : "hover:bg-surface-elevated"
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-300 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-foreground fill-foreground" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Liked Songs
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Playlist • 234 songs
                </p>
              </div>
            </button>

            {/* Other Playlists */}
            {playlists.slice(1).map((playlist, index) => (
              <button
                key={index}
                onClick={() => onSectionChange(playlist.toLowerCase().replace(" ", "-"))}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <div className="w-12 h-12 rounded-md bg-surface-highlight flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {playlist}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Playlist
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
