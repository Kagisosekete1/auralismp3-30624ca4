import { Home, Search, Library, User, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onUploadMusic: () => void;
}

const MobileNav = ({ activeSection, onSectionChange, onUploadMusic }: MobileNavProps) => {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Search, label: "Explore" },
    { id: "upload", icon: Upload, label: "Upload", isUpload: true },
    { id: "library", icon: Library, label: "Library" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 glass-strong border-t border-border/30 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const isUploadBtn = item.isUpload;

          if (isUploadBtn) {
            return (
              <motion.button
                key={item.id}
                onClick={onUploadMusic}
                className="flex flex-col items-center justify-center -mt-6"
                whileTap={{ scale: 0.9 }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center glow-primary shadow-lg">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
              whileTap={{ scale: 0.9 }}
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  layoutId="mobileActiveIndicator"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
