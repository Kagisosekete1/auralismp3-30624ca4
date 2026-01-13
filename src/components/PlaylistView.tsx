import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Plus, Music2, Trash2, Clock, MoreHorizontal, Shuffle } from "lucide-react";
import { useState } from "react";
import type { Playlist, Track } from "@/hooks/useAppState";
import EmptyState from "./EmptyState";

interface PlaylistViewProps {
  playlist: Playlist;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

const PlaylistView = ({
  playlist,
  onAddTrack,
  onRemoveTrack,
  onPlayTrack,
  currentTrack,
  isPlaying,
}: PlaylistViewProps) => {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  const isTrackPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      {/* Header */}
      <div className="gradient-hero p-8">
        <div className="flex items-end gap-6">
          <motion.div
            className={`w-48 h-48 rounded-2xl bg-gradient-to-br ${playlist.gradient} flex items-center justify-center shadow-2xl`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Music2 className="w-24 h-24 text-primary-foreground/80" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">PLAYLIST</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-2">{playlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {playlist.tracks.length} songs
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            onClick={() => playlist.tracks[0] && onPlayTrack(playlist.tracks[0])}
            className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center glow-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={playlist.tracks.length === 0}
          >
            <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-1" />
          </motion.button>

          <motion.button
            className="w-12 h-12 rounded-full glass border-glow flex items-center justify-center text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shuffle className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={onAddTrack}
            className="px-5 py-2.5 rounded-xl glass border-glow text-foreground font-medium flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Add Track
          </motion.button>
        </div>
      </div>

      {/* Track List */}
      <div className="px-8 py-6">
        {playlist.tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No tracks yet"
            description="Start building your playlist by adding some tracks"
            actionLabel="Add First Track"
            onAction={onAddTrack}
          />
        ) : (
          <>
            {/* Header Row */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2 text-sm text-muted-foreground border-b border-border/30 mb-2">
              <span className="w-10 text-center">#</span>
              <span>Title</span>
              <span>Album</span>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Tracks */}
            <AnimatePresence>
              {playlist.tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  className={`group grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center px-4 py-2 rounded-xl transition-colors ${
                    isTrackPlaying(track) ? "glass border-glow" : "hover:bg-surface-elevated/30"
                  }`}
                  onMouseEnter={() => setHoveredTrack(track.id)}
                  onMouseLeave={() => setHoveredTrack(null)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ x: 4 }}
                >
                  {/* Index / Play */}
                  <div className="w-10 flex justify-center">
                    {hoveredTrack === track.id || isTrackPlaying(track) ? (
                      <motion.button
                        onClick={() => onPlayTrack(track)}
                        className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isTrackPlaying(track) ? (
                          <Pause className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
                        )}
                      </motion.button>
                    ) : (
                      <span className={`text-sm font-medium ${isTrackPlaying(track) ? "text-primary" : "text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                      <Music2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${isTrackPlaying(track) ? "text-primary" : "text-foreground"}`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Album */}
                  <p className="text-sm text-muted-foreground truncate">
                    {track.album}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {track.duration}
                    </span>
                    
                    <motion.button
                      onClick={() => onRemoveTrack(track.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaylistView;
