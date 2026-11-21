/**
 * Android-safe file picking.
 *
 * On a native Android build (Capacitor) we use the Storage Access Framework
 * through @capawesome/capacitor-file-picker, which always opens the system
 * Files/Documents picker (never the Photos gallery) and returns a real File.
 *
 * In a normal browser we fall back to a hidden <input type="file"> with
 * the same strict audio and cover-art formats used by the native picker.
 */

export const AUDIO_EXTENSIONS = ["mp3", "flac", "wav"];
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const AUDIO_ACCEPT = ".mp3,.flac,.wav,audio/mpeg,audio/flac,audio/wav,audio/x-wav";
export const IMAGE_ACCEPT = "image/*,.jpg,.jpeg,.png,.webp";

const AUDIO_PICKER_TYPES = ["audio/*"];

const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const AUDIO_MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  flac: "audio/flac",
  wav: "audio/wav",
};

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/vnd.wave": "wav",
};

export const isNativePlatform = (): boolean => {
  const cap = (window as any)?.Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export const getExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";

const getKnownFileType = (name: string, fallback = "") =>
  AUDIO_MIME_BY_EXTENSION[getExtension(name)] || fallback;

export const isAllowedAudio = (file: File) => {
  const extension = getExtension(file.name);
  return AUDIO_EXTENSIONS.includes(extension) || Boolean(AUDIO_EXTENSION_BY_MIME[file.type]);
};

export const isAllowedImage = (file: File) =>
  IMAGE_EXTENSIONS.includes(getExtension(file.name)) || IMAGE_MIME_TYPES.includes(file.type);

type PickKind = "audio" | "image";

const shouldUseNativePicker = async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return isNativePlatform();
  }
};

const makeSafeFileName = (picked: { name?: string; mimeType?: string }, kind: PickKind) => {
  const name = picked.name?.trim();
  if (name && getExtension(name)) return name;
  if (name && kind === "audio") {
    const inferredExt = AUDIO_EXTENSION_BY_MIME[(picked.mimeType || "").toLowerCase()];
    return inferredExt ? `${name}.${inferredExt}` : name;
  }
  if (name) return name;
  return kind === "audio" ? "selected-audio.mp3" : "selected-cover.jpg";
};

const fileFromBase64 = (base64: string, fileName: string, type: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type });
};

const pickNative = async (kind: PickKind, multiple: boolean): Promise<File[]> => {
  const { Capacitor } = await import("@capacitor/core");
  const { FilePicker } = await import("@capawesome/capacitor-file-picker");

  const result = await FilePicker.pickFiles({
    types: kind === "audio" ? AUDIO_PICKER_TYPES : IMAGE_MIME_TYPES,
    limit: multiple ? 0 : 1,
    readData: false,
  });

  const files: File[] = [];
  for (const picked of result.files || []) {
    const name = makeSafeFileName(picked, kind);
    const type = getKnownFileType(name, picked.mimeType || "");

    if (kind === "audio" && !AUDIO_EXTENSIONS.includes(getExtension(name))) {
      throw new Error(`"${name}" is not supported. Please choose an MP3, FLAC, or WAV file.`);
    }

    // The plugin exposes a real File on Android/iOS web view when available.
    if ((picked as any).blob) {
      const blob = (picked as any).blob as Blob;
      if (!blob.size || (picked.size > 0 && blob.size !== picked.size)) {
        throw new Error(`Could not read the complete file "${name}" from device storage.`);
      }
      files.push(new File([blob], name, { type: type || blob.type }));
      continue;
    }

    if (picked.path || (picked as any).webPath) {
      const source = (picked as any).webPath || picked.path!;
      const urls = [Capacitor.convertFileSrc(source), source].filter(
        (url, index, all) => Boolean(url) && all.indexOf(url) === index,
      );
      let blob: Blob | null = null;

      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const candidate = await response.blob();
            if (candidate.size > 0 && (!picked.size || candidate.size === picked.size)) {
              blob = candidate;
              break;
            }
          }
        } catch {
          // Try the next URI form below.
        }
      }

      if (!blob) throw new Error(`Could not read the complete file "${name}" from Android storage. Please select it again from Files.`);
      files.push(new File([blob], name, { type: type || blob.type }));
      continue;
    }

    if ((picked as any).data) {
      files.push(fileFromBase64((picked as any).data, name, type || "application/octet-stream"));
      continue;
    }

    throw new Error(`Could not read "${name}" from Android storage.`);
  }
  return files;
};

const isPickerCancel = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "");
  return /cancel/i.test(message);
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
  if (await shouldUseNativePicker()) {
    try {
      return await pickNative(kind, multiple);
    } catch (error) {
      if (isPickerCancel(error)) return [];
      console.error("Native file picker failed", error);
      throw error;
    }
  }
  return pickWeb(kind, multiple);
};

export const pickAudioFile = async (): Promise<File | null> => (await pickFiles("audio", false))[0] || null;
export const pickAudioFiles = (): Promise<File[]> => pickFiles("audio", true);
export const pickImageFile = async (): Promise<File | null> => (await pickFiles("image", false))[0] || null;
