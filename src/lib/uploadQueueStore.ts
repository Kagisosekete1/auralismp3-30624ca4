/**
 * Persistent upload queue.
 *
 * Progress/metadata survives reloads (localStorage). The actual File objects
 * cannot be persisted by the browser, so an item restored after a reload is
 * marked "needs-file" and the artist just re-attaches the audio to resume.
 */

export type UploadItemStatus = "queued" | "uploading" | "error" | "done" | "needs-file";

export interface UploadTrackMeta {
  title: string;
  artistName: string;
  genre?: string;
  bpm?: number;
  key?: string;
  isExplicit: boolean;
  version: string;
  moodTags?: string[];
}

export interface UploadQueueItem {
  id: string;
  meta: UploadTrackMeta;
  audioName: string;
  audioSize: number;
  coverName: string | null;
  status: UploadItemStatus;
  phase: "waiting" | "uploading-audio" | "uploading-cover" | "saving" | "done" | "error";
  progress: number;
  error: string | null;
  attempts: number;
  createdAt: number;
}

const STORAGE_KEY = "auralis_upload_queue_v1";
const MAX_AUTO_ATTEMPTS = 4;

let items: UploadQueueItem[] = [];
const files = new Map<string, { audio: File | null; cover: File | null }>();
const listeners = new Set<() => void>();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Could not persist upload queue", error);
  }
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: UploadQueueItem[] = JSON.parse(raw);
    items = parsed
      .filter((i) => i.status !== "done")
      .map((i) => ({ ...i, status: "needs-file" as const, phase: "waiting" as const, error: i.error || null }));
  } catch (error) {
    console.warn("Could not restore upload queue", error);
  }
};

load();

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => items;

export const getFiles = (id: string) => files.get(id);

export const enqueue = (meta: UploadTrackMeta, audio: File, cover: File | null): string => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  files.set(id, { audio, cover });
  items = [
    ...items,
    {
      id,
      meta,
      audioName: audio.name,
      audioSize: audio.size,
      coverName: cover?.name || null,
      status: "queued",
      phase: "waiting",
      progress: 0,
      error: null,
      attempts: 0,
      createdAt: Date.now(),
    },
  ];
  emit();
  return id;
};

export const updateItem = (id: string, patch: Partial<UploadQueueItem>) => {
  items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
  emit();
};

export const removeItem = (id: string) => {
  items = items.filter((i) => i.id !== id);
  files.delete(id);
  emit();
};

export const clearFinished = () => {
  items.filter((i) => i.status === "done").forEach((i) => files.delete(i.id));
  items = items.filter((i) => i.status !== "done");
  emit();
};

export const attachAudio = (id: string, audio: File) => {
  const existing = files.get(id);
  files.set(id, { audio, cover: existing?.cover || null });
  updateItem(id, { status: "queued", error: null, progress: 0, phase: "waiting", audioName: audio.name, audioSize: audio.size });
};

export const retryItem = (id: string) => {
  const stored = files.get(id);
  if (!stored?.audio) {
    updateItem(id, { status: "needs-file", error: "Re-attach the audio file to resume this upload." });
    return;
  }
  updateItem(id, { status: "queued", error: null, phase: "waiting", attempts: 0 });
};

export const retryAll = () => {
  items.filter((i) => i.status === "error").forEach((i) => retryItem(i.id));
};

export const canAutoRetry = (item: UploadQueueItem) => item.attempts < MAX_AUTO_ATTEMPTS;

export const nextPending = (): UploadQueueItem | undefined =>
  items.find((i) => i.status === "queued" && files.get(i.id)?.audio);
