import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateISRC } from "@/utils/isrcGenerator";
import { dispatchPushNotification } from "@/lib/dispatchPushNotification";

const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "flac", "wav"];
const ALLOWED_COVER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const STORAGE_MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  flac: "audio/flac",
  wav: "audio/wav",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const getFileExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";

const getStorageContentType = (file: File) =>
  STORAGE_MIME_BY_EXTENSION[getFileExtension(file.name)] || file.type || "application/octet-stream";

const getUploadErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error || "Upload failed");

const makeStorageFileName = (userId: string, suffix: string, extension: string) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${userId}/${unique}${suffix}.${extension}`;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getStorageParts = (path: string) => {
  const slashIndex = path.lastIndexOf("/");
  return {
    folder: slashIndex >= 0 ? path.slice(0, slashIndex) : "",
    name: slashIndex >= 0 ? path.slice(slashIndex + 1) : path,
  };
};

export interface DbTrack {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  duration: number;
  audio_url: string;
  cover_url?: string;
  video_reel_url?: string;
  is_explicit: boolean;
  play_count: number;
  like_count: number;
  version: string;
  mood_tags?: string[];
  is_approved: boolean;
  status: string;
  created_at: string;
}

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  gradient: string;
  is_public: boolean;
  created_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  display_name?: string;
  username?: string;
  artist_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  country?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  followers_count: number;
  total_plays: number;
  is_artist: boolean;
  creator_role?: "listener" | "artist" | "dj" | "producer";
  subscription_tier?: string;
  short_reel_url?: string;
}

export const useDatabase = () => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [playlists, setPlaylists] = useState<DbPlaylist[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's tracks
  const fetchTracks = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tracks:", error);
      return;
    }

    setTracks(data || []);
  }, [user]);

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching playlists:", error);
      return;
    }

    setPlaylists(data || []);
  }, [user]);

  // Fetch liked tracks
  const fetchLikedTracks = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("liked_tracks")
      .select("track_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching liked tracks:", error);
      return;
    }

    setLikedTrackIds(data?.map((lt) => lt.track_id) || []);
  }, [user]);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchTracks(),
        fetchPlaylists(),
        fetchLikedTracks(),
        fetchProfile(),
      ]);
      setLoading(false);
    };

    init();
  }, [user, fetchTracks, fetchPlaylists, fetchLikedTracks, fetchProfile]);

  // Create playlist
  const createPlaylist = async (name: string, description?: string) => {
    if (!user) return null;

    const gradients = [
      "from-primary to-accent",
      "from-secondary to-primary",
      "from-accent to-secondary",
    ];

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name,
        description,
        gradient: gradients[Math.floor(Math.random() * gradients.length)],
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create playlist");
      return null;
    }

    setPlaylists((prev) => [data, ...prev]);
    return data;
  };

  // Delete playlist
  const deletePlaylist = async (id: string) => {
    const { error } = await supabase.from("playlists").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete playlist");
      return;
    }

    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  // Toggle like track
  const toggleLike = async (trackId: string) => {
    if (!user) return;

    const isLiked = likedTrackIds.includes(trackId);

    if (isLiked) {
      const { error } = await supabase
        .from("liked_tracks")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

      if (error) {
        toast.error("Failed to unlike track");
        return;
      }

      setLikedTrackIds((prev) => prev.filter((id) => id !== trackId));
    } else {
      const { error } = await supabase.from("liked_tracks").insert({
        user_id: user.id,
        track_id: trackId,
      });

      if (error) {
        toast.error("Failed to like track");
        return;
      }

      setLikedTrackIds((prev) => [...prev, trackId]);
      void dispatchPushNotification("song_like", user.id, trackId);
    }
  };

  // Upload track with optional progress callbacks
  const uploadTrack = async (
    audioFile: File,
    coverFile: File | null,
    trackData: {
      title: string;
      artistName: string;
      genre?: string;
      bpm?: number;
      key?: string;
      isExplicit: boolean;
      version: string;
      moodTags?: string[];
      albumId?: string;
      albumTitle?: string;
    },
    callbacks?: {
      onAudioStart?: () => void;
      onAudioProgress?: (percent: number) => void;
      onCoverStart?: () => void;
      onCoverProgress?: (percent: number) => void;
      onSaving?: () => void;
    }
  ) => {
    if (!user) return null;

    let uploadedAudioPath: string | null = null;
    let uploadedCoverPath: string | null = null;

    try {
      if (!audioFile || audioFile.size === 0) {
        throw new Error("Could not read that audio file. Please choose it again from Files.");
      }

      const audioExt = getFileExtension(audioFile.name);
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(audioExt)) {
        throw new Error("Only MP3, FLAC, and WAV audio uploads are allowed.");
      }

      // Upload audio file
      callbacks?.onAudioStart?.();
      const audioPath = makeStorageFileName(user.id, "", audioExt);
      uploadedAudioPath = audioPath;
      
      // Use XMLHttpRequest for progress tracking
      const audioPublicUrl = await uploadWithProgress(
        "audio",
        audioPath,
        audioFile,
        callbacks?.onAudioProgress
      );

      // Upload cover if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        if (coverFile.size === 0) {
          throw new Error("Could not read that cover image. Please choose it again from Photos or Files.");
        }

        const coverExt = getFileExtension(coverFile.name);
        if (!ALLOWED_COVER_EXTENSIONS.includes(coverExt)) {
          throw new Error("Only JPG, PNG, and WEBP cover art uploads are allowed.");
        }

        callbacks?.onCoverStart?.();
        const coverPath = makeStorageFileName(user.id, "-cover", coverExt);
        uploadedCoverPath = coverPath;
        
        coverUrl = await uploadWithProgress(
          "covers",
          coverPath,
          coverFile,
          callbacks?.onCoverProgress
        );
      }

      // Generate unique ISRC code
      callbacks?.onSaving?.();
      const isrcCode = await generateISRC();

      // Create track record
      const { data, error } = await supabase
        .from("tracks")
        .insert({
          user_id: user.id,
          title: trackData.title,
          artist_name: trackData.artistName,
          album: trackData.albumTitle,
          album_id: trackData.albumId,
          genre: trackData.genre,
          bpm: trackData.bpm,
          key: trackData.key,
          audio_url: audioPublicUrl,
          cover_url: coverUrl,
          is_explicit: trackData.isExplicit,
          version: trackData.version,
          mood_tags: trackData.moodTags,
          isrc_code: isrcCode,
          created_at: new Date().toISOString(),
          is_approved: true,
          status: "live",
        })
        .select()
        .single();

      if (error) throw error;

      setTracks((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      const removals = [
        uploadedCoverPath && supabase.storage.from("covers").remove([uploadedCoverPath]),
        uploadedAudioPath && supabase.storage.from("audio").remove([uploadedAudioPath]),
      ].filter(Boolean);
      await Promise.all(removals).catch((cleanupError) => {
        console.warn("Could not remove incomplete upload files:", cleanupError);
      });
      throw error; // Re-throw so callers can handle retry
    }
  };

  const verifyUploadedObject = async (bucket: string, path: string) => {
    const { folder, name } = getStorageParts(path);
    const retryDelays = [0, 500, 1200, 2200];
    let lastError: unknown = null;

    for (const delay of retryDelays) {
      if (delay > 0) await wait(delay);

      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: 100,
        search: name,
      });

      if (!error && data?.some((item) => item.name === name)) return;
      if (error) lastError = error;
    }

    const { error: signedUrlError } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (!signedUrlError) return;

    throw new Error(
      `Supabase accepted the upload, but "${name}" is not visible in the ${bucket} bucket yet. ${getUploadErrorMessage(lastError || signedUrlError)}`,
    );
  };

  // Helper: upload file, then verify storage before saving the track row.
  const uploadWithProgress = async (
    bucket: string,
    path: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const contentType = getStorageContentType(file);

    if (!supabaseUrl || !anonKey) {
      throw new Error("Supabase upload settings are missing");
    }

    if (!file || file.size === 0) {
      throw new Error(`"${file?.name || "Selected file"}" could not be read. Please choose it again from Files.`);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error("Your sign-in session expired. Please sign in again before uploading music.");
    }

    const sdkUpload = async () => {
      onProgress?.(12);
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        contentType,
        upsert: true,
      });

      if (error) throw error;
      onProgress?.(88);
    };

    const xhrUpload = (reason: unknown) =>
      new Promise<void>((resolve, reject) => {
        console.warn("Retrying upload through direct storage request.", reason);
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.timeout = 10 * 60 * 1000;
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.setRequestHeader("x-upsert", "true");

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress?.(Math.min(98, Math.round((e.loaded / e.total) * 100)));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
        xhr.addEventListener("timeout", () => reject(new Error("Upload timed out. Please keep the app open and try again.")));

        xhr.send(file);
      });

    let usedRetry = false;
    try {
      await sdkUpload();
    } catch (sdkError) {
      usedRetry = true;
      await xhrUpload(sdkError);
    }

    try {
      await verifyUploadedObject(bucket, path);
    } catch (verificationError) {
      if (usedRetry) throw verificationError;
      usedRetry = true;
      await xhrUpload(verificationError);
      await verifyUploadedObject(bucket, path);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error("Supabase did not return a public URL for the uploaded file.");
    }

    onProgress?.(100);
    return data.publicUrl;
  };

  // Update profile
  const updateProfile = async (updates: Partial<DbProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    toast.success("Profile updated!");
  };

  return {
    tracks,
    playlists,
    likedTrackIds,
    profile,
    loading,
    createPlaylist,
    deletePlaylist,
    toggleLike,
    uploadTrack,
    updateProfile,
    refetchTracks: fetchTracks,
    refetchPlaylists: fetchPlaylists,
    refetchProfile: fetchProfile,
  };
};
