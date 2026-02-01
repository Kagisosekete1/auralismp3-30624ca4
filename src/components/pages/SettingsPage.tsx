import { motion } from "framer-motion";
import { Settings, User, Bell, Lock, Palette, Volume2, Globe, CreditCard, LogOut, ChevronRight, Moon, Sun, Crown, Shield, FileText, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SettingsPageProps {
  onSectionChange?: (section: string) => void;
}

const SettingsPage = ({ onSectionChange }: SettingsPageProps) => {
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.");
    if (!confirmed) return;

    try {
      await signOut();
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
    toast.success(`Switched to ${!darkMode ? "dark" : "light"} mode`);
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Manage your profile information", action: () => onSectionChange?.("profile") },
        { icon: Shield, label: "Privacy & Security", description: "Password and security settings", action: () => setShowPrivacy(true) },
        { icon: CreditCard, label: "Subscription", description: "Manage your plan", action: () => onSectionChange?.("upgrade") },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Palette, label: "Appearance", description: darkMode ? "Dark Mode" : "Light Mode", action: toggleTheme, toggle: true },
        { icon: Globe, label: "Language", description: "English (US)", action: () => toast.info("Language settings coming soon") },
        { icon: Volume2, label: "Audio Quality", description: highQuality ? "High (Premium)" : "Normal", action: () => {
          if (!highQuality) toast.info("Upgrade to Premium for high quality audio");
        }, premium: true },
      ]
    },
    {
      title: "Legal",
      items: [
        { icon: FileText, label: "Terms of Use", description: "Read our terms", action: () => setShowTerms(true) },
        { icon: Lock, label: "Privacy Policy", description: "How we protect your data", action: () => setShowPrivacy(true) },
      ]
    },
  ];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

  // Privacy Policy Modal
  const PrivacyModal = () => (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setShowPrivacy(false)}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto glass rounded-2xl border border-border/50 p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">Privacy Policy</h2>
        <div className="prose prose-sm prose-invert max-w-none text-muted-foreground space-y-4">
          <p><strong>1. Information We Collect:</strong> Account details (name, email), Uploaded content & metadata, Usage analytics, Payment data (via secure third parties)</p>
          <p><strong>2. How We Use Your Data:</strong> To operate and improve the Platform, To process uploads and distributions, To communicate important updates, To comply with legal obligations</p>
          <p><strong>3. Data Sharing:</strong> We do NOT sell your data. We only share data with: Payment processors, Distribution partners (if enabled), Legal authorities if required by law</p>
          <p><strong>4. Data Security:</strong> We use industry-standard security measures. However, no system is 100% secure.</p>
          <p><strong>5. Your Rights:</strong> You may request access, correction, or deletion of your personal data by contacting support@auralis.app</p>
          <p><strong>6. Cookies:</strong> We use cookies for functionality and analytics. You can manage cookies via your browser settings.</p>
          <p><strong>Quick Summary:</strong> We only collect what we need to run the app. We never sell your data. Your music and personal info stay yours. You can request deletion of your account and data.</p>
        </div>
        <button onClick={() => setShowPrivacy(false)} className="mt-6 px-6 py-2 rounded-xl gradient-primary text-primary-foreground font-medium">Close</button>
      </motion.div>
    </motion.div>
  );

  // Terms Modal
  const TermsModal = () => (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setShowTerms(false)}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto glass rounded-2xl border border-border/50 p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">Terms of Use</h2>
        <div className="prose prose-sm prose-invert max-w-none text-muted-foreground space-y-4">
          <p><strong>1. Acceptance of Terms:</strong> By accessing or using the Auralis platform, you agree to be bound by these Terms of Use.</p>
          <p><strong>2. Eligibility:</strong> You must be at least 18 years old or have legal guardian consent to upload content.</p>
          <p><strong>3. Ownership & Rights:</strong> You retain 100% ownership of your music, artwork, and metadata. By uploading content, you grant Auralis a non-exclusive, royalty-free, worldwide license to host, stream, display, distribute, and promote your content solely for platform operation and marketing purposes.</p>
          <p><strong>4. Content Warranty:</strong> You confirm that you own or control all rights to the submitted content, your content does not infringe any third-party rights, and your content is not illegal, offensive, or misleading.</p>
          <p><strong>5. Monetization:</strong> Free uploads do not guarantee monetization or distribution to third-party platforms. Premium features may enable additional monetization tools.</p>
          <p><strong>6. Termination:</strong> You may remove your content at any time. Auralis may suspend accounts for violations, fraud, or abuse.</p>
          <p><strong>7. Limitation of Liability:</strong> Auralis is provided "as is." We are not liable for loss of revenue, data, or opportunities arising from platform use.</p>
          <p><strong>Quick Summary:</strong> Auralis is free to use for listening and uploading music. You keep full ownership of your music at all times. We do not pay royalties and we do not charge fees. You can remove your music anytime.</p>
        </div>
        <button onClick={() => setShowTerms(false)} className="mt-6 px-6 py-2 rounded-xl gradient-primary text-primary-foreground font-medium">Close</button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {showPrivacy && <PrivacyModal />}
      {showTerms && <TermsModal />}

      {/* Header */}
      <div className="gradient-hero pt-6 md:pt-8 pb-8 md:pb-12 px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-base md:text-lg">Manage your account and preferences</p>
          </div>
        </motion.div>
      </div>

      {/* Settings Sections */}
      <div className="px-4 md:px-8 py-6 space-y-8">
        {settingsSections.map((section, sectionIndex) => (
          <motion.section key={sectionIndex} variants={containerVariants} initial="hidden" animate="visible">
            <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">{section.title}</h2>
            <div className="glass rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
              {section.items.map((item, itemIndex) => (
                <motion.button
                  key={itemIndex}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-surface-elevated/30 transition-colors text-left"
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm md:text-base">{item.label}</h3>
                      {item.premium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{item.description}</p>
                  </div>
                  {item.toggle ? (
                    darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>
        ))}

        {/* Toggle Settings */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">Playback</h2>
          <div className="glass rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/30">
            {[
              { icon: Bell, label: "Push Notifications", desc: "Get notified about new releases", value: notifications, set: setNotifications },
              { icon: Volume2, label: "Autoplay", desc: "Play similar songs when queue ends", value: autoplay, set: setAutoplay },
              { icon: Palette, label: "High Quality Audio", desc: "Stream at maximum quality (Premium)", value: highQuality, set: setHighQuality, premium: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 md:p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm md:text-base">{item.label}</h3>
                      {item.premium && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => item.premium ? toast.info("Upgrade to Premium") : item.set(!item.value)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${item.value ? 'bg-primary' : 'bg-surface-elevated'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div className="w-5 h-5 rounded-full bg-white shadow-lg" animate={{ x: item.value ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          className="w-full glass rounded-2xl p-4 md:p-5 border border-border/30 hover:border-primary/30 transition-colors flex items-center gap-4 text-foreground"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-elevated/50 flex items-center justify-center">
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="font-medium text-sm md:text-base">Log Out</span>
        </motion.button>

        {/* Danger Zone */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible">
          <h2 className="text-lg md:text-xl font-display font-bold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          <div className="glass rounded-2xl border border-destructive/30 overflow-hidden">
            <motion.button
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-destructive/10 transition-colors text-left text-destructive"
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base">Delete Account</h3>
                <p className="text-xs md:text-sm text-destructive/70">Permanently delete your account and all data</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SettingsPage;
