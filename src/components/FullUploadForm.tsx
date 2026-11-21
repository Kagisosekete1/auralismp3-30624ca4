import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, Music2, Check, Loader2, FileAudio, Image, Calendar, 
  Globe, User, Pen, Tag, Copyright, Share2, Info, AlertCircle,
  ChevronDown, Plus, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { genreNames } from "@/data/genres";
import { supabase } from "@/integrations/supabase/client";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import UploadProgressBar from "@/components/UploadProgressBar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SearchablePicker, { type PickerOption } from "@/components/SearchablePicker";
import {
  pickAudioFile,
  pickImageFile,
  isAllowedAudio,
  isAllowedImage,
  AUDIO_ACCEPT,
  IMAGE_ACCEPT,
} from "@/lib/nativeFilePicker";

const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "flac", "wav"];
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function GenrePicker({ value, onChange, optional = false }: { value: string; onChange: (value: string) => void; optional?: boolean }) {
  const options: PickerOption[] = genreNames.map((genre) => ({ value: genre, label: genre }));
  return <SearchablePicker value={value} options={options} onChange={onChange} title="Select genre" emptyLabel={optional ? "Select genre (optional)" : "Select genre"} optional={optional} />;
}

const AUDIO_EXTENSION_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/vnd.wave": "wav",
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileExtension = (name: string) => name.split(".").pop()?.toLowerCase() || "";

const getTrackTitleFromFile = (file: File) =>
  file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();

const normalizeAudioFile = (file: File) => {
  const extension = getFileExtension(file.name);
  if (ALLOWED_AUDIO_EXTENSIONS.includes(extension)) return file;

  const inferredExtension = AUDIO_EXTENSION_BY_MIME[file.type?.toLowerCase() || ""];
  if (!inferredExtension) return file;

  const baseName = file.name.replace(/\.[^/.]+$/, "").trim() || "selected-audio";
  return new File([file], `${baseName}.${inferredExtension}`, {
    type: file.type || `audio/${inferredExtension}`,
    lastModified: file.lastModified,
  });
};

const assertReadableFile = async (file: File, label: string) => {
  if (!file || file.size === 0) {
    throw new Error(`Could not read that ${label}. Please choose it again from Files.`);
  }

  await file.slice(0, Math.min(file.size, 4096)).arrayBuffer();
};



interface FullUploadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const languages = [
  "English", "Zulu", "Xhosa", "Afrikaans", "Sotho", "Tswana", "Venda", "Tsonga", 
  "Swazi", "Ndebele", "French", "Spanish", "Portuguese", "German", "Italian", 
  "Dutch", "Arabic", "Hindi", "Mandarin", "Japanese", "Korean", "Other"
];

const languageOptions: PickerOption[] = languages.map((language) => ({ value: language, label: language }));
const versionOptions: PickerOption[] = ["Original", "Deluxe", "Instrumental", "Clean", "Radio Edit", "Remix"].map((version) => ({ value: version, label: version }));

const vocalTypes = ["Lead Vocal", "Background Vocal", "Instrumental Only", "Duet", "Choir"];
const vocalTypeOptions: PickerOption[] = vocalTypes.map((type) => ({ value: type, label: type }));

const UPLOAD_FORM_KEY = "auralis_upload_form_v2";
const getTodayDate = () => new Date().toISOString().slice(0, 10);

