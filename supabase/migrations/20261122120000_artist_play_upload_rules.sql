-- Keep play and like totals atomic and let artist-only album rules be enforced server-side.

CREATE OR REPLACE FUNCTION public.increment_track_play_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  track_owner uuid;
BEGIN
  UPDATE public.tracks
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = NEW.track_id
  RETURNING user_id INTO track_owner;

  IF track_owner IS NOT NULL THEN
    UPDATE public.profiles
    SET total_plays = COALESCE(total_plays, 0) + 1
    WHERE user_id = track_owner;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_track_play_totals_after_insert ON public.play_history;
CREATE TRIGGER increment_track_play_totals_after_insert
AFTER INSERT ON public.play_history
FOR EACH ROW EXECUTE FUNCTION public.increment_track_play_totals();

CREATE OR REPLACE FUNCTION public.sync_track_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tracks SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.track_id;
    RETURN NEW;
  END IF;
  UPDATE public.tracks SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = OLD.track_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sync_track_like_count_after_insert ON public.liked_tracks;
DROP TRIGGER IF EXISTS sync_track_like_count_after_delete ON public.liked_tracks;
CREATE TRIGGER sync_track_like_count_after_insert AFTER INSERT ON public.liked_tracks
FOR EACH ROW EXECUTE FUNCTION public.sync_track_like_count();
CREATE TRIGGER sync_track_like_count_after_delete AFTER DELETE ON public.liked_tracks
FOR EACH ROW EXECUTE FUNCTION public.sync_track_like_count();

UPDATE public.tracks AS track
SET play_count = (SELECT count(*) FROM public.play_history history WHERE history.track_id = track.id),
    like_count = (SELECT count(*) FROM public.liked_tracks liked WHERE liked.track_id = track.id);

UPDATE public.profiles AS profile
SET total_plays = (
  SELECT COALESCE(sum(track.play_count), 0)::bigint
  FROM public.tracks AS track
  WHERE track.user_id = profile.user_id
);

CREATE OR REPLACE FUNCTION public.enforce_artist_upload_rights()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  artist_enabled boolean;
  plan text;
BEGIN
  SELECT COALESCE(profile.is_artist, false), lower(COALESCE(profile.subscription_tier, 'free'))
  INTO artist_enabled, plan
  FROM public.profiles AS profile
  WHERE profile.user_id = NEW.user_id;

  IF NOT COALESCE(artist_enabled, false) THEN
    RAISE EXCEPTION 'Music uploads are available to artist accounts only.' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'albums' THEN
    IF lower(COALESCE(NEW.release_type, '')) = 'album'
       AND COALESCE(plan, 'free') NOT IN ('pro', 'artist') THEN
      RAISE EXCEPTION 'Full album uploads require an artist Premium plan.' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_artist_album_upload ON public.albums;
CREATE TRIGGER enforce_artist_album_upload
BEFORE INSERT OR UPDATE OF user_id, release_type ON public.albums
FOR EACH ROW EXECUTE FUNCTION public.enforce_artist_upload_rights();

DROP TRIGGER IF EXISTS enforce_artist_track_upload ON public.tracks;
CREATE TRIGGER enforce_artist_track_upload
BEFORE INSERT OR UPDATE OF user_id, album_id ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.enforce_artist_upload_rights();

DROP POLICY IF EXISTS "Users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
DROP POLICY IF EXISTS "Auralis audio upload by owner" ON storage.objects;
DROP POLICY IF EXISTS "Auralis audio update by owner" ON storage.objects;
DROP POLICY IF EXISTS "Auralis audio delete by owner" ON storage.objects;
CREATE POLICY "Auralis audio upload by artist" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE));
CREATE POLICY "Auralis audio update by artist" ON storage.objects FOR UPDATE
USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE))
WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE));
CREATE POLICY "Auralis audio delete by artist" ON storage.objects FOR DELETE
USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE));

DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own covers" ON storage.objects;
DROP POLICY IF EXISTS "Auralis covers upload by owner" ON storage.objects;
DROP POLICY IF EXISTS "Auralis covers update by owner" ON storage.objects;
DROP POLICY IF EXISTS "Auralis covers delete by owner" ON storage.objects;
CREATE POLICY "Auralis covers upload by owner" ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('covers', 'avatars') AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (bucket_id = 'avatars' OR EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE)));
CREATE POLICY "Auralis covers update by owner" ON storage.objects FOR UPDATE
USING (bucket_id IN ('covers', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text
  AND (bucket_id = 'avatars' OR EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE)))
WITH CHECK (bucket_id IN ('covers', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text
  AND (bucket_id = 'avatars' OR EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE)));
CREATE POLICY "Auralis covers delete by owner" ON storage.objects FOR DELETE
USING (bucket_id IN ('covers', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text
  AND (bucket_id = 'avatars' OR EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.user_id = auth.uid() AND profile.is_artist IS TRUE)));

CREATE OR REPLACE FUNCTION public.notify_post_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  post_owner uuid;
  actor_name text;
  post_id uuid;
  event_type text;
  event_title text;
  event_message text;
BEGIN
  IF TG_TABLE_NAME = 'post_likes' THEN
    post_id := NEW.post_id;
    event_type := 'post_like';
    event_title := 'Post liked';
    event_message := ' liked your post.';
  ELSE
    post_id := NEW.post_id;
    event_type := 'post_comment';
    event_title := 'New comment';
    event_message := ' commented on your post.';
  END IF;

  SELECT post.user_id INTO post_owner FROM public.posts AS post WHERE post.id = post_id;
  SELECT COALESCE(profile.display_name, 'Someone') INTO actor_name
  FROM public.profiles AS profile WHERE profile.user_id = NEW.user_id;

  IF post_owner IS NOT NULL AND post_owner <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, message, related_id, data)
    VALUES (post_owner, event_type, event_title, actor_name || ' ' || lower(event_message), post_id,
      pg_catalog.jsonb_build_object('post_id', post_id, 'actor_id', NEW.user_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_post_like_after_insert ON public.post_likes;
CREATE TRIGGER notify_post_like_after_insert AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_post_activity();
DROP TRIGGER IF EXISTS notify_post_comment_after_insert ON public.post_comments;
CREATE TRIGGER notify_post_comment_after_insert AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_activity();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'liked_tracks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.liked_tracks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tracks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'play_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.play_history;
  END IF;
END;
$$;
