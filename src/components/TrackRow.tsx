import { Play, Pause, Heart, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface TrackRowProps {
  index: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl: string;
  isCurrentlyPlaying?: boolean;
  onPlay?: () => void;
}

const TrackRow = ({
  index,
  title,
  artist,
  album,
  duration,
  imageUrl,
  isCurrentlyPlaying = false,
  onPlay,
}: TrackRowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(isCurrentlyPlaying);

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlay?.();
  };

  return (
    <motion.div
      className={`group grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2 rounded-xl transition-colors ${
        isCurrentlyPlaying ? "glass border-glow" : "hover:bg-surface-elevated/30"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ x: 4 }}
    >
      {/* Index / Play Button */}
      <div className="w-10 flex justify-center">
        {isHovered || isPlaying ? (
          <motion.button
            onClick={handlePlayClick}
            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
            ) : (
              <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
            )}
          </motion.button>
        ) : (
          <span className={`text-sm font-medium ${isCurrentlyPlaying ? "text-primary" : "text-muted-foreground"}`}>
            {index}
          </span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p className={`font-medium truncate ${isCurrentlyPlaying ? "text-primary" : "text-foreground"}`}>
            {title}
          </p>
          <p className="text-sm text-muted-foreground truncate hover:text-foreground hover:underline cursor-pointer transition-colors">
            {artist}
          </p>
        </div>
      </div>

      {/* Album */}
      <p className="text-sm text-muted-foreground truncate hover:text-foreground hover:underline cursor-pointer transition-colors">
        {album}
      </p>

      {/* Actions & Duration */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setIsLiked(!isLiked)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${isLiked ? "opacity-100" : ""}`}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </motion.button>
        
        <span className="text-sm text-muted-foreground w-12 text-right">{duration}</span>
        
        <motion.button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          whileTap={{ scale: 0.9 }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TrackRow;
