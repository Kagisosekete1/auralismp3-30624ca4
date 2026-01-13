import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Maximize2,
  ListMusic,
  Mic2,
  MonitorSpeaker,
} from "lucide-react";
import { useState } from "react";

interface NowPlayingBarProps {
  currentTrack: {
    title: string;
    artist: string;
    albumArt: string;
  };
}

const NowPlayingBar = ({ currentTrack }: NowPlayingBarProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(70);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  return (
    <footer className="h-[90px] bg-sidebar border-t border-border px-4 flex items-center justify-between">
      {/* Left - Current Track */}
      <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
        <img
          src={currentTrack.albumArt}
          alt={currentTrack.title}
          className="w-14 h-14 rounded-md shadow-md"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">
            {currentTrack.artist}
          </p>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.7 0l-.002-.001-5.32-6.318a4.573 4.573 0 01-1.011-3.84A4.618 4.618 0 014.12.817h.002zM8 3.97a3.583 3.583 0 00-5.158-1.848 3.618 3.618 0 00-1.602 2.849c-.017.573.123 1.14.403 1.633.27.479.619.906 1.022 1.271l5.335 6.34 5.335-6.34c.403-.365.752-.792 1.022-1.271.28-.493.42-1.06.403-1.633a3.618 3.618 0 00-1.602-2.849A3.583 3.583 0 008 3.97z" />
          </svg>
        </button>
      </div>

      {/* Center - Player Controls */}
      <div className="flex flex-col items-center max-w-[45%] w-full">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition-colors ${
              isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-background fill-background" />
            ) : (
              <Play className="w-4 h-4 text-background fill-background ml-0.5" />
            )}
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() =>
              setRepeatMode(
                repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off"
              )
            }
            className={`transition-colors relative ${
              repeatMode !== "off"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === "one" && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold text-primary">
                1
              </span>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-muted-foreground w-10 text-right">
            1:24
          </span>
          <div className="flex-1 group">
            <div className="h-1 bg-surface-highlight rounded-full relative">
              <div
                className="h-full bg-foreground group-hover:bg-primary rounded-full transition-colors"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: "translateX(-50%) translateY(-50%)" }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground w-10">4:02</span>
        </div>
      </div>

      {/* Right - Volume & Other Controls */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <ListMusic className="w-4 h-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MonitorSpeaker className="w-4 h-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Mic2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 group">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="w-24 relative">
            <div className="h-1 bg-surface-highlight rounded-full">
              <div
                className="h-full bg-foreground group-hover:bg-primary rounded-full transition-colors"
                style={{ width: `${volume}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};

export default NowPlayingBar;
