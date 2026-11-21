import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import EnhancedFeedPost from "@/components/EnhancedFeedPost";

interface PostDetail {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  track?: { id: string; title: string; artist_name: string; cover_url?: string; video_reel_url?: string } | null;
  profile?: { display_name?: string; avatar_url?: string };
}

interface PostNotificationModalProps {
  postId: string | null;
  onClose: () => void;
  onPlayTrack: (track: any) => void;
  onViewProfile: (userId: string) => void;
}

const PostNotificationModal = ({ postId, onClose, onPlayTrack, onViewProfile }: PostNotificationModalProps) => {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      return;
    }

    let active = true;
    setLoading(true);
    void (async () => {
      const { data: row, error } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();
      if (error || !row) {
        if (active) setPost(null);
        setLoading(false);
        return;
      }

      const [profileResult, trackResult] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url").eq("user_id", row.user_id).maybeSingle(),
        row.track_id ? supabase.from("tracks").select("id, title, artist_name, cover_url, video_reel_url").eq("id", row.track_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ]);
      if (active) {
        setPost({ ...row, content: row.content || "", profile: profileResult.data || undefined, track: trackResult.data });
      }
      setLoading(false);
    })();

    return () => { active = false; };
  }, [postId]);

  return (
    <Dialog open={Boolean(postId)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto border-border bg-background p-0 text-foreground">
        <DialogTitle className="sr-only">Original post</DialogTitle>
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading post...</p> : post ? (
          <EnhancedFeedPost post={post} onPlayTrack={onPlayTrack} onViewProfile={onViewProfile} />
        ) : <p className="p-8 text-center text-sm text-muted-foreground">This post is no longer available.</p>}
      </DialogContent>
    </Dialog>
  );
};

export default PostNotificationModal;
