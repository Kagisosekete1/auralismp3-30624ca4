import { useState, useRef, useEffect } from "react";
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

const vocalTypes = ["Lead Vocal", "Background Vocal", "Instrumental Only", "Duet", "Choir"];

const UPLOAD_FORM_KEY = "auralis_upload_form";

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
  const [step, setStep] = useState(() => {
    const saved = getInitialFormData();
    return saved?.step || 1;
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
    originallyReleased: "",
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

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Accept any audio type or common audio extensions
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const audioExtensions = ['mp3','wav','flac','aiff','aif','m4a','ogg','wma','aac','opus','webm'];
    const isAudio = file.type.startsWith("audio/") || file.type === 'application/octet-stream' || audioExtensions.includes(ext);
    if (!isAudio) {
      toast.error("Please upload a valid audio file (MP3, WAV, FLAC, AIFF)");
      // Reset input so user can retry
      e.target.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be under 100MB");
      e.target.value = "";
      return;
    }
    
    // For singles, just add the single track
    if (formData.releaseType === "single") {
      setTrackFiles([{ id: Date.now().toString(), file, title: currentTrackTitle || formData.title || file.name.replace(/\.[^/.]+$/, "") }]);
    } else {
      // For albums/EPs, check track limit
      if (trackFiles.length >= maxTracks) {
        toast.error(`Maximum ${maxTracks} tracks allowed.`);
        e.target.value = "";
        return;
      }
      setTrackFiles(prev => [...prev, { 
        id: Date.now().toString(), 
        file, 
        title: currentTrackTitle || file.name.replace(/\.[^/.]+$/, "") 
      }]);
      setCurrentTrackTitle("");
    }
    toast.success(`Track "${file.name}" added`);
    // Reset input value so same file can be re-selected if needed
    e.target.value = "";
  };

  const removeTrack = (trackId: string) => {
    setTrackFiles(prev => prev.filter(t => t.id !== trackId));
    toast.success("Track removed");
  };

  const updateTrackTitle = (trackId: string, title: string) => {
    setTrackFiles(prev => prev.map(t => t.id === trackId ? { ...t, title } : t));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)$/i);
    if (!isImage) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image must be under 10MB");
      e.target.value = "";
      return;
    }
    setCoverFile(file);
    toast.success(`Cover art "${file.name}" selected`);
    e.target.value = "";
  };

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

    // Validate track count for release type
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

    setIsUploading(true);

    try {
      // Upload each track
      for (const track of trackFiles) {
        await uploadTrack(track.file, coverFile, {
          title: trackFiles.length === 1 ? formData.title : track.title,
          artistName: formData.primaryArtist || profile?.display_name || "Unknown Artist",
          genre: formData.primaryGenre,
          isExplicit: formData.isExplicit,
          version: formData.version.toLowerCase(),
          moodTags: formData.featuringArtists.length > 0 ? [`feat. ${formData.featuringArtists.join(", ")}`] : undefined,
        });
      }

      toast.success(`${formData.releaseType === "single" ? "Track" : formData.releaseType.toUpperCase()} submitted successfully! 🎉`);
      onSuccess?.();
      resetForm();
      onClose();
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTrackFiles([]);
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
      originallyReleased: "",
      preOrderDate: "",
      salesStartDate: "",
      isExplicit: false,
      isrcCode: "",
      ownsRights: false,
      termsAgreed: false,
    });
    // Clear saved form data from session storage
    clearSavedData();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all text-sm";
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  const totalSteps = 6;

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
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Release Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                    <select className={selectClass} value={formData.language} onChange={e => updateField("language", e.target.value)}>
                      {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
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
                    <select className={selectClass} value={formData.version} onChange={e => updateField("version", e.target.value)}>
                      <option value="Original">Original</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Instrumental">Instrumental</option>
                      <option value="Clean">Clean</option>
                      <option value="Radio Edit">Radio Edit</option>
                      <option value="Remix">Remix</option>
                    </select>
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
            {step === 2 && (
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
                    <select className={selectClass} value={formData.vocalType} onChange={e => updateField("vocalType", e.target.value)}>
                      {vocalTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
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
            {step === 3 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Genre Classification</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Primary Genre *</label>
                    <select className={selectClass} value={formData.primaryGenre} onChange={e => updateField("primaryGenre", e.target.value)}>
                      <option value="">Select genre</option>
                      {genreNames.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Secondary Genre</label>
                    <select className={selectClass} value={formData.secondaryGenre} onChange={e => updateField("secondaryGenre", e.target.value)}>
                      <option value="">Select genre (optional)</option>
                      {genreNames.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
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
              </>
            )}

            {/* Step 4: Dates & Content */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Release Dates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Originally Released *</label>
                    <input type="date" className={inputClass} value={formData.originallyReleased} onChange={e => updateField("originallyReleased", e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">The date this was first made public</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Sales Start Date</label>
                    <input type="date" className={inputClass} value={formData.salesStartDate} onChange={e => updateField("salesStartDate", e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to go live immediately</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Pre-Order Date</label>
                    <input type="date" className={inputClass} value={formData.preOrderDate} onChange={e => updateField("preOrderDate", e.target.value)} />
                  </div>
                </div>
                
                <div className="mt-8">
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
              </>
            )}

            {/* Step 5: Upload Files */}
            {step === 5 && (
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
                  <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.wav,.flac,.aiff,.m4a,.ogg,.aac" onChange={handleAudioSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                  
                  {/* Add Track Button */}
                  <div 
                    onClick={() => audioInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${trackFiles.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          {formData.releaseType === "single" 
                            ? (trackFiles.length > 0 ? "Replace Track" : "Add Audio File *")
                            : "Add Track to Album"}
                        </p>
                        <p className="text-sm text-muted-foreground">MP3, WAV, FLAC, AIFF • Max 100MB per file</p>
                      </div>
                    </div>
                  </div>

                  {/* Track List */}
                  {trackFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Tracks ({trackFiles.length})</h4>
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

                  <input ref={coverInputRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp" onChange={handleCoverSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${coverFile ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                  >
                    {coverFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <Image className="w-12 h-12 text-primary" />
                        <div className="text-left">
                          <p className="font-medium text-foreground">{coverFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(coverFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium text-foreground mb-1">Upload Cover Art</p>
                        <p className="text-sm text-muted-foreground">JPG or PNG • Min 3000×3000px recommended</p>
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

            {/* Step 6: Terms & Submit */}
            {step === 6 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold text-foreground">Upload Terms & Submit</h3>
                </div>
                
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
                      <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium flex items-center gap-1">
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
                onClick={() => setStep(step + 1)}
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
