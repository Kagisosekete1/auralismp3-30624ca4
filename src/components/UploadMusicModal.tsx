import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Music2, Video, Check, Loader2, FileAudio, Image } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";

interface UploadMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const genres = ["Hip-Hop", "Pop", "Afrobeats", "EDM", "R&B", "Rock", "Drill", "Trap", "House", "Other"];

const UploadMusicModal = ({ isOpen, onClose, onSuccess }: UploadMusicModalProps) => {
  const { user } = useAuth();
  const { uploadTrack, profile } = useDatabase();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    producerName: "", bio: "", primaryGenres: [] as string[], moodTags: "",
    instagram: "", tiktok: "", youtube: "", website: "",
    trackTitle: "", version: "original", primaryGenre: "", 
    bpm: "", key: "", explicit: false,
    ownsRights: false, termsAgreed: false, distributionAgreed: false, rightsConfirmed: false,
    useVideoReel: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      primaryGenres: prev.primaryGenres.includes(genre)
        ? prev.primaryGenres.filter(g => g !== genre)
        : prev.primaryGenres.length < 3 ? [...prev.primaryGenres, genre] : prev.primaryGenres
    }));
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    console.log("Audio file selected:", file.name, "type:", file.type, "size:", file.size);
    // On mobile, MIME types are unreliable — accept all files
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be under 100MB");
      e.target.value = "";
      return;
    }
    setAudioFile(file);
    toast.success(`Audio file "${file.name}" selected`);
    e.target.value = "";
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No cover file selected");
      return;
    }
    console.log("Cover file selected:", file.name, "type:", file.type, "size:", file.size);
    // On mobile, accept any file — don't block based on MIME type
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

    if (!formData.termsAgreed || !formData.distributionAgreed || !formData.rightsConfirmed) {
      toast.error("Please agree to all terms");
      return;
    }

    if (!audioFile) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!formData.trackTitle) {
      toast.error("Please enter a track title");
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadTrack(audioFile, coverFile, {
        title: formData.trackTitle,
        artistName: formData.producerName || profile?.display_name || "Unknown Artist",
        genre: formData.primaryGenre,
        bpm: formData.bpm ? parseInt(formData.bpm) : undefined,
        key: formData.key || undefined,
        isExplicit: formData.explicit,
        version: formData.version,
        moodTags: formData.moodTags ? formData.moodTags.split(",").map(t => t.trim()) : undefined,
      });

      if (result) {
        toast.success("Track uploaded successfully! 🎉");
        onSuccess?.();
        resetForm();
        onClose();
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAudioFile(null);
    setCoverFile(null);
    setFormData({
      producerName: "", bio: "", primaryGenres: [], moodTags: "",
      instagram: "", tiktok: "", youtube: "", website: "",
      trackTitle: "", version: "original", primaryGenre: "",
      bpm: "", key: "", explicit: false,
      ownsRights: false, termsAgreed: false, distributionAgreed: false, rightsConfirmed: false,
      useVideoReel: false,
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all text-sm";

  if (!user) {
    return (
      <AnimatePresence>
        {isOpen && (
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
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl border border-border/50"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-strong p-6 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">Upload Music</h2>
                  <p className="text-sm text-muted-foreground">Step {step} of 4</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4">
              <div className="flex gap-2">
                {[1,2,3,4].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'gradient-primary' : 'bg-surface-elevated'}`} />
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {step === 1 && (
                <>
                  <h3 className="text-lg font-display font-bold text-foreground">Artist Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Artist/Producer Name *</label>
                      <input className={inputClass} placeholder="Your stage name" value={formData.producerName} onChange={e => updateField("producerName", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bio (max 500 chars)</label>
                    <textarea className={`${inputClass} h-24 resize-none`} placeholder="Tell us about yourself..." value={formData.bio} onChange={e => updateField("bio", e.target.value.slice(0, 500))} />
                    <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/500</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Primary Genres (up to 3)</label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(genre => (
                        <button key={genre} onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.primaryGenres.includes(genre) ? 'gradient-primary text-primary-foreground' : 'bg-surface-elevated/50 text-muted-foreground hover:text-foreground'}`}>
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="text-lg font-display font-bold text-foreground">Track Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Track Title *</label>
                      <input className={inputClass} placeholder="Your track name" value={formData.trackTitle} onChange={e => updateField("trackTitle", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Version</label>
                      <select className={inputClass} value={formData.version} onChange={e => updateField("version", e.target.value)}>
                        <option value="original">Original</option>
                        <option value="remix">Remix</option>
                        <option value="instrumental">Instrumental</option>
                        <option value="radio">Radio Edit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Primary Genre *</label>
                      <select className={inputClass} value={formData.primaryGenre} onChange={e => updateField("primaryGenre", e.target.value)}>
                        <option value="">Select genre</option>
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">BPM</label>
                      <input type="number" className={inputClass} placeholder="120" value={formData.bpm} onChange={e => updateField("bpm", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Key</label>
                      <input className={inputClass} placeholder="C Major" value={formData.key} onChange={e => updateField("key", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateField("explicit", !formData.explicit)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.explicit ? 'bg-primary border-primary' : 'border-border'}`}>
                      {formData.explicit && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>
                    <span className="text-sm text-foreground">Contains explicit content</span>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h3 className="text-lg font-display font-bold text-foreground">Upload Files</h3>
                  <div className="space-y-4">
                    {/* Audio File Upload */}
                    <input ref={audioInputRef} type="file" accept="*/*" onChange={handleAudioSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
                    <div 
                      onClick={() => audioInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${audioFile ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
                    >
                      {audioFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileAudio className="w-12 h-12 text-primary" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">{audioFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="font-medium text-foreground mb-1">Upload Audio File *</p>
                          <p className="text-sm text-muted-foreground">WAV, AIFF, FLAC, MP3 • Max 100MB</p>
                        </>
                      )}
                    </div>

                    {/* Cover Art Upload */}
                    <input ref={coverInputRef} type="file" accept="*/*" onChange={handleCoverSelect} onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} className="hidden" />
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
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="font-medium text-foreground mb-1">Upload Cover Art (Optional)</p>
                          <p className="text-sm text-muted-foreground">JPG or PNG • Min 3000×3000px recommended</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-4 glass rounded-xl border border-border/30">
                      <button onClick={() => updateField("useVideoReel", !formData.useVideoReel)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.useVideoReel ? 'bg-primary border-primary' : 'border-border'}`}>
                        {formData.useVideoReel && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Video className="w-4 h-4" /> Use 10-second video reel instead
                        </p>
                        <p className="text-xs text-muted-foreground">Replace album cover with a looped video preview</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h3 className="text-lg font-display font-bold text-foreground">Rights & Agreements</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => updateField("ownsRights", !formData.ownsRights)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.ownsRights ? 'bg-primary border-primary' : 'border-border'}`}>
                        {formData.ownsRights && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <span className="text-sm text-foreground">I own 100% of the rights to this track</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <button onClick={() => updateField("rightsConfirmed", !formData.rightsConfirmed)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.rightsConfirmed ? 'bg-primary border-primary' : 'border-border'}`}>
                        {formData.rightsConfirmed && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <span className="text-sm text-foreground">I confirm that I own or control all rights to this music *</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <button onClick={() => updateField("termsAgreed", !formData.termsAgreed)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.termsAgreed ? 'bg-primary border-primary' : 'border-border'}`}>
                        {formData.termsAgreed && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <span className="text-sm text-foreground">I agree to the Terms of Service *</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <button onClick={() => updateField("distributionAgreed", !formData.distributionAgreed)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${formData.distributionAgreed ? 'bg-primary border-primary' : 'border-border'}`}>
                        {formData.distributionAgreed && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <span className="text-sm text-foreground">I agree to the Distribution & Monetization Agreement *</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 glass-strong p-6 border-t border-border/30 flex gap-3">
              {step > 1 && (
                <motion.button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl glass border-glow text-foreground font-medium" whileTap={{ scale: 0.98 }} disabled={isUploading}>
                  Back
                </motion.button>
              )}
              <motion.button
                onClick={step < 4 ? () => setStep(step + 1) : handleSubmit}
                disabled={isUploading}
                className="flex-1 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : step < 4 ? "Continue" : "Submit Track"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadMusicModal;
