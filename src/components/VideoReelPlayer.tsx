import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play } from "lucide-react";

interface VideoReelPlayerProps {
  videoUrl: string;
  isPlaying: boolean;
  coverUrl?: string;
  className?: string;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
}

const VideoReelPlayer = ({
  videoUrl,
  isPlaying,
  coverUrl,
  className = "",
  loop = true,
  muted = true,
  autoPlay = true,
}: VideoReelPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(muted);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying && autoPlay) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, autoPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  if (!videoUrl) {
    return coverUrl ? (
      <img src={coverUrl} alt="Cover" className={`object-cover ${className}`} />
    ) : null;
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop={loop}
        muted={isMuted}
        playsInline
        onLoadedData={handleVideoLoaded}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Fallback cover while video loads */}
      {!isVideoLoaded && coverUrl && (
        <img 
          src={coverUrl} 
          alt="Cover" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Play indicator overlay */}
      <AnimatePresence>
        {!isPlaying && isVideoLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute toggle */}
      <AnimatePresence>
        {showControls && isVideoLoaded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 5-second loop indicator */}
      {isPlaying && isVideoLoaded && (
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
          Video Reel
        </div>
      )}
    </div>
  );
};

export default VideoReelPlayer;
