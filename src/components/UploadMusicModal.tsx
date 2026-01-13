import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Music2, User, Mail, Phone, Globe, Instagram, Video, Check } from "lucide-react";
import { toast } from "sonner";

interface UploadMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const genres = ["Hip-Hop", "Pop", "Afrobeats", "EDM", "R&B", "Rock", "Drill", "Trap", "House", "Other"];

const UploadMusicModal = ({ isOpen, onClose }: UploadMusicModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    producerName: "", legalName: "", email: "", phone: "", country: "",
    bio: "", primaryGenres: [] as string[], moodTags: "",
    instagram: "", tiktok: "", youtube: "", website: "",
    trackTitle: "", version: "original", primaryGenre: "", secondaryGenre: "",
    bpm: "", key: "", explicit: false,
    ownsRights: false, previouslyReleased: false, releasedWhere: "",
    allowMonetization: true, distribution: "platform", royaltySplit: "",
    termsAgreed: false, distributionAgreed: false, rightsConfirmed: false,
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

  const handleSubmit = () => {
    if (!formData.termsAgreed || !formData.distributionAgreed || !formData.rightsConfirmed) {
      toast.error("Please agree to all terms");
      return;
    }
    toast.success("Track submitted successfully! We'll review it shortly.");
    onClose();
    setStep(1);
    setFormData({
      producerName: "", legalName: "", email: "", phone: "", country: "",
      bio: "", primaryGenres: [], moodTags: "",
      instagram: "", tiktok: "", youtube: "", website: "",
      trackTitle: "", version: "original", primaryGenre: "", secondaryGenre: "",
      bpm: "", key: "", explicit: false,
      ownsRights: false, previouslyReleased: false, releasedWhere: "",
      allowMonetization: true, distribution: "platform", royaltySplit: "",
      termsAgreed: false, distributionAgreed: false, rightsConfirmed: false,
      useVideoReel: false,
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all text-sm";

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
                  <h3 className="text-lg font-display font-bold text-foreground">Producer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Producer/Artist Name *</label>
                      <input className={inputClass} placeholder="Your stage name" value={formData.producerName} onChange={e => updateField("producerName", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Legal Name *</label>
                      <input className={inputClass} placeholder="For contracts & payouts" value={formData.legalName} onChange={e => updateField("legalName", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                      <input type="email" className={inputClass} placeholder="your@email.com" value={formData.email} onChange={e => updateField("email", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Country *</label>
                      <input className={inputClass} placeholder="Your country" value={formData.country} onChange={e => updateField("country", e.target.value)} />
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
                    <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-medium text-foreground mb-1">Upload Audio File</p>
                      <p className="text-sm text-muted-foreground">WAV, AIFF, FLAC, MP3 • Min 16-bit/44.1kHz</p>
                    </div>
                    <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-medium text-foreground mb-1">Upload Cover Art</p>
                      <p className="text-sm text-muted-foreground">JPG or PNG • Min 3000×3000px</p>
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
                <motion.button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl glass border-glow text-foreground font-medium" whileTap={{ scale: 0.98 }}>
                  Back
                </motion.button>
              )}
              <motion.button
                onClick={step < 4 ? () => setStep(step + 1) : handleSubmit}
                className="flex-1 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium glow-primary"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {step < 4 ? "Continue" : "Submit Track"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadMusicModal;
