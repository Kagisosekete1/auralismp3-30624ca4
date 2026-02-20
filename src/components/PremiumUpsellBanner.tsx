import { motion } from "framer-motion";
import { Crown, Headphones, ArrowRight } from "lucide-react";

interface PremiumUpsellBannerProps {
  onUpgrade: () => void;
}

const PremiumUpsellBanner = ({ onUpgrade }: PremiumUpsellBannerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-4 md:mx-8 mb-6 rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10"
  >
    <div className="p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
        <Crown className="w-6 h-6 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground">Upgrade to Premium</h3>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Headphones className="w-3 h-3 inline" />
          Background playback, no ads & unlimited playlists
        </p>
      </div>
      <motion.button
        onClick={onUpgrade}
        className="flex items-center gap-1 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold flex-shrink-0"
        whileTap={{ scale: 0.95 }}
      >
        Go Pro <ArrowRight className="w-3 h-3" />
      </motion.button>
    </div>
  </motion.div>
);

export default PremiumUpsellBanner;
