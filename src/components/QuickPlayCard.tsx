import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface QuickPlayCardProps {
  title: string;
  imageUrl: string;
  onClick?: () => void;
}

const QuickPlayCard = ({ title, imageUrl, onClick }: QuickPlayCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    onClick?.();
  };

  return (
    <motion.button
      onClick={onClick}
      className="group flex items-center glass rounded-xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-16 h-16 flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <motion.div 
          className="absolute inset-0 bg-background/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
      </div>
      
      <span className="flex-1 px-4 font-semibold text-sm text-foreground truncate text-left">
        {title}
      </span>
      
      <motion.div 
        className="pr-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.15 }}
      >
        <motion.button
          onClick={handlePlayClick}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center glow-primary"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
          ) : (
            <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
          )}
        </motion.button>
      </motion.div>
    </motion.button>
  );
};

export default QuickPlayCard;
