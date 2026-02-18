import { Play, Pause, SkipForward, Heart, Music2 } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import VideoReelPlayer from "./VideoReelPlayer";

interface NowPlayingTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  videoReelUrl?: string;
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
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  isShuffled?: boolean;
  repeatMode?: "off" | "all" | "one";
  onShowQueue?: () => void;
  onTrackClick?: () => void;
  isPremium?: boolean;
}

const MarqueeText = ({ text, className }: { text: string; className?: string }) => {
  const shouldScroll = text.length > 22;
  return (
    <div className="overflow-hidden relative max-w-full">
      <motion.p
        className={`whitespace-nowrap ${className}`}
        animate={shouldScroll ? { x: ["0%", "-50%"] } : { x: 0 }}
        transition={shouldScroll ? {
          x: { repeat: Infinity, repeatType: "loop", duration: 7, ease: "linear", repeatDelay: 1.5 },
        } : {}}
      >
        {shouldScroll ? `${text}   •   ${text}` : text}
      </motion.p>
    </div>
  );
};

const NowPlayingBar = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  isLiked,
  onToggleLike,
  progress = 0,
  duration = 0,
  onSeek,
  onNext,
  onPrevious,
  onTrackClick,
  isPremium = false,
}: NowPlayingBarProps) => {
  const dragX = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const { x } = info.offset;
    const { x: vx } = info.velocity;

    if (x < -60 || vx < -300) {
      onNext?.();
    } else if (x > 60 || vx > 300) {
      onPrevious?.();
    }
    dragX.set(0);
  };

  // Always show player
  return (
    <footer className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-40">
      {/* Progress bar strip at top */}
      {currentTrack && (
        <div className="relative h-0.5 bg-border/30 w-full">
          <motion.div
            className="h-full gradient-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
          <input
            type="range" min="0" max="100" value={progress}
            onChange={(e) => onSeek?.(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
      )}

      <div className="glass-strong border-t border-border/30 h-[68px] px-3 flex items-center gap-3">
        {!currentTrack ? (
          /* Empty state */
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-surface-elevated/60 flex items-center justify-center flex-shrink-0">
              <Music2 className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Auralis</p>
              <p className="text-xs text-muted-foreground">Select a track to play</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-elevated/40 flex items-center justify-center">
              <Play className="w-4 h-4 text-muted-foreground/50 ml-0.5" />
            </div>
          </div>
        ) : (
          /* Track playing — swipeable area */
          <motion.div
            className="flex items-center gap-3 w-full cursor-grab active:cursor-grabbing select-none"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            style={{ x: dragX }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {/* Cover art — click opens full screen player */}
            <motion.div
              className="flex-shrink-0 relative"
              onClick={(e) => { if (!isDragging) { e.stopPropagation(); onTrackClick?.(); } }}
              whileTap={{ scale: 0.95 }}
            >
              {currentTrack.videoReelUrl ? (
                <VideoReelPlayer
                  videoUrl={currentTrack.videoReelUrl}
                  isPlaying={isPlaying}
                  coverUrl={currentTrack.coverUrl}
                  className="w-11 h-11 rounded-xl shadow-lg"
                />
              ) : currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-11 h-11 rounded-xl object-cover shadow-lg"
                  draggable={false}
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-surface-elevated flex items-center justify-center shadow-lg">
                  <Music2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 rounded-xl border-2 border-primary/40 animate-pulse pointer-events-none" />
              )}
            </motion.div>

            {/* Track info marquee */}
            <div
              className="flex-1 min-w-0 overflow-hidden"
              onClick={() => { if (!isDragging) onTrackClick?.(); }}
            >
              <MarqueeText text={currentTrack.title} className="text-sm font-semibold text-foreground" />
              <MarqueeText text={currentTrack.artist} className="text-xs text-muted-foreground mt-0.5" />
            </div>

            {/* Action buttons — stop drag propagation */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Like */}
              <motion.button
                onClick={onToggleLike}
                whileTap={{ scale: 0.85 }}
                className="p-1.5"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${isLiked ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </motion.button>

              {/* Play/Pause */}
              <motion.button
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-md shadow-primary/30"
                whileTap={{ scale: 0.92 }}
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Pause className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Next */}
              <motion.button
                onClick={onNext}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </footer>
  );
};

export default NowPlayingBar;
