import { useEffect, useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  UploadQueueItem,
  canAutoRetry,
  getFiles,
  getSnapshot,
  nextPending,
  subscribe,
  updateItem,
} from "@/lib/uploadQueueStore";

export {
  enqueue as enqueueUpload,
  attachAudio,
  retryItem,
  retryAll,
  removeItem,
  clearFinished,
} from "@/lib/uploadQueueStore";
export type { UploadQueueItem } from "@/lib/uploadQueueStore";

export const useUploadQueueItems = (): UploadQueueItem[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

type Uploader = (
  audio: File,
  cover: File | null,
  meta: any,
  callbacks: any
) => Promise<any>;

/**
 * Drives the queue: one upload at a time, automatic backoff retry after brief
 * disconnects, and an immediate resume when the device comes back online.
 */
export const useUploadQueueProcessor = (uploadTrack: Uploader, onUploaded?: () => void) => {
  const items = useUploadQueueItems();
  const running = useRef(false);
  const uploadRef = useRef(uploadTrack);
  uploadRef.current = uploadTrack;

  useEffect(() => {
    if (running.current) return;

    const item = nextPending();
    if (!item) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      updateItem(item.id, { status: "error", phase: "error", error: "Offline — will resume automatically." });
      return;
    }

    running.current = true;

    (async () => {
      const stored = getFiles(item.id);
      if (!stored?.audio) {
        updateItem(item.id, { status: "needs-file", error: "Re-attach the audio file to resume." });
        running.current = false;
        return;
      }

      updateItem(item.id, { status: "uploading", phase: "uploading-audio", error: null, attempts: item.attempts + 1 });

      try {
        await uploadRef.current(stored.audio, stored.cover, item.meta, {
          onAudioStart: () => updateItem(item.id, { phase: "uploading-audio" }),
          onAudioProgress: (p: number) => updateItem(item.id, { progress: Math.round(p * 0.85) }),
          onCoverStart: () => updateItem(item.id, { phase: "uploading-cover" }),
          onCoverProgress: (p: number) => updateItem(item.id, { progress: 85 + Math.round(p * 0.1) }),
          onSaving: () => updateItem(item.id, { phase: "saving", progress: 96 }),
        });

        updateItem(item.id, { status: "done", phase: "done", progress: 100, error: null });
        toast.success(`"${item.meta.title}" uploaded 🎉`);
        onUploaded?.();
      } catch (error: any) {
        const message = error?.message || "Upload failed";
        const latest = getSnapshot().find((i) => i.id === item.id);
        updateItem(item.id, { status: "error", phase: "error", error: message });

        if (latest && canAutoRetry(latest)) {
          const delay = Math.min(15000, 2000 * 2 ** (latest.attempts - 1));
          setTimeout(() => {
            const current = getSnapshot().find((i) => i.id === item.id);
            if (current?.status === "error" && navigator.onLine !== false) {
              updateItem(item.id, { status: "queued", phase: "waiting", error: null });
            }
          }, delay);
        }
      } finally {
        running.current = false;
      }
    })();
  }, [items, onUploaded]);

  // Resume everything that failed as soon as connectivity returns
  useEffect(() => {
    const onOnline = () => {
      getSnapshot()
        .filter((i) => i.status === "error" && getFiles(i.id)?.audio)
        .forEach((i) => updateItem(i.id, { status: "queued", phase: "waiting", error: null, attempts: 0 }));
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  // Warn before leaving with uploads in flight
  useEffect(() => {
    const active = items.some((i) => i.status === "uploading" || i.status === "queued");
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [items]);
};
