import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, FileAudio, Image, Save } from "lucide-react";
import type { UploadState } from "@/hooks/useUploadProgress";

interface UploadProgressBarProps {
  state: UploadState;
  onRetry?: () => void;
  onCancel?: () => void;
}

const phaseLabels: Record<UploadState["phase"], string> = {
  idle: "Ready",
  "uploading-audio": "Uploading audio...",
  "uploading-cover": "Uploading cover art...",
  saving: "Saving track info...",
  done: "Upload complete!",
  error: "Upload failed",
};

const PhaseIcon = ({ phase }: { phase: UploadState["phase"] }) => {
  switch (phase) {
    case "uploading-audio":
      return <FileAudio className="w-4 h-4 text-primary animate-pulse" />;
    case "uploading-cover":
      return <Image className="w-4 h-4 text-primary animate-pulse" />;
    case "saving":
      return <Save className="w-4 h-4 text-primary animate-pulse" />;
    case "done":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Loader2 className="w-4 h-4 text-muted-foreground" />;
  }
};

const UploadProgressBar = ({ state, onRetry, onCancel }: UploadProgressBarProps) => {
  if (state.phase === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-border/30 p-4 space-y-3"
    >
      {/* Phase label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhaseIcon phase={state.phase} />
          <span className="text-sm font-medium text-foreground">
            {phaseLabels[state.phase]}
          </span>
          {state.totalTracks > 1 && state.phase !== "done" && state.phase !== "error" && (
            <span className="text-xs text-muted-foreground">
              (Track {state.currentTrackIndex + 1}/{state.totalTracks})
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {state.overallProgress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-surface-elevated/60 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            state.phase === "error"
              ? "bg-destructive"
              : state.phase === "done"
              ? "bg-green-500"
              : "gradient-primary"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${state.overallProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Error state with retry */}
      {state.phase === "error" && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-destructive">{state.error || "Something went wrong"}</p>
          <div className="flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-primary-foreground"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success */}
      {state.phase === "done" && (
        <p className="text-xs text-green-500">Your music has been uploaded successfully! 🎉</p>
      )}
    </motion.div>
  );
};

export default UploadProgressBar;
