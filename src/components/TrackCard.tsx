import { motion } from "framer-motion";
import { Play, Music2, ListPlus, Headphones } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
  play_count?: number;
  like_count?: number;
  genre?: string;
}

interface TrackCardProps {
  track: Track;
  onPlay?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  variant?: "default" | "compact";
}

const formatPlayCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
};

const TrackCard = ({ track, onPlay, onAddToPlaylist, variant = "default" }: TrackCardProps) => {
  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden bg-card hover:bg-card-hover border border-border/20 hover:border-primary/30 transition-all duration-300"
      whileHover={{ y: -4 }}
      layout
    >
      {/* Cover Art */}
      <div
        className="relative w-full aspect-square cursor-pointer overflow-hidden"
        onClick={() => onPlay?.(track)}
      >
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <Music2 className="w-10 h-10 text-primary-foreground/60" />
          </div>
        )}

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg glow-primary"
            initial={false}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </motion.div>
        </div>

        {/* Play count badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <Headphones className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-medium text-white/90">
            {formatPlayCount(track.play_count || 0)}
          </span>
        </div>

        {/* Genre tag */}
        {track.genre && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] font-medium text-white/80">{track.genre}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-semibold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors"
          onClick={() => onPlay?.(track)}
        >
          {track.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist_name}</p>

        {/* Add to Playlist - only action available */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist?.(track);
          }}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-elevated/60 hover:bg-primary/20 text-xs font-medium text-muted-foreground hover:text-primary transition-all duration-200"
          whileTap={{ scale: 0.97 }}
        >
          <ListPlus className="w-3.5 h-3.5" />
          Save to Playlist
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TrackCard;
