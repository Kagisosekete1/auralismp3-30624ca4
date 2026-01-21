import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Play, Trash2, GripVertical } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: number;
}

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
  history: Track[];
}

const QueueModal = ({ 
  isOpen, 
  onClose, 
  queue, 
  currentTrack, 
  onPlayTrack, 
  onRemoveFromQueue, 
  onClearQueue,
  history 
}: QueueModalProps) => {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full md:max-w-lg max-h-[80vh] glass rounded-t-2xl md:rounded-2xl border border-border/50 overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-strong p-4 border-b border-border/30 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground">Queue</h2>
            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <motion.button
                  onClick={onClearQueue}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  Clear All
                </motion.button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-4 border-b border-border/30">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "queue" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              Up Next ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "history" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              History ({history.length})
            </button>
          </div>

          {/* Current Track */}
          {currentTrack && (
            <div className="p-4 border-b border-border/30">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Now Playing</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center overflow-hidden">
                  {currentTrack.coverUrl ? (
                    <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music2 className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{currentTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* Track List */}
          <div className="overflow-y-auto max-h-[50vh] p-4">
            {activeTab === "queue" ? (
              queue.length > 0 ? (
                <div className="space-y-2">
                  {queue.map((track, index) => (
                    <motion.div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-xl glass border border-border/30 group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <div 
                        className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center overflow-hidden cursor-pointer relative group"
                        onClick={() => onPlayTrack(track)}
                      >
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music2 className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <motion.button
                        onClick={() => onRemoveFromQueue(track.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your queue is empty</p>
                  <p className="text-sm text-muted-foreground/60">Add songs to play next</p>
                </div>
              )
            ) : (
              history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((track, index) => (
                    <motion.div
                      key={`${track.id}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-xl glass border border-border/30 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => onPlayTrack(track)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 0.7, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center overflow-hidden">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music2 className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No listening history</p>
                  <p className="text-sm text-muted-foreground/60">Start playing music!</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QueueModal;
