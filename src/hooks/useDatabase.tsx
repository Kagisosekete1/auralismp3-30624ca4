import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateISRC } from "@/utils/isrcGenerator";

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
    }
  };

  // Upload track
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
    }
  ) => {
    if (!user) return null;

    try {
      // Upload audio file
      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `${user.id}/${Date.now()}.${audioExt}`;
      
      const { error: audioError } = await supabase.storage
        .from("audio")
        .upload(audioPath, audioFile);

      if (audioError) throw audioError;

      const { data: audioUrlData } = supabase.storage
        .from("audio")
        .getPublicUrl(audioPath);

      // Upload cover if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `${user.id}/${Date.now()}.${coverExt}`;
        
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from("covers")
          .getPublicUrl(coverPath);
        
        coverUrl = coverUrlData.publicUrl;
      }

      // Generate unique ISRC code
      const isrcCode = await generateISRC();

      // Create track record
      const { data, error } = await supabase
        .from("tracks")
        .insert({
          user_id: user.id,
          title: trackData.title,
          artist_name: trackData.artistName,
          genre: trackData.genre,
          bpm: trackData.bpm,
          key: trackData.key,
          audio_url: audioUrlData.publicUrl,
          cover_url: coverUrl,
          is_explicit: trackData.isExplicit,
          version: trackData.version,
          mood_tags: trackData.moodTags,
          isrc_code: isrcCode,
          is_approved: true, // Auto-approve for now
          status: "live",
        })
        .select()
        .single();

      if (error) throw error;

      setTracks((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload track");
      return null;
    }
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
  };
};
