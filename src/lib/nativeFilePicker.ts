/**
 * Android-safe file picking.
 *
 * On a native Android build (Capacitor) we use the Storage Access Framework
 * through @capawesome/capacitor-file-picker, which always opens the system
 * Files/Documents picker (never the Photos gallery) and returns a real File.
 *
 * In a normal browser we fall back to a hidden <input type="file">, using
 * broad MIME accepts so Android Chrome offers "Files" as a source.
 */

export const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "m4a", "aac", "aiff", "aif", "ogg"];
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const AUDIO_ACCEPT = "audio/*,.mp3,.wav,.flac,.m4a,.aac,.aiff,.aif,.ogg";
export const IMAGE_ACCEPT = "image/*,.jpg,.jpeg,.png,.webp";

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/aiff",
  "audio/ogg",
];

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const isNativePlatform = (): boolean => {
  const cap = (window as any)?.Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export const getExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";

export const isAllowedAudio = (file: File) =>
  file.type.startsWith("audio/") || AUDIO_EXTENSIONS.includes(getExtension(file.name));

export const isAllowedImage = (file: File) =>
  file.type.startsWith("image/") || IMAGE_EXTENSIONS.includes(getExtension(file.name));

type PickKind = "audio" | "image";

const pickNative = async (kind: PickKind, multiple: boolean): Promise<File[]> => {
  const { FilePicker } = await import("@capawesome/capacitor-file-picker");
  const result = await FilePicker.pickFiles({
    types: kind === "audio" ? AUDIO_MIME_TYPES : IMAGE_MIME_TYPES,
    limit: multiple ? 0 : 1,
    readData: false,
  });

  const files: File[] = [];
  for (const picked of result.files || []) {
    // The plugin exposes a real File on Android/iOS web view when available.
    if ((picked as any).blob) {
      const blob = (picked as any).blob as Blob;
      files.push(new File([blob], picked.name, { type: picked.mimeType || blob.type }));
      continue;
    }
    if (picked.path || (picked as any).webPath) {
      const src = (picked as any).webPath || `file://${picked.path}`;
      const response = await fetch(src);
      const blob = await response.blob();
      files.push(new File([blob], picked.name, { type: picked.mimeType || blob.type }));
    }
  }
  return files;
};

const pickWeb = (kind: PickKind, multiple: boolean): Promise<File[]> =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "audio" ? AUDIO_ACCEPT : IMAGE_ACCEPT;
    input.multiple = multiple;
    // Never hint at the camera/gallery — that is what pushes Android to Photos.
    input.removeAttribute("capture");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);

    const cleanup = () => {
      window.removeEventListener("focus", onFocus);
      setTimeout(() => input.remove(), 0);
    };

    const onChange = () => {
      const files = Array.from(input.files || []);
      cleanup();
      resolve(files);
    };

    // If the user cancels, `change` never fires — resolve empty on refocus.
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          cleanup();
          resolve([]);
        }
      }, 800);
    };

    input.addEventListener("change", onChange, { once: true });
    window.addEventListener("focus", onFocus);
    input.click();
  });

export const pickFiles = async (kind: PickKind, multiple = false): Promise<File[]> => {
  if (isNativePlatform()) {
    try {
      return await pickNative(kind, multiple);
    } catch (error) {
      console.warn("Native file picker failed, falling back to web input", error);
    }
  }
  return pickWeb(kind, multiple);
};

export const pickAudioFile = async (): Promise<File | null> => (await pickFiles("audio", false))[0] || null;
export const pickAudioFiles = (): Promise<File[]> => pickFiles("audio", true);
export const pickImageFile = async (): Promise<File | null> => (await pickFiles("image", false))[0] || null;
