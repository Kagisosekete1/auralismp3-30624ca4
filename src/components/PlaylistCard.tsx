import { Play, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface PlaylistCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
}

const PlaylistCard = ({ title, description, imageUrl, onClick }: PlaylistCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      className="group glass rounded-2xl p-4 text-left w-full border border-border/30 hover:border-primary/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative mb-4 overflow-hidden rounded-xl">
        <motion.img
          src={imageUrl}
          alt={title}
          className="w-full aspect-square object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Actions */}
        <motion.div 
          className="absolute bottom-3 right-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:scale-110 transition-transform"
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-accent text-accent" : ""}`} />
          </motion.button>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-primary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </motion.button>
        </motion.div>
      </div>

      <h3 className="font-display font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </motion.button>
  );
};

export default PlaylistCard;
