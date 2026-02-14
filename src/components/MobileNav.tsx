import { Home, Search, Library, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDatabase } from "@/hooks/useDatabase";
import { User } from "lucide-react";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onUploadMusic: () => void;
}

const MobileNav = ({ activeSection, onSectionChange, onUploadMusic }: MobileNavProps) => {
  const { profile } = useDatabase();

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Search, label: "Explore" },
    { id: "upload", icon: Upload, label: "Upload", isUpload: true },
    { id: "library", icon: Library, label: "Library" },
    { id: "profile", label: "Profile", isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 glass-strong border-t border-border/30">
      <div className="flex items-center justify-around h-[64px] px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;

          if (item.isUpload) {
            return (
              <motion.button
                key={item.id}
                onClick={onUploadMusic}
                className="flex flex-col items-center justify-center -mt-5"
                whileTap={{ scale: 0.9 }}
              >
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary shadow-lg">
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </div>
              </motion.button>
            );
          }

          if (item.isProfile) {
            return (
              <motion.button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative"
                whileTap={{ scale: 0.9 }}
              >
                <Avatar className={`w-6 h-6 ring-1.5 ${isActive ? 'ring-primary' : 'ring-transparent'} transition-all`}>
                  <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                  <AvatarFallback className="gradient-secondary text-secondary-foreground text-[10px]">
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" layoutId="mobileActiveIndicator" />
                )}
              </motion.button>
            );
          }

          const Icon = item.icon!;
          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative"
              whileTap={{ scale: 0.9 }}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" layoutId="mobileActiveIndicator" />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
