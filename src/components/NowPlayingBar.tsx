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
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NowPlayingBarProps {
  currentTrack: {
    title: string;
    artist: string;
    albumArt: string;
  };
}

const NowPlayingBar = ({ currentTrack }: NowPlayingBarProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [isLiked, setIsLiked] = useState(false);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 glass-strong border-t border-border/30 px-6 flex items-center justify-between z-50">
      {/* Left - Current Track */}
      <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
        <motion.div
          className="relative"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
        >
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            className="w-16 h-16 rounded-xl object-cover shadow-lg"
          />
          <motion.div 
            className="absolute inset-0 rounded-xl border-2 border-primary/50"
            animate={{ opacity: isPlaying ? [0.5, 1, 0.5] : 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <div className="min-w-0">
          <motion.p 
            className="font-semibold text-foreground truncate hover:text-primary cursor-pointer transition-colors"
            whileHover={{ x: 2 }}
          >
            {currentTrack.title}
          </motion.p>
          <motion.p 
            className="text-sm text-muted-foreground truncate hover:text-foreground cursor-pointer transition-colors"
            whileHover={{ x: 2 }}
          >
            {currentTrack.artist}
          </motion.p>
        </div>
        
        <motion.button
          onClick={() => setIsLiked(!isLiked)}
          className="flex-shrink-0"
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </motion.button>
      </div>

      {/* Center - Player Controls */}
      <div className="flex flex-col items-center max-w-[40%] w-full">
        <div className="flex items-center gap-5 mb-3">
          <motion.button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition-colors ${isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
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
            <SkipBack className="w-5 h-5 fill-current" />
          </motion.button>
          
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-primary"
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
                  <Pause className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                >
                  <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          
          <motion.button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </motion.button>
          
          <motion.button
            onClick={() => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off")}
            className={`relative transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
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
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs text-muted-foreground w-10 text-right font-medium">1:24</span>
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
              onChange={(e) => setProgress(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 font-medium">4:02</span>
        </div>
      </div>

      {/* Right - Volume & Other Controls */}
      <div className="flex items-center justify-end gap-4 w-[30%] min-w-[200px]">
        <motion.button 
          className="text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Mic2 className="w-4 h-4" />
        </motion.button>
        
        <motion.button 
          className="text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ListMusic className="w-4 h-4" />
        </motion.button>

        <div className="flex items-center gap-2 group">
          <motion.button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </motion.button>
          <div className="w-24 relative h-6 flex items-center">
            <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground group-hover:gradient-primary rounded-full"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setIsMuted(false);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        <motion.button 
          className="text-muted-foreground hover:text-foreground transition-colors"
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
