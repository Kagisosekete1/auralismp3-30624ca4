import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Play, Pause, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX,
  Heart, ListMusic, ChevronDown, Music2, Crown
} from "lucide-react";
import { useState, useRef } from "react";
import VideoReelPlayer from "./VideoReelPlayer";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    artistUserId?: string;
    coverUrl?: string;
    videoReelUrl?: string;
    duration?: number;
  } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  progress: number;
  duration: number;
  onSeek: (percent: number) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  formatTime: (s: number) => string;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  onShowQueue: () => void;
  isPremium: boolean;
  onArtistClick?: (artistUserId?: string) => void;
}

const FullScreenPlayer = ({
  isOpen, onClose, currentTrack, isPlaying, onTogglePlay,
  isLiked, onToggleLike, progress, duration, onSeek,
  volume, onVolumeChange, isMuted, onToggleMute, formatTime,
  onNext, onPrevious, onShuffle, onRepeat, isShuffled,
  repeatMode, onShowQueue, isPremium, onArtistClick,
}: FullScreenPlayerProps) => {
  const [localVolume, setLocalVolume] = useState(volume);

  // Swipe gesture state
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 200], [1, 0]);
  const scale = useTransform(dragY, [0, 200], [1, 0.92]);

  const currentTime = duration ? (progress / 100) * duration : 0;

  const handleVolumeChange = (val: number) => {
    setLocalVolume(val);
    onVolumeChange(val);
  };

  const handleDragEnd = (_: any, info: { offset: { y: number; x: number }; velocity: { y: number; x: number } }) => {
    const { y, x } = info.offset;
    const { y: vy, x: vx } = info.velocity;

    // Swipe down to close
    if (y > 100 || vy > 500) {
      onClose();
      return;
    }

    // Swipe left = next track
    if (x < -80 || vx < -400) {
      onNext();
      return;
    }

    // Swipe right = previous track
    if (x > 80 || vx > 400) {
      onPrevious();
      return;
    }

    dragY.set(0);
    dragX.set(0);
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col touch-none"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{ opacity }}
        >
          {/* Dynamic background from cover art */}
          <div className="absolute inset-0 bg-background">
            {currentTrack.coverUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-30"
                  style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
                />
                <div className="absolute inset-0 bg-background/70" />
              </>
            )}
          </div>

          {/* Drag layer over album art area */}
          <motion.div
            className="absolute inset-0 z-10"
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.3}
            style={{ y: dragY, x: dragX }}
            onDragEnd={handleDragEnd}
          />

          {/* Content */}
          <div className="relative z-20 flex flex-col h-full px-6 pt-safe pb-safe pointer-events-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between pt-12 pb-6 pointer-events-auto">
              <motion.button
                onClick={onClose}
                className="w-10 h-10 rounded-full glass flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronDown className="w-5 h-5 text-foreground" />
              </motion.button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Now Playing</p>
              </div>
              {isPremium ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  <span>Pro</span>
                </div>
              ) : (
                <div className="w-10" />
              )}
            </div>

            {/* Album Art */}
            <motion.div
              className="flex-1 flex items-center justify-center py-4"
              animate={{ scale: isPlaying ? 1 : 0.92 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ scale }}
            >
              <div className="w-full max-w-[280px] md:max-w-[360px] lg:max-w-[400px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                {currentTrack.videoReelUrl ? (
                  <VideoReelPlayer
                    videoUrl={currentTrack.videoReelUrl}
                    isPlaying={isPlaying}
                    coverUrl={currentTrack.coverUrl}
                    className="w-full h-full"
                  />
                ) : currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
                    <Music2 className="w-20 h-20 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Track Info + Like */}
            <div className="flex items-center justify-between py-4 pointer-events-auto overflow-hidden">
              <div className="flex-1 min-w-0 mr-4 overflow-hidden">
                {/* Marquee title */}
                <div className="overflow-hidden relative">
                  <motion.h2
                    className="text-2xl font-display font-bold text-foreground whitespace-nowrap"
                    animate={currentTrack.title.length > 20 ? {
                      x: ["0%", "-50%"],
                    } : { x: 0 }}
                    transition={currentTrack.title.length > 20 ? {
                      x: { repeat: Infinity, repeatType: "loop", duration: 8, ease: "linear", repeatDelay: 2 },
                    } : {}}
                  >
                    {currentTrack.title.length > 20 ? `${currentTrack.title}   •   ${currentTrack.title}` : currentTrack.title}
                  </motion.h2>
                </div>
                {/* Marquee artist */}
                <button type="button" onClick={() => onArtistClick?.(currentTrack.artistUserId)} className="block max-w-full overflow-hidden text-left relative mt-0.5 pointer-events-auto" aria-label={`View ${currentTrack.artist}'s artist profile`}>
                  <motion.p
                    className="text-base text-muted-foreground whitespace-nowrap hover:text-primary"
                    animate={currentTrack.artist.length > 24 ? {
                      x: ["0%", "-50%"],
                    } : { x: 0 }}
                    transition={currentTrack.artist.length > 24 ? {
                      x: { repeat: Infinity, repeatType: "loop", duration: 10, ease: "linear", repeatDelay: 2 },
                    } : {}}
                  >
                    {currentTrack.artist.length > 24 ? `${currentTrack.artist}   •   ${currentTrack.artist}` : currentTrack.artist}
                  </motion.p>
                </button>
              </div>
              <motion.button
                onClick={onToggleLike}
                whileTap={{ scale: 0.85 }}
                className="flex-shrink-0 pointer-events-auto"
              >
                <Heart
                  className={`w-7 h-7 transition-all duration-200 ${
                    isLiked
                      ? "fill-primary text-primary scale-110"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                />
              </motion.button>
            </div>

            {/* Progress Bar */}
            <div className="py-2 pointer-events-auto">
              <div className="relative group h-10 flex items-center">
                <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground shadow-lg pointer-events-none"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground font-medium">{formatTime(currentTime)}</span>
                <span className="text-xs text-muted-foreground font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls — only shuffle, play, next, repeat (no prev/back per request) */}
            <div className="flex items-center justify-between py-4 pointer-events-auto">
              <motion.button
                onClick={onShuffle}
                className={`transition-colors ${isShuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                whileTap={{ scale: 0.9 }}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Pause className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                onClick={onNext}
                className="text-foreground hover:text-primary transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </motion.button>

              <motion.button
                onClick={onRepeat}
                className={`relative transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                whileTap={{ scale: 0.9 }}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === "one" && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-bold text-primary">1</span>
                )}
              </motion.button>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pb-8 pt-2 pointer-events-auto">
              <motion.button
                onClick={onToggleMute}
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {isMuted || localVolume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </motion.button>

              {/* Volume Slider */}
              <div className="flex-1 mx-3 relative h-8 flex items-center">
                <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground rounded-full"
                    style={{ width: `${isMuted ? 0 : localVolume}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : localVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              <motion.button
                onClick={onShowQueue}
                className="text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <ListMusic className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Swipe hint */}
            <div className="flex justify-center pb-6 pointer-events-none">
              <p className="text-xs text-muted-foreground/50">Swipe down to close · Swipe left/right to skip</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenPlayer;
