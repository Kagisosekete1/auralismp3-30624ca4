import { useEffect, useState } from "react";
import { Loader2, Mic2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

type CreatorRole = "artist" | "dj" | "producer";

interface ArtistSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onComplete: () => Promise<void>;
}

const ArtistSetupDialog = ({ open, onOpenChange, initialName = "", onComplete }: ArtistSetupDialogProps) => {
  const [artistName, setArtistName] = useState(initialName);
  const [creatorRole, setCreatorRole] = useState<CreatorRole>("artist");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) setArtistName(initialName);
  }, [initialName, open]);

  const becomeCreator = async () => {
    if (!artistName.trim()) {
      toast.error("Enter the public artist name you release music under.");
      return;
    }

    setSaving(true);
    const { error: registrationError } = await (supabase as any).rpc("register_auralis_creator", {
      p_artist_name: artistName.trim(),
      p_creator_role: creatorRole,
    });
    let error = registrationError;

    // Existing deployments may not have the onboarding RPC yet. The profile's
    // own-row update policy still allows a signed-in user to self-identify as a creator.
    if (error?.message.includes("register_auralis_creator") && user) {
      const fallback = await supabase.from("profiles")
        .update({ is_artist: true, artist_name: artistName.trim() })
        .eq("user_id", user.id)
        .select("user_id")
        .maybeSingle();
      error = fallback.error;
      if (!error && !fallback.data) error = new Error("Your account profile is missing. Please sign out and back in, then try again.");
    }
    setSaving(false);

    if (error) {
      console.error("Creator registration failed:", error);
      toast.error(error.message);
      return;
    }

    await onComplete();
    toast.success("Artist profile saved. You can now upload eligible releases.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-border/60 bg-background sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Mic2 className="h-6 w-6" /></div>
          <DialogTitle className="text-center">Set up your creator profile</DialogTitle>
          <DialogDescription className="text-center">Your account is currently set as a listener. Save your creator role and public artist name to enable music uploads. This does not change your subscription.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground" htmlFor="creator-role">Creator role</label>
          <select id="creator-role" value={creatorRole} onChange={(event) => setCreatorRole(event.target.value as CreatorRole)} className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-3 text-foreground">
            <option value="artist">Artist</option>
            <option value="dj">DJ</option>
            <option value="producer">Producer</option>
          </select>
          <label className="block text-sm font-medium text-foreground" htmlFor="creator-name">Public artist name</label>
          <input id="creator-name" autoComplete="nickname" maxLength={80} value={artistName} onChange={(event) => setArtistName(event.target.value)} placeholder="Name shown on your releases" className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-3 text-foreground placeholder:text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Listeners remain listener accounts unless they complete this setup. Free creator accounts can publish singles and EPs; full albums require Premium.</p>
          <Button type="button" onClick={becomeCreator} disabled={saving || !artistName.trim()} className="w-full">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving profile...</> : "Continue to music upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistSetupDialog;
