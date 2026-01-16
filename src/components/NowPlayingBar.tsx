import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
  ListMusic,
  Mic2,
  Music2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NowPlayingTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: number;
}

interface NowPlayingBarProps {
  currentTrack: NowPlayingTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  progress?: number;
  duration?: number;
  onSeek?: (percent: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  formatTime?: (seconds: number) => string;
}

const NowPlayingBar = ({ 
  currentTrack, 
  isPlaying, 
  onTogglePlay,
  isLiked,
  onToggleLike,
  progress = 0,
  duration = 0,
  onSeek,
  volume = 70,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
  formatTime,
}: NowPlayingBarProps) => {
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [localVolume, setLocalVolume] = useState(volume);
  const [localMuted, setLocalMuted] = useState(isMuted);

  const handleVolumeChange = (val: number) => {
    setLocalVolume(val);
    setLocalMuted(false);
    onVolumeChange?.(val);
  };

  const handleMuteToggle = () => {
    setLocalMuted(!localMuted);
    onToggleMute?.();
  };

  const currentTime = duration ? (progress / 100) * duration : 0;

  const defaultFormatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const timeFormatter = formatTime || defaultFormatTime;

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-16 md:bottom-0 left-0 right-0 h-20 md:h-24 glass-strong border-t border-border/30 px-4 md:px-6 flex items-center justify-center z-40">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Music2 className="w-5 h-5" />
          <span className="text-sm">Select a track to start playing</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="fixed bottom-16 md:bottom-0 left-0 right-0 h-20 md:h-24 glass-strong border-t border-border/30 px-4 md:px-6 flex items-center justify-between z-40">
      {/* Left - Current Track */}
      <div className="flex items-center gap-3 md:gap-4 w-[35%] md:w-[30%] min-w-0">
        <motion.div
          className="relative flex-shrink-0"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
        >
          {currentTrack.coverUrl ? (
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title}
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-surface-elevated flex items-center justify-center shadow-lg">
              <Music2 className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
            </div>
          )}
          <motion.div 
            className="absolute inset-0 rounded-xl border-2 border-primary/50"
            animate={{ opacity: isPlaying ? [0.5, 1, 0.5] : 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <div className="min-w-0 flex-1">
          <motion.p 
            className="font-semibold text-foreground truncate hover:text-primary cursor-pointer transition-colors text-sm md:text-base"
            whileHover={{ x: 2 }}
          >
            {currentTrack.title}
          </motion.p>
          <motion.p 
            className="text-xs md:text-sm text-muted-foreground truncate hover:text-foreground cursor-pointer transition-colors"
            whileHover={{ x: 2 }}
          >
            {currentTrack.artist}
          </motion.p>
        </div>
        
        <motion.button
          onClick={onToggleLike}
          className="flex-shrink-0 hidden sm:block"
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </motion.button>
      </div>

      {/* Center - Player Controls */}
      <div className="flex flex-col items-center max-w-[30%] md:max-w-[40%] w-full">
        <div className="flex items-center gap-3 md:gap-5 mb-2 md:mb-3">
          <motion.button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`hidden md:block transition-colors ${isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>
          
          <motion.button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </motion.button>
          
          <motion.button
            onClick={onTogglePlay}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full gradient-primary flex items-center justify-center glow-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                >
                  <Pause className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground fill-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </motion.button>
          
          <motion.button
            onClick={() => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
            className={`hidden md:block relative transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === "one" && (
              <span className="absolute -top-1 -right-1.5 text-[10px] font-bold text-primary">1</span>
            )}
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex items-center gap-3 w-full">
          <span className="text-xs text-muted-foreground w-10 text-right font-medium">
            {timeFormatter(currentTime)}
          </span>
          <div className="flex-1 group relative h-6 flex items-center">
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-primary rounded-full relative"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => onSeek?.(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 font-medium">
            {timeFormatter(duration)}
          </span>
        </div>
      </div>

      {/* Right - Volume & Other Controls */}
      <div className="flex items-center justify-end gap-2 md:gap-4 w-[35%] md:w-[30%]">
        <motion.button 
          onClick={onToggleLike}
          className="sm:hidden"
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </motion.button>

        <motion.button 
          className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Mic2 className="w-4 h-4" />
        </motion.button>
        
        <motion.button 
          className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ListMusic className="w-4 h-4" />
        </motion.button>

        <div className="hidden md:flex items-center gap-2 group">
          <motion.button 
            onClick={handleMuteToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {localMuted || localVolume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </motion.button>
          <div className="w-24 relative h-6 flex items-center">
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground group-hover:gradient-primary rounded-full"
                style={{ width: `${localMuted ? 0 : localVolume}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localMuted ? 0 : localVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        <motion.button 
          className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Maximize2 className="w-4 h-4" />
        </motion.button>
      </div>
    </footer>
  );
};

export default NowPlayingBar;
