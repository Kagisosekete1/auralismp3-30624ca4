import { motion } from "framer-motion";
import { Settings, User, Bell, Lock, Palette, Volume2, Globe, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Manage your profile information" },
        { icon: Lock, label: "Privacy & Security", description: "Password and security settings" },
        { icon: CreditCard, label: "Subscription", description: "Manage your plan" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Palette, label: "Appearance", description: "Theme and display settings" },
        { icon: Globe, label: "Language", description: "English (US)" },
        { icon: Volume2, label: "Audio Quality", description: "High quality streaming" },
      ]
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Manage your account and preferences
            </p>
          </div>
        </motion.div>
      </div>

      {/* Settings Sections */}
      <div className="px-4 md:px-8 py-6 space-y-8">
        {settingsSections.map((section, sectionIndex) => (
          <motion.section
            key={sectionIndex}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">
              {section.title}
            </h2>
            <div className="glass rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
              {section.items.map((item, itemIndex) => (
                <motion.button
                  key={itemIndex}
                  className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-surface-elevated/30 transition-colors text-left"
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm md:text-base">
                      {item.label}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Toggle Settings */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">
            Playback
          </h2>
          <div className="glass rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm md:text-base">Push Notifications</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Get notified about new releases</p>
                </div>
              </div>
              <motion.button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${notifications ? 'bg-primary' : 'bg-surface-elevated'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-lg"
                  animate={{ x: notifications ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Autoplay Toggle */}
            <div className="flex items-center justify-between p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm md:text-base">Autoplay</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Play similar songs when queue ends</p>
                </div>
              </div>
              <motion.button
                onClick={() => setAutoplay(!autoplay)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${autoplay ? 'bg-primary' : 'bg-surface-elevated'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-lg"
                  animate={{ x: autoplay ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* High Quality Toggle */}
            <div className="flex items-center justify-between p-4 md:p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center">
                  <Palette className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm md:text-base">High Quality Audio</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Stream at maximum quality (uses more data)</p>
                </div>
              </div>
              <motion.button
                onClick={() => setHighQuality(!highQuality)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${highQuality ? 'bg-primary' : 'bg-surface-elevated'}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-lg"
                  animate={{ x: highQuality ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Logout */}
        <motion.button
          className="w-full glass rounded-2xl p-4 md:p-5 border border-destructive/30 hover:border-destructive/50 transition-colors flex items-center gap-4 text-destructive"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="font-medium text-sm md:text-base">Log Out</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SettingsPage;
