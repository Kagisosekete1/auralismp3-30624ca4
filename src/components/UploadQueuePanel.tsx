import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileAudio, Loader2, RefreshCw, Upload, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDatabase } from "@/hooks/useDatabase";
import {
  attachAudio,
  clearFinished,
  removeItem,
  retryItem,
  useUploadQueueItems,
  useUploadQueueProcessor,
} from "@/hooks/useUploadQueue";
import { isAllowedAudio, pickAudioFile } from "@/lib/nativeFilePicker";

const phaseLabel: Record<string, string> = {
  waiting: "Waiting…",
  "uploading-audio": "Uploading audio",
  "uploading-cover": "Uploading cover art",
  saving: "Finishing up",
  done: "Uploaded",
  error: "Failed",
};

const UploadQueuePanel = ({ onUploaded }: { onUploaded?: () => void }) => {
  const { uploadTrack } = useDatabase();
  const items = useUploadQueueItems();
  const [collapsed, setCollapsed] = useState(false);

  useUploadQueueProcessor(uploadTrack as any, onUploaded);

  if (items.length === 0) return null;

  const active = items.filter((i) => i.status !== "done").length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-[150px] md:bottom-28 right-4 z-40 w-[calc(100%-2rem)] max-w-sm"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <div className="glass-strong rounded-2xl border border-border/40 overflow-hidden shadow-xl">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center gap-2 p-3 border-b border-border/30"
          >
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground flex-1 text-left">
              Uploads {active > 0 ? `(${active} active)` : "complete"}
            </span>
            <span className="text-xs text-muted-foreground">{collapsed ? "Show" : "Hide"}</span>
          </button>

          {!collapsed && (
            <div className="max-h-64 overflow-y-auto divide-y divide-border/20">
              {items.map((item) => (
                <div key={item.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : item.status === "uploading" ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : item.status === "error" ? (
                      <WifiOff className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : (
                      <FileAudio className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.meta.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.status === "needs-file"
                          ? "Re-attach audio to resume"
                          : item.error || phaseLabel[item.phase]}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${item.status === "error" ? "bg-destructive" : "gradient-primary"}`}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {item.status === "error" && (
                    <button
                      onClick={() => retryItem(item.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-elevated/60 text-xs font-medium text-foreground"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry now
                    </button>
                  )}

                  {item.status === "needs-file" && (
                    <button
                      onClick={async () => {
                        try {
                          const file = await pickAudioFile();
                          if (!file) return;
                          if (!isAllowedAudio(file) || file.size === 0) {
                            toast.error("Please re-attach a readable MP3, FLAC, or WAV file.");
                            return;
                          }
                          attachAudio(item.id, file);
                        } catch (error) {
                          console.error("Audio re-attach failed:", error);
                          toast.error("Could not re-attach that audio file. Please choose it again from Files.");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg gradient-primary text-xs font-semibold text-primary-foreground"
                    >
                      <FileAudio className="w-3.5 h-3.5" /> Re-attach "{item.audioName}"
                    </button>
                  )}
                </div>
              ))}

              {items.some((i) => i.status === "done") && (
                <button
                  onClick={clearFinished}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear completed
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadQueuePanel;