const getInitialFormData = () => {
  try {
    const saved = sessionStorage.getItem(UPLOAD_FORM_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if data is fresh (within 2 hours)
      if (Date.now() - parsed.lastUpdated < 2 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error("Error loading upload form data:", error);
  }
  return null;
};

const FullUploadForm = ({ isOpen, onClose, onSuccess }: FullUploadFormProps) => {
  const { user } = useAuth();
  const { profile, uploadTrack } = useDatabase();
  const uploadProgress = useUploadProgress();
  const [step, setStep] = useState(() => {
    const saved = getInitialFormData();
    return Math.min(saved?.step || 1, 5);
  });
  const [isUploading, setIsUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isPremium = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'artist';
  const maxTracks = 20; // Maximum 20 tracks for all users

  // Support multiple tracks for albums/EPs
  interface TrackFile {
    id: string;
    file: File;
    title: string;
  }
  
  const [trackFiles, setTrackFiles] = useState<TrackFile[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState("");

  const defaultFormData = {
    // Release Details
    language: "English",
    title: "",
    version: "Original",
    releaseType: "single" as "album" | "ep" | "single",
    hasCoverVersions: false,
    isCompilation: false,
    
    // Artist Information
    primaryArtist: "",
    featuringArtists: [] as string[],
    
    // Publishing Information  
    writers: "",
    composer: "",
    hasLyrics: true,
    
    // Contributors
    vocalType: "Lead Vocal",
    
    // Genre
    primaryGenre: "",
    secondaryGenre: "",
    
    // Copyright
    compositionCopyright: "",
    recordingCopyright: "",
    recordLabel: "",
    
    // Dates
    originallyReleased: getTodayDate(),
    preOrderDate: "",
    salesStartDate: "",
    
    // Content
    isExplicit: false,
    
    // ISRC
    isrcCode: "",
    
    // Terms
    ownsRights: false,
    termsAgreed: false,
  };

  const [formData, setFormData] = useState(() => {
    const saved = getInitialFormData();
    return saved?.formData || defaultFormData;
  });

  const [newFeaturingArtist, setNewFeaturingArtist] = useState("");

  // Save form data to sessionStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const saveTimeout = setTimeout(() => {
      try {
        sessionStorage.setItem(UPLOAD_FORM_KEY, JSON.stringify({
          data: { formData, step },
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        console.error("Error saving upload form:", error);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [formData, step, isOpen]);

  // Save immediately when visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        try {
          sessionStorage.setItem(UPLOAD_FORM_KEY, JSON.stringify({
            data: { formData, step },
            lastUpdated: Date.now(),
          }));
        } catch (error) {
          console.error("Error saving upload form on hide:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [formData, step, isOpen]);

  useEffect(() => {
    const firstTrack = trackFiles[0]?.file;
    if (!firstTrack) {
      setAudioPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(firstTrack);
    setAudioPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [trackFiles]);

  // Clear saved data on successful submit
  const clearSavedData = () => {
    try {
      sessionStorage.removeItem(UPLOAD_FORM_KEY);
    } catch (error) {
      console.error("Error clearing upload form data:", error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeaturingArtist = () => {
    if (newFeaturingArtist.trim()) {
      setFormData(prev => ({
        ...prev,
        featuringArtists: [...prev.featuringArtists, newFeaturingArtist.trim()]
      }));
      setNewFeaturingArtist("");
    }
  };

  const removeFeaturingArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      featuringArtists: prev.featuringArtists.filter((_, i) => i !== index)
    }));
  };

  const openFilePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;
    input.click();
  };

  const acceptAudioFile = async (incomingFile: File) => {
    const file = normalizeAudioFile(incomingFile);
    const extension = getFileExtension(file.name);

    if (!isAllowedAudio(file) || !ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
      toast.error("Please select an MP3, FLAC, or WAV file");
      return;
    }

    try {
      await assertReadableFile(file, "audio file");
    } catch (error) {
      console.error("Audio file read check failed:", error);
      toast.error("Could not read that audio file. Please choose it again from Files.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be under 100MB");
      return;
    }

    const inferredTitle = getTrackTitleFromFile(file);
    const previousInferredTitle = trackFiles[0] ? getTrackTitleFromFile(trackFiles[0].file) : "";
    if (!formData.title.trim() || (formData.releaseType === "single" && formData.title === previousInferredTitle)) {
      updateField("title", inferredTitle);
    }

    // For singles, just add the single track
    if (formData.releaseType === "single") {
      setTrackFiles([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, file, title: inferredTitle }]);
    } else {
      if (trackFiles.length >= maxTracks) {
        toast.error(`Maximum ${maxTracks} tracks allowed.`);
        return;
      }
      setTrackFiles(prev => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        title: currentTrackTitle || inferredTitle
      }]);
      setCurrentTrackTitle("");
    }
    toast.success(`Track "${file.name}" added`);
  };

  // Android-safe: uses the system Files picker (SAF) inside the native app
  const chooseAudio = async () => {
    try {
      const file = await pickAudioFile();
      if (file) await acceptAudioFile(file);
    } catch (error) {
      console.error("Audio picker failed:", error);
      toast.error("Could not read that audio file. Please choose an MP3, FLAC, or WAV from Files.");
    }
  };

  const chooseCover = async () => {
    try {
      const file = await pickImageFile();
      if (file) acceptCoverFile(file);
    } catch (error) {
      console.error("Cover picker failed:", error);
      toast.error("Could not read that cover image. Please choose a JPG, PNG, or WEBP image.");
    }
  };

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await acceptAudioFile(file);
    e.target.value = "";
  };


  const removeTrack = (trackId: string) => {
    setTrackFiles(prev => prev.filter(t => t.id !== trackId));
    toast.success("Track removed");
  };

  const updateTrackTitle = (trackId: string, title: string) => {
    setTrackFiles(prev => prev.map(t => t.id === trackId ? { ...t, title } : t));
  };

  const removeCover = () => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(null);
    setCoverFile(null);
    toast.success("Cover art removed");
  };

  const acceptCoverFile = (file: File) => {
    if (!isAllowedImage(file)) {
      toast.error("Please select a JPG, PNG, or WEBP image");
      return;
    }

    if (file.size === 0) {
      toast.error("Could not read that cover image. Please choose it again from Photos or Files.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image must be under 10MB");
      return;
    }

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    toast.success(`Cover art "${file.name}" selected`);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptCoverFile(file);
    e.target.value = "";
  };


  const doUpload = useCallback(async () => {
    if (!user) return;

    setIsUploading(true);
    uploadProgress.reset();
    uploadProgress.setTrackInfo(0, trackFiles.length);

    try {
      for (let i = 0; i < trackFiles.length; i++) {
        const track = trackFiles[i];
        uploadProgress.setTrackInfo(i, trackFiles.length);
        await assertReadableFile(track.file, "audio file");
        if (coverFile) await assertReadableFile(coverFile, "cover image");

        const savedTrack = await uploadTrack(track.file, coverFile, {
          title: trackFiles.length === 1 ? formData.title : track.title,
          artistName: formData.primaryArtist || profile?.display_name || "Unknown Artist",
          genre: formData.primaryGenre,
          isExplicit: formData.isExplicit,
          version: formData.version.toLowerCase(),
          moodTags: formData.featuringArtists.length > 0 ? [`feat. ${formData.featuringArtists.join(", ")}`] : undefined,
        }, {
          onAudioStart: () => uploadProgress.setPhase("uploading-audio"),
          onAudioProgress: (p) => uploadProgress.setAudioProgress(p),
          onCoverStart: () => uploadProgress.setPhase("uploading-cover"),
          onCoverProgress: (p) => uploadProgress.setCoverProgress(p),
          onSaving: () => uploadProgress.setPhase("saving"),
        });
        if (!savedTrack?.id || !savedTrack.audio_url) {
          throw new Error(`"${track.file.name}" was not saved to your music library. Please try again.`);
        }
      }

      uploadProgress.complete();
      toast.success(`${formData.releaseType === "single" ? "Track" : formData.releaseType.toUpperCase()} submitted successfully! 🎉`);
      onSuccess?.();
      setTimeout(() => {
        resetForm();
        uploadProgress.reset();
        onClose();
      }, 1500);
    } catch (error: any) {
      uploadProgress.setError(error?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [user, trackFiles, coverFile, formData, profile, uploadTrack, onSuccess, onClose]);

  const handleRetry = useCallback(() => {
    uploadProgress.reset();
    doUpload();
  }, [doUpload, uploadProgress]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to upload music");
      return;
    }

    if (!formData.ownsRights || !formData.termsAgreed) {
      toast.error("Please agree to all terms");
      return;
    }

    if (trackFiles.length === 0) {
      toast.error("Please upload at least one audio file");
      return;
    }

    if (!formData.title) {
      toast.error("Please enter a release title");
      return;
    }

    if (!formData.primaryGenre) {
      toast.error("Please select a primary genre");
      return;
    }

    if (formData.releaseType === "single" && trackFiles.length > 1) {
      toast.error("Singles can only have 1 track");
      return;
    }

    if (formData.releaseType === "ep" && (trackFiles.length < 2 || trackFiles.length > 6)) {
      toast.error("EPs should have 2-6 tracks");
      return;
    }

    if (formData.releaseType === "album" && trackFiles.length < 3) {
      toast.error("Albums should have at least 3 tracks");
      return;
    }

    await doUpload();
  };

  const resetForm = () => {
    setStep(1);
    setTrackFiles([]);
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(null);
    setCoverFile(null);
    setCurrentTrackTitle("");
    setFormData({
      language: "English",
      title: "",
      version: "Original",
      releaseType: "single",
      hasCoverVersions: false,
      isCompilation: false,
      primaryArtist: "",
      featuringArtists: [],
      writers: "",
      composer: "",
      hasLyrics: true,
      vocalType: "Lead Vocal",
      primaryGenre: "",
      secondaryGenre: "",
      compositionCopyright: "",
      recordingCopyright: "",
      recordLabel: "",
      originallyReleased: getTodayDate(),
      preOrderDate: "",
      salesStartDate: "",
      isExplicit: false,
      isrcCode: "",
      ownsRights: false,
      termsAgreed: false,
    });
    // Clear saved form data from session storage
    clearSavedData();
    uploadProgress.reset();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all text-sm";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  const totalSteps = 5;
  const contentStep = step === 1 ? 4 : step === 5 ? 5 : step - 1;

  if (!isOpen) return null;

  if (!user) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md glass rounded-2xl border border-border/50 p-8 text-center"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <Music2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to upload your music</p>
            <button onClick={onClose} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium">
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass rounded-2xl border border-border/50"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-strong p-6 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">Auralis Music Submission</h2>
                  <p className="text-sm text-muted-foreground">Upload your music — free, artist-first platform</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4 flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'gradient-primary' : 'bg-surface-elevated'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Release Details */}
            {contentStep === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Release Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                    <SearchablePicker value={formData.language} options={languageOptions} onChange={(value) => updateField("language", value)} title="Select language" placeholder="Search languages..." />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Release Type</label>
                    <div className="flex gap-2">
                      {(["single", "ep", "album"] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => updateField("releaseType", type)}
                          className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors capitalize ${formData.releaseType === type ? 'gradient-primary text-primary-foreground' : 'bg-surface-elevated/50 text-muted-foreground hover:text-foreground'}`}
                        >
                          {type === "ep" ? "EP" : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {formData.releaseType === "single" ? "Single" : formData.releaseType === "ep" ? "EP" : "Album"} Title *
                    </label>
                    <input className={inputClass} placeholder="e.g. Midnight Waves (feat. Artist Name)" value={formData.title} onChange={e => updateField("title", e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">If this release has featuring artists for all tracks, include them in the title</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Version</label>
                    <SearchablePicker value={formData.version} options={versionOptions} onChange={(value) => updateField("version", value)} title="Select release version" placeholder="Search release versions..." />
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <button onClick={() => updateField("hasCoverVersions", !formData.hasCoverVersions)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.hasCoverVersions ? 'bg-primary border-primary' : 'border-border'}`}>
                      {formData.hasCoverVersions && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    <span className="text-sm text-foreground">This release contains cover versions</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <button onClick={() => updateField("isCompilation", !formData.isCompilation)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isCompilation ? 'bg-primary border-primary' : 'border-border'}`}>
                      {formData.isCompilation && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    <span className="text-sm text-foreground">This is a compilation album</span>
                  </label>
                </div>
              </>
            )}

            {/* Step 2: Artist & Publishing */}
            {contentStep === 2 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Artist Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Primary Artist *</label>
                    <input className={inputClass} placeholder="Your artist name" value={formData.primaryArtist} onChange={e => updateField("primaryArtist", e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Featuring Artist(s)</label>
                    <div className="flex gap-2">
                      <input 
                        className={inputClass} 
                        placeholder="Add featuring artist" 
                        value={newFeaturingArtist} 
                        onChange={e => setNewFeaturingArtist(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeaturingArtist())}
                      />
                      <button onClick={addFeaturingArtist} className="px-4 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {formData.featuringArtists.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.featuringArtists.map((artist, i) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-surface-elevated text-sm flex items-center gap-2">
                            {artist}
                            <button onClick={() => removeFeaturingArtist(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-8 mb-4">
                  <Pen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Publishing Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Writers *</label>
                    <input className={inputClass} placeholder="Writer names (comma-separated)" value={formData.writers} onChange={e => updateField("writers", e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Composer</label>
                    <input className={inputClass} placeholder="Composer name" value={formData.composer} onChange={e => updateField("composer", e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Vocals</label>
                    <SearchablePicker value={formData.vocalType} options={vocalTypeOptions} onChange={(value) => updateField("vocalType", value)} title="Select vocal type" placeholder="Search vocal types..." />
                  </div>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <button onClick={() => updateField("hasLyrics", !formData.hasLyrics)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.hasLyrics ? 'bg-primary border-primary' : 'border-border'}`}>
                    {formData.hasLyrics && <Check className="w-4 h-4 text-primary-foreground" />}
                  </button>
                  <span className="text-sm text-foreground">This release contains lyrics</span>
                </label>
              </>
            )}

            {/* Step 3: Genre & Copyright */}
            {contentStep === 3 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Genre Classification</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Primary Genre *</label>
                    <GenrePicker value={formData.primaryGenre} onChange={(value) => updateField("primaryGenre", value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Secondary Genre</label>
                    <GenrePicker value={formData.secondaryGenre} onChange={(value) => updateField("secondaryGenre", value)} optional />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-8 mb-4">
                  <Copyright className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Copyright Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Composition Copyright *</label>
                    <input className={inputClass} placeholder="© 2026 Artist Name" value={formData.compositionCopyright} onChange={e => updateField("compositionCopyright", e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Sound Recording Copyright *</label>
                    <input className={inputClass} placeholder="℗ 2026 Record Label" value={formData.recordingCopyright} onChange={e => updateField("recordingCopyright", e.target.value)} />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Record Label *</label>
                    <input className={inputClass} placeholder="Use your artist name if independent" value={formData.recordLabel} onChange={e => updateField("recordLabel", e.target.value)} />
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Release Date</h4>
                      <p className="text-xs text-muted-foreground mt-1">Set automatically to the day this music is uploaded.</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h4 className="text-sm font-medium text-foreground mb-3">Explicit Content *</h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateField("isExplicit", false)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${!formData.isExplicit ? 'gradient-primary text-primary-foreground' : 'bg-surface-elevated/50 text-muted-foreground hover:text-foreground'}`}
                      >
                        Not Explicit
                      </button>
                      <button
                        onClick={() => updateField("isExplicit", true)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${formData.isExplicit ? 'bg-destructive text-destructive-foreground' : 'bg-surface-elevated/50 text-muted-foreground hover:text-foreground'}`}
                      >
                        Explicit
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Studio Upload */}
            {contentStep === 4 && (
              <>
                <div className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-[radial-gradient(circle_at_top_left,rgba(0,217,138,0.18),transparent_34%),linear-gradient(135deg,rgba(1,24,20,0.97),rgba(0,17,35,0.96))] p-5 shadow-2xl shadow-primary/10">
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-primary">
                        <Music2 className="w-5 h-5" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">Studio Upload</span>
                      </div>
                      <h3 className="mt-2 text-2xl font-display font-bold text-foreground">
                        {formData.releaseType === "single" ? "Add Your Sound" : `Add ${formData.releaseType.toUpperCase()} Sounds`}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        MP3, FLAC, or WAV only. Files are checked before upload so missing audio cannot pass.
                      </p>
                    </div>
                    {formData.releaseType !== "single" && (
                      <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                        <p className="text-lg font-bold text-foreground">{trackFiles.length}</p>
                        <p className="text-[11px] text-muted-foreground">of {maxTracks}</p>
                      </div>
                    )}
                  </div>

                  <input ref={audioInputRef} type="file" accept={AUDIO_ACCEPT} capture={undefined} onChange={handleAudioSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />

                  {formData.releaseType !== "single" && (
                    <div className="mt-5">
                      <label className="block text-sm font-medium text-foreground mb-2">Track title before adding</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Midnight Groove"
                        value={currentTrackTitle}
                        onChange={e => setCurrentTrackTitle(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={chooseAudio}
                    disabled={isUploading}
                    className={`mt-5 w-full rounded-[24px] border p-5 text-left transition-all disabled:opacity-60 ${trackFiles.length > 0 ? 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10' : 'border-dashed border-border/60 bg-black/20 hover:border-primary/60 hover:bg-primary/5'}`}
                  >
                    {formData.releaseType === "single" && trackFiles[0] ? (
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                          <FileAudio className="w-8 h-8 text-white" />
                          <span className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-background border border-primary/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary">Sound ready</p>
                          <p className="mt-1 text-lg font-bold text-foreground truncate">{trackFiles[0].title}</p>
                          <p className="text-sm text-muted-foreground truncate">{trackFiles[0].file.name} - {formatFileSize(trackFiles[0].file.size)}</p>
                          <p className="mt-2 text-xs text-primary">Tap here to change the selected sound</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{formData.releaseType === "single" ? "Choose Sound File" : "Add Sound From Files"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Opens device Files or Storage. Max 100MB per sound.</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ALLOWED_AUDIO_EXTENSIONS.map((ext) => (
                              <span key={ext} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                                {ext}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>

                  {audioPreviewUrl && trackFiles[0] && (
                    <div className="mt-4 rounded-2xl border border-border/30 bg-black/25 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground truncate">Preview selected sound</p>
                        <button
                          type="button"
                          onClick={() => removeTrack(trackFiles[0].id)}
                          disabled={isUploading}
                          className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                      <audio controls src={audioPreviewUrl} className="w-full h-10" preload="metadata" />
                    </div>
                  )}
                </div>

                {trackFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Selected sounds</h4>
                      <span className="text-xs text-muted-foreground">{trackFiles.length} ready</span>
                    </div>
                    {trackFiles.map((track, index) => (
                      <div key={track.id} className="rounded-2xl border border-border/30 bg-surface-elevated/35 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            {formData.releaseType !== "single" ? (
                              <input
                                className="w-full bg-transparent border-b border-border/30 focus:border-primary outline-none text-foreground text-sm font-medium"
                                value={track.title}
                                onChange={e => updateTrackTitle(track.id, e.target.value)}
                                placeholder="Track title"
                              />
                            ) : (
                              <p className="font-semibold text-foreground truncate">{track.title}</p>
                            )}
                            <p className="text-xs text-muted-foreground truncate">{track.file.name} - {formatFileSize(track.file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTrack(track.id)}
                            disabled={isUploading}
                            className="p-2 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.releaseType !== "single" && (
                  <div className="rounded-2xl border border-border/30 bg-surface-elevated/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      {formData.releaseType === "ep" ? "EPs should have 2-6 tracks." : "Albums should have at least 3 tracks."}
                      {!isPremium && ` Free uploads allow up to ${maxTracks} tracks.`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-[1fr_0.8fr] gap-4">
                  <input ref={coverInputRef} type="file" accept={IMAGE_ACCEPT} capture={undefined} onChange={handleCoverSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                  <div className="rounded-[24px] border border-border/35 bg-surface-elevated/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/30 flex items-center justify-center flex-shrink-0">
                        {coverPreviewUrl ? (
                          <img src={coverPreviewUrl} alt="Selected cover art preview" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground">Cover Art</h4>
                        <p className="text-sm text-muted-foreground truncate">{coverFile ? `${coverFile.name} - ${formatFileSize(coverFile.size)}` : "JPG, PNG, or WEBP"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={chooseCover} disabled={isUploading} className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                            {coverFile ? "Change Cover" : "Choose Cover"}
                          </button>
                          {coverFile && (
                            <button type="button" onClick={removeCover} disabled={isUploading} className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">ISRC and Upload Date</h4>
                        <p className="mt-1 text-xs text-muted-foreground">ISRC is auto-generated. Release date is the day the sound is uploaded.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Upload Files */}
            {false && step === 4 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {formData.releaseType === "single" ? "Track Upload" : `${formData.releaseType.toUpperCase()} Tracks`}
                    </h3>
                  </div>
                  {formData.releaseType !== "single" && (
                    <span className="text-sm text-muted-foreground">
                      {trackFiles.length}/{maxTracks} tracks
                    </span>
                  )}
                </div>
                
                {/* Track Title Input for albums/EPs */}
                {formData.releaseType !== "single" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Track Title</label>
                    <input 
                      className={inputClass} 
                      placeholder="Enter track title before adding" 
                      value={currentTrackTitle} 
                      onChange={e => setCurrentTrackTitle(e.target.value)} 
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  <input ref={audioInputRef} type="file" accept={AUDIO_ACCEPT} capture={undefined} onChange={handleAudioSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                  
                  {/* Add Track Button */}
                  <div 
                    onClick={chooseAudio}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${trackFiles.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                  >
                    {formData.releaseType === "single" && trackFiles[0] ? (
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileAudio className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{trackFiles[0].title}</p>
                          <p className="text-sm text-muted-foreground truncate">{trackFiles[0].file.name} • {(trackFiles[0].file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <p className="text-xs text-primary mt-1">Tap to change selected music file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{formData.releaseType === "single" ? "Choose Music File *" : "Add Track from Files"}</p>
                          <p className="text-sm text-muted-foreground">Opens device Files/Storage • MP3, FLAC, WAV • Max 100MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track List */}
                  {trackFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Selected music file{trackFiles.length > 1 ? 's' : ''} ({trackFiles.length})</h4>
                      {trackFiles.map((track, index) => (
                        <div key={track.id} className="flex items-center gap-3 glass rounded-xl p-3 border border-border/30">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <FileAudio className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {formData.releaseType !== "single" ? (
                              <input
                                className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-foreground text-sm"
                                value={track.title}
                                onChange={e => updateTrackTitle(track.id, e.target.value)}
                                placeholder="Track title"
                              />
                            ) : (
                              <p className="font-medium text-foreground text-sm truncate">{track.title}</p>
                            )}
                            <p className="text-xs text-muted-foreground truncate">{track.file.name} • {(track.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button 
                            onClick={() => removeTrack(track.id)}
                            className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Track count guidance */}
                  {formData.releaseType !== "single" && (
                    <div className="glass rounded-xl p-4 border border-border/30 bg-surface-elevated/30">
                      <p className="text-sm text-muted-foreground">
                        {formData.releaseType === "ep" 
                          ? "EPs typically have 2-6 tracks" 
                          : "Albums should have at least 3 tracks"}
                        {!isPremium && ` (Free tier: max ${maxTracks} tracks)`}
                      </p>
                    </div>
                  )}

                  <input ref={coverInputRef} type="file" accept={IMAGE_ACCEPT} capture={undefined} onChange={handleCoverSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                  <div 
                    onClick={() => { if (!coverFile) chooseCover(); }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${coverFile ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/50 cursor-pointer'}`}
                  >
                    {coverFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-elevated/60 flex items-center justify-center flex-shrink-0">
                            {coverPreviewUrl ? (
                              <img src={coverPreviewUrl} alt="Selected cover art preview" className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-10 h-10 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{coverFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(coverFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <p className="text-xs text-muted-foreground mt-1">Selected image preview shown before upload</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              chooseCover();
                            }}
                            className="px-4 py-2 rounded-xl glass border border-border/40 text-foreground text-sm font-medium"
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCover();
                            }}
                            className="px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium text-foreground mb-1">Choose Cover Art</p>
                        <p className="text-sm text-muted-foreground">Photos, gallery, or files • JPG, JPEG, PNG, WEBP • Preview shown before upload</p>
                      </>
                    )}
                  </div>
                  
                  <div className="glass rounded-xl p-4 border border-primary/30 bg-primary/5">
                    <label className="block text-sm font-medium text-foreground mb-2">ISRC Code</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 text-muted-foreground text-sm">
                        <span className="text-primary font-mono">Auto-generated</span> upon submission
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Auralis automatically generates a unique ISRC code for each track (format: ZA-AUR-26-XXXXX)
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Terms & Submit */}
            {step === 5 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Upload Terms & Submit</h3>
                </div>

                {/* Upload Progress */}
                <UploadProgressBar
                  state={uploadProgress.state}
                  onRetry={handleRetry}
                  onCancel={() => { uploadProgress.reset(); setIsUploading(false); }}
                />
                
                <div className="glass rounded-xl p-4 border border-border/30 mb-6">
                  <h4 className="font-medium text-foreground mb-3">By uploading to Auralis:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5" />
                      Your music is reviewed for quality & copyright compliance
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5" />
                      Approved releases go live on the platform
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5" />
                      Your release gets a shareable public link
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5" />
                      You remain 100% owner of your music
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5" />
                      Free uploads are available for all artists
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <button onClick={() => updateField("ownsRights", !formData.ownsRights)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.ownsRights ? 'bg-primary border-primary' : 'border-border'}`}>
                      {formData.ownsRights && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    <span className="text-sm text-foreground">I confirm that I own or control all rights to this release</span>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <button onClick={() => updateField("termsAgreed", !formData.termsAgreed)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.termsAgreed ? 'bg-primary border-primary' : 'border-border'}`}>
                      {formData.termsAgreed && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    <span className="text-sm text-foreground">I agree to the Terms of Use and Privacy Policy</span>
                  </label>
                </div>
                
                {formData.title && (
                  <div className="mt-6 glass rounded-xl p-4 border border-border/30">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Share Link (after approval):</h4>
                    <p className="text-sm text-primary font-mono break-all">
                      https://auralis.app/release/{formData.primaryArtist?.toLowerCase().replace(/\s+/g, '-') || 'artist'}/{formData.title.toLowerCase().replace(/\s+/g, '-')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> WhatsApp
                      </button>
                      <button className="px-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-medium flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> Instagram
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 glass-strong p-6 border-t border-border/30 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl bg-surface-elevated/50 text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            {step < totalSteps ? (
              <button
                onClick={() => {
                  // Validate each step before proceeding
                  if (contentStep === 1) {
                    if (!formData.title.trim()) { toast.error("Please enter a release title"); return; }
                  }
                  if (contentStep === 2) {
                    if (!formData.primaryArtist.trim()) { toast.error("Please enter a primary artist name"); return; }
                    if (!formData.writers.trim()) { toast.error("Please enter writer name(s)"); return; }
                  }
                  if (contentStep === 3) {
                    if (!formData.primaryGenre) { toast.error("Please select a primary genre"); return; }
                    if (!formData.compositionCopyright.trim()) { toast.error("Please enter composition copyright"); return; }
                    if (!formData.recordingCopyright.trim()) { toast.error("Please enter recording copyright"); return; }
                    if (!formData.recordLabel.trim()) { toast.error("Please enter a record label"); return; }
                  }
                  if (contentStep === 4) {
                    if (trackFiles.length === 0) { toast.error("Please upload at least one audio file"); return; }
                    // Validate track titles
                    const emptyTitle = trackFiles.find(t => !t.title.trim());
                    if (emptyTitle) { toast.error("Please enter a title for each track"); return; }
                  }
                  setStep(step + 1);
                }}
                className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isUploading || !formData.ownsRights || !formData.termsAgreed}
                className="px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit My Music
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullUploadForm;
