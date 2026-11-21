import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import authLogo from "@/assets/auralis-mark.png";
import { TermsContent } from "@/components/TermsContent";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [accountRole, setAccountRole] = useState<"listener" | "artist" | "dj" | "producer">("listener");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (isSignUp && !termsAccepted) {
      toast.error("Please read and agree to the Terms of Use.");
      return;
    }
    if (isSignUp && (!displayName.trim() || !/^[a-z0-9_]{15,30}$/.test(username))) {
      toast.error("Enter a display name and a username of 15-30 lowercase letters, numbers or underscores.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName.trim(), username, accountRole);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Welcome to Auralis!");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <img src={authLogo} alt="Auralis" className="h-28 w-28 rounded-2xl object-contain" />
          <p className="text-muted-foreground mt-3">Your music, your way</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          className="glass rounded-3xl border border-border/50 p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your artist name"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all"
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="account-role" className="mb-2 block text-sm font-medium text-foreground">How will you use Auralis?</label>
                  <select id="account-role" value={accountRole} onChange={(event) => setAccountRole(event.target.value as typeof accountRole)} className="w-full rounded-xl border border-border/50 bg-surface-elevated/50 px-4 py-3 text-foreground outline-none focus:border-primary/50">
                    <option value="listener">Listener</option>
                    <option value="artist">Artist</option>
                    <option value="dj">DJ</option>
                    <option value="producer">Producer</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">Listeners stream music. Creator accounts can publish eligible releases.</p>
                </div>
              </motion.div>
            )}

            {isSignUp && <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} minLength={15} maxLength={30} autoCapitalize="none" autoCorrect="off" placeholder="yourname_2026" className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-elevated/50 border border-border/50 focus:border-primary/50 text-foreground outline-none" />
                <p className="mt-1 text-xs text-muted-foreground">15-30 lowercase letters, numbers, or underscores</p>
              </div>
            </div>}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="your@email.com"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated/50 border ${errors.email ? "border-destructive" : "border-border/50"} focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all`}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 rounded-xl bg-surface-elevated/50 border ${errors.password ? "border-destructive" : "border-border/50"} focus:border-primary/50 text-foreground placeholder:text-muted-foreground outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            {isSignUp && <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <input id="accept-terms" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <label htmlFor="accept-terms">I agree to the <button type="button" onClick={() => setTermsOpen(true)} className="font-medium text-primary underline">Terms of Use</button>.</label>
            </div>}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto border-border bg-background text-foreground">
          <DialogTitle>Terms of Use</DialogTitle>
          <TermsContent />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
