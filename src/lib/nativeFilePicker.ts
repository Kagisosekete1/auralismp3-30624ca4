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

const base64ToFile = (base64: string, name: string, type: string): File => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type });
};

const pickNative = async (kind: PickKind, multiple: boolean): Promise<File[]> => {
  const { FilePicker } = await import("@capawesome/capacitor-file-picker");
  const result = await FilePicker.pickFiles({
    types: kind === "audio" ? AUDIO_MIME_TYPES : IMAGE_MIME_TYPES,
    limit: multiple ? 0 : 1,
    readData: false,
  });

  const cap = (window as any)?.Capacitor;
  const files: File[] = [];

  for (const picked of result.files || []) {
    const name = picked.name || `upload-${Date.now()}`;
    const type = picked.mimeType || (kind === "audio" ? "audio/mpeg" : "image/jpeg");

    // 1) Plugin already handed us a real Blob/File (web + some iOS cases)
    const rawBlob = (picked as any).blob as Blob | undefined;
    if (rawBlob) {
      files.push(new File([rawBlob], name, { type: rawBlob.type || type }));
      continue;
    }

    // 2) Native Android: a `content://`/`file://` path CANNOT be fetched directly
    //    from the WebView. It must be converted with Capacitor.convertFileSrc,
    //    which proxies it through the local capacitor http server.
    const nativePath = (picked as any).path || (picked as any).webPath;
    if (nativePath) {
      try {
        const src = cap?.convertFileSrc ? cap.convertFileSrc(nativePath) : nativePath;
        const response = await fetch(src);
        if (!response.ok) throw new Error(`status ${response.status}`);
        const blob = await response.blob();
        if (blob.size > 0) {
          files.push(new File([blob], name, { type: blob.type || type }));
          continue;
        }
      } catch (error) {
        console.warn("convertFileSrc read failed, falling back to base64", error);
      }
    }

    // 3) Last resort: ask the plugin to read the bytes for us as base64.
    try {
      const withData = await FilePicker.pickFiles({
        types: kind === "audio" ? AUDIO_MIME_TYPES : IMAGE_MIME_TYPES,
        limit: 1,
        readData: true,
      });
      const d = withData.files?.[0];
      if (d?.data) files.push(base64ToFile(d.data, d.name || name, d.mimeType || type));
    } catch (error) {
      console.warn("base64 fallback failed", error);
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
