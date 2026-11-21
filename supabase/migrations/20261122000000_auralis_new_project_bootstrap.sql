-- Add Auralis data structures to an existing Supabase project without replacing
-- the starter profiles, settings, or users tables.
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS artist_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS youtube text,
  ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_plays bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_artist boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS short_reel_url text,
  ADD COLUMN IF NOT EXISTS subscription_tier text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, artist_name text NOT NULL, cover_url text, description text,
  primary_genre text, secondary_genre text, language text, release_type text, release_date date,
  sales_start_date date, pre_order_date date, record_label text, recording_copyright text,
  composition_copyright text, is_explicit boolean DEFAULT false, is_compilation boolean DEFAULT false,
  has_cover_versions boolean DEFAULT false, is_approved boolean DEFAULT false, status text DEFAULT 'pending',
  version text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, artist_name text NOT NULL, album text, album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  genre text, secondary_genre text, bpm integer, key text, duration integer DEFAULT 0, audio_url text NOT NULL,
  cover_url text, video_reel_url text, is_explicit boolean DEFAULT false, play_count bigint NOT NULL DEFAULT 0,
  like_count bigint NOT NULL DEFAULT 0, version text DEFAULT 'original', mood_tags text[], is_approved boolean DEFAULT false,
  status text DEFAULT 'pending', isrc_code text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, description text, cover_url text, gradient text DEFAULT 'from-primary to-accent',
  is_public boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE, position integer DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(), UNIQUE(playlist_id, track_id)
);
CREATE TABLE IF NOT EXISTS public.liked_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, track_id)
);
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id), CHECK(follower_id <> following_id)
);
CREATE TABLE IF NOT EXISTS public.play_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE, played_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, message text NOT NULL, related_id uuid, data jsonb,
  read boolean NOT NULL DEFAULT false, push_sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text, image_url text, track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(post_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(comment_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, content text NOT NULL,
  read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Auralis profiles are readable" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users insert own Auralis profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own Auralis profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Approved tracks are public" ON public.tracks FOR SELECT USING (is_approved IS TRUE OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users create own tracks" ON public.tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own tracks" ON public.tracks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users delete own tracks" ON public.tracks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Albums are public when approved" ON public.albums FOR SELECT USING (is_approved IS TRUE OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own albums" ON public.albums FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own playlists" ON public.playlists FOR ALL USING (auth.uid() = user_id OR is_public) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Playlist tracks follow playlist access" ON public.playlist_tracks FOR ALL
    USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND (p.user_id = auth.uid() OR p.is_public)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own likes" ON public.liked_tracks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Follows are public" ON public.follows FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own play history" ON public.play_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public posts are readable" ON public.posts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Post likes are readable" ON public.post_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own post likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Post comments are readable" ON public.post_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own post comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Comment likes are readable" ON public.comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users manage own comment likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users read their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users send messages as self" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update received messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, username, full_name, display_name, artist_name)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    NEW.raw_user_meta_data ->> 'artist_name'
  )
  ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    artist_name = COALESCE(EXCLUDED.artist_name, public.profiles.artist_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.notify_track_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; track_title text;
BEGIN
  SELECT user_id, title INTO owner_id, track_title FROM public.tracks WHERE id = NEW.track_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, message, related_id, data)
    VALUES (owner_id, 'song_like', 'New like', 'Someone liked your track "' || track_title || '".', NEW.track_id,
      jsonb_build_object('track_id', NEW.track_id, 'actor_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notify_track_like_after_insert ON public.liked_tracks;
CREATE TRIGGER notify_track_like_after_insert AFTER INSERT ON public.liked_tracks
FOR EACH ROW EXECUTE FUNCTION public.notify_track_like();

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, related_id, data)
  VALUES (NEW.following_id, 'follower', 'New follower', 'Someone started following you.', NEW.follower_id,
    jsonb_build_object('follower_id', NEW.follower_id));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS notify_new_follower_after_insert ON public.follows;
CREATE TRIGGER notify_new_follower_after_insert AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

CREATE OR REPLACE FUNCTION public.sync_profile_followers_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    RETURN NEW;
  END IF;
  UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = OLD.following_id;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS sync_profile_followers_after_insert ON public.follows;
DROP TRIGGER IF EXISTS sync_profile_followers_after_delete ON public.follows;
CREATE TRIGGER sync_profile_followers_after_insert AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_followers_count();
CREATE TRIGGER sync_profile_followers_after_delete AFTER DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_followers_count();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('audio', 'audio', true, 104857600, ARRAY['audio/mpeg','audio/mp4','audio/flac','audio/wav','audio/x-wav','audio/wave','audio/vnd.wave','application/octet-stream']),
  ('covers', 'covers', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('reels', 'reels', true, 104857600, ARRAY['video/mp4','video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN CREATE POLICY "Auralis audio is readable" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis audio upload by owner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis audio update by owner" ON storage.objects FOR UPDATE USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis audio delete by owner" ON storage.objects FOR DELETE USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis covers are readable" ON storage.objects FOR SELECT USING (bucket_id IN ('covers','avatars'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis covers upload by owner" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('covers','avatars') AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis covers update by owner" ON storage.objects FOR UPDATE USING (bucket_id IN ('covers','avatars') AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id IN ('covers','avatars') AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auralis covers delete by owner" ON storage.objects FOR DELETE USING (bucket_id IN ('covers','avatars') AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS play_history_track_played_user_idx ON public.play_history(track_id, played_at, user_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tracks_approved_play_count_idx ON public.tracks(is_approved, play_count DESC);
CREATE OR REPLACE FUNCTION public.get_artist_monthly_listeners(artist_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(DISTINCT h.user_id)
  FROM public.play_history h JOIN public.tracks t ON t.id = h.track_id
  WHERE t.user_id = artist_user_id AND t.is_approved IS TRUE
    AND h.played_at >= pg_catalog.now() - interval '30 days' AND h.user_id <> artist_user_id;
$$;
REVOKE ALL ON FUNCTION public.get_artist_monthly_listeners(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_monthly_listeners(uuid) TO anon, authenticated;

GRANT SELECT ON public.profiles, public.albums, public.tracks, public.playlists,
  public.playlist_tracks, public.follows, public.posts, public.post_likes,
  public.post_comments, public.comment_likes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.albums, public.tracks,
  public.playlists, public.playlist_tracks, public.liked_tracks, public.follows,
  public.play_history, public.notifications, public.posts, public.post_likes,
  public.post_comments, public.comment_likes, public.messages TO authenticated;
