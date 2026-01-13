import { ChevronLeft, ChevronRight, Bell, User } from "lucide-react";

const TopBar = () => {
  return (
    <header className="h-16 bg-transparent flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 bg-sidebar/80 rounded-full flex items-center justify-center hover:bg-sidebar transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button className="w-8 h-8 bg-sidebar/80 rounded-full flex items-center justify-center hover:bg-sidebar transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-sm font-semibold text-foreground hover:scale-105 transition-transform">
          Explore Premium
        </button>
        <button className="px-4 py-1.5 bg-foreground text-background text-sm font-semibold rounded-full hover:scale-105 transition-transform">
          Upgrade
        </button>
        <button className="w-8 h-8 bg-sidebar/80 rounded-full flex items-center justify-center hover:bg-sidebar transition-colors ml-2">
          <Bell className="w-4 h-4 text-foreground" />
        </button>
        <button className="w-8 h-8 bg-surface-elevated rounded-full flex items-center justify-center hover:bg-surface-highlight transition-colors">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
