import { Bell, Settings, User, ChevronLeft, ChevronRight, Search, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";
import AuralisLogo from "./AuralisLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TopBarProps {
  onSearch?: (query: string) => void;
  onSectionChange?: (section: string) => void;
  onUploadMusic?: () => void;
  tracks?: any[];
  onPlayTrack?: (track: any) => void;
  onSelectArtist?: (artistUserId: string) => void;
}

const TopBar = ({ onSearch, onSectionChange, onUploadMusic, tracks = [], onPlayTrack, onSelectArtist }: TopBarProps) => {

  const [showSearchModal, setShowSearchModal] = useState(false);
  const isMobile = useIsMobile();
  const { profile } = useDatabase();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to notification changes
    const channel = supabase
      .channel("notification-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      <header className="h-14 md:h-20 flex items-center justify-between px-3 md:px-8 sticky top-0 z-10 glass-strong border-b border-border/30">
        {/* Left - Logo (mobile) & Navigation & Search */}
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          {/* Mobile Logo */}
          {isMobile && (
            <motion.button 
              onClick={() => onSectionChange?.("home")}
              className="flex items-center gap-2 mr-1"
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <AuralisLogo size={32} />
            </motion.button>
          )}

          {/* Desktop Navigation */}
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

          {/* Search Button - Native mobile style */}
          <motion.button 
            onClick={() => setShowSearchModal(true)}
            className={`flex items-center gap-2 ${
              isMobile 
                ? "w-10 h-10 rounded-full bg-surface-elevated justify-center" 
                : "flex-1 max-w-md px-4 py-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 hover:border-primary/50"
            } text-muted-foreground transition-all text-sm`}
            whileHover={{ scale: isMobile ? 1.1 : 1.01 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-4 h-4" />
            {!isMobile && <span>Search tracks, artists, genres...</span>}
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
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
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden flex items-center justify-center ring-2 ring-primary/30 hover:ring-primary/60 transition-all" 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Avatar className="w-full h-full">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
              <AvatarFallback className="gradient-secondary text-secondary-foreground">
                <User className="w-4 h-4 md:w-5 md:h-5" />
              </AvatarFallback>
            </Avatar>
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
