-- Count a stream only after ordered server-observed playback progress reaches 30 seconds.
-- Old tap-to-play rows remain available, but are excluded from validated stream metrics.
ALTER TABLE public.play_history
  ADD COLUMN IF NOT EXISTS is_validated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS play_history_session_unique
  ON public.play_history (session_id) WHERE session_id IS NOT NULL;

ALTER TABLE public.artist_listener_activity
  ADD COLUMN IF NOT EXISTS is_validated boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.playback_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz NOT NULL DEFAULT now(),
  last_position_seconds numeric NOT NULL DEFAULT 0,
  active_seconds numeric NOT NULL DEFAULT 0,
  last_event_sequence integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  counted_at timestamptz,
  suspicious_events integer NOT NULL DEFAULT 0
);

ALTER TABLE public.playback_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.playback_sessions FROM PUBLIC, anon, authenticated;

-- Preserve legacy tap rows while preventing them from inflating streams and listeners.
UPDATE public.play_history SET is_validated = false WHERE is_validated IS DISTINCT FROM false;
UPDATE public.artist_listener_activity SET is_validated = false WHERE is_validated IS DISTINCT FROM false;

CREATE OR REPLACE FUNCTION public.increment_track_play_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE track_owner uuid;
BEGIN
  IF NEW.is_validated IS NOT TRUE THEN RETURN NEW; END IF;
  UPDATE public.tracks SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = NEW.track_id RETURNING user_id INTO track_owner;
  IF track_owner IS NOT NULL THEN
    UPDATE public.profiles SET total_plays = COALESCE(total_plays, 0) + 1 WHERE user_id = track_owner;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_artist_listener_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE track_artist uuid;
BEGIN
  IF NEW.is_validated IS NOT TRUE THEN RETURN NEW; END IF;
  SELECT track.user_id INTO track_artist FROM public.tracks AS track
  WHERE track.id = NEW.track_id AND track.is_approved IS TRUE;
  IF track_artist IS NULL OR track_artist = NEW.user_id THEN RETURN NEW; END IF;

  INSERT INTO public.artist_listener_activity (
    artist_user_id, listener_user_id, first_listened_at, last_listened_at,
    returning_visit_count, is_validated
  ) VALUES (track_artist, NEW.user_id, NEW.played_at, NEW.played_at, 0, true)
  ON CONFLICT (artist_user_id, listener_user_id) DO UPDATE SET
    returning_visit_count = CASE
      WHEN public.artist_listener_activity.is_validated THEN
        public.artist_listener_activity.returning_visit_count + CASE
          WHEN NEW.played_at >= public.artist_listener_activity.last_listened_at + interval '24 hours' THEN 1 ELSE 0 END
      ELSE 0
    END,
    is_validated = true,
    last_listened_at = GREATEST(public.artist_listener_activity.last_listened_at, NEW.played_at);

  INSERT INTO public.artist_listener_stats (artist_user_id, monthly_listeners, returning_listeners, updated_at)
  SELECT activity.artist_user_id,
         count(*) FILTER (WHERE activity.is_validated AND activity.last_listened_at >= pg_catalog.now() - interval '30 days'),
         count(*) FILTER (WHERE activity.is_validated AND activity.last_listened_at >= pg_catalog.now() - interval '30 days' AND activity.returning_visit_count > 0),
         pg_catalog.now()
  FROM public.artist_listener_activity AS activity
  WHERE activity.artist_user_id = track_artist
  GROUP BY activity.artist_user_id
  ON CONFLICT (artist_user_id) DO UPDATE SET
    monthly_listeners = EXCLUDED.monthly_listeners,
    returning_listeners = EXCLUDED.returning_listeners,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_track_play_totals_after_insert ON public.play_history;
CREATE TRIGGER increment_track_play_totals_after_insert
AFTER INSERT ON public.play_history
FOR EACH ROW EXECUTE FUNCTION public.increment_track_play_totals();

DROP TRIGGER IF EXISTS record_artist_listener_activity_after_play ON public.play_history;
CREATE TRIGGER record_artist_listener_activity_after_play
AFTER INSERT ON public.play_history
FOR EACH ROW EXECUTE FUNCTION public.record_artist_listener_activity();

CREATE OR REPLACE FUNCTION public.get_artist_monthly_listeners(artist_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*) FROM public.artist_listener_activity activity
  WHERE activity.artist_user_id = $1 AND activity.is_validated
    AND activity.last_listened_at >= pg_catalog.now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.get_artist_returning_listeners(artist_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*) FROM public.artist_listener_activity activity
  WHERE activity.artist_user_id = $1 AND activity.is_validated
    AND activity.last_listened_at >= pg_catalog.now() - interval '30 days'
    AND activity.returning_visit_count > 0;
$$;

UPDATE public.tracks track
SET play_count = (SELECT count(*) FROM public.play_history history WHERE history.track_id = track.id AND history.is_validated);
UPDATE public.profiles profile
SET total_plays = (SELECT COALESCE(sum(track.play_count), 0) FROM public.tracks track WHERE track.user_id = profile.user_id);
UPDATE public.artist_listener_stats stats
SET monthly_listeners = (SELECT count(*) FROM public.artist_listener_activity activity WHERE activity.artist_user_id = stats.artist_user_id AND activity.is_validated AND activity.last_listened_at >= now() - interval '30 days'),
    returning_listeners = (SELECT count(*) FROM public.artist_listener_activity activity WHERE activity.artist_user_id = stats.artist_user_id AND activity.is_validated AND activity.last_listened_at >= now() - interval '30 days' AND activity.returning_visit_count > 0),
    updated_at = now();

CREATE OR REPLACE FUNCTION public.start_auralis_playback(p_track_id uuid, p_position_seconds numeric DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE session_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501'; END IF;
  IF p_position_seconds < 0 OR p_position_seconds > 86400 THEN RAISE EXCEPTION 'Invalid playback position.' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tracks WHERE id = p_track_id AND is_approved IS TRUE) THEN
    RAISE EXCEPTION 'Track is not available for playback.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.playback_sessions (user_id, track_id, last_position_seconds)
  VALUES (auth.uid(), p_track_id, p_position_seconds) RETURNING id INTO session_id;
  RETURN session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_auralis_playback_event(
  p_session_id uuid, p_sequence integer, p_event_type text, p_position_seconds numeric
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  session public.playback_sessions%ROWTYPE;
  event_elapsed numeric;
  position_delta numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501'; END IF;
  IF p_event_type NOT IN ('heartbeat', 'pause', 'resume', 'seek') THEN RAISE EXCEPTION 'Invalid playback event.' USING ERRCODE = '22023'; END IF;
  IF p_sequence < 1 OR p_position_seconds < 0 OR p_position_seconds > 86400 THEN RAISE EXCEPTION 'Invalid playback event data.' USING ERRCODE = '22023'; END IF;

  SELECT * INTO session FROM public.playback_sessions
  WHERE id = p_session_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Playback session not found.' USING ERRCODE = 'P0002'; END IF;
  IF session.counted_at IS NOT NULL THEN RETURN true; END IF;
  IF p_sequence <= session.last_event_sequence THEN RETURN false; END IF;

  event_elapsed := GREATEST(0, EXTRACT(EPOCH FROM (pg_catalog.clock_timestamp() - session.last_event_at))::numeric);
  position_delta := p_position_seconds - session.last_position_seconds;
  IF p_event_type IN ('heartbeat', 'pause') AND session.is_active THEN
    IF position_delta >= 0 AND position_delta <= event_elapsed + 1.5 THEN
      UPDATE public.playback_sessions SET active_seconds = active_seconds + LEAST(position_delta, event_elapsed, 8) WHERE id = session.id;
    ELSIF position_delta > event_elapsed + 1.5 THEN
      UPDATE public.playback_sessions SET suspicious_events = suspicious_events + 1 WHERE id = session.id;
    END IF;
  END IF;

  UPDATE public.playback_sessions
  SET last_event_at = pg_catalog.clock_timestamp(),
      last_position_seconds = p_position_seconds,
      last_event_sequence = p_sequence,
      is_active = CASE p_event_type WHEN 'pause' THEN false WHEN 'resume' THEN true ELSE is_active END
  WHERE id = session.id;

  SELECT * INTO session FROM public.playback_sessions WHERE id = p_session_id;
  IF session.active_seconds >= 30 AND session.counted_at IS NULL THEN
    INSERT INTO public.play_history (user_id, track_id, played_at, is_validated, session_id)
    VALUES (session.user_id, session.track_id, pg_catalog.now(), true, session.id)
    ON CONFLICT (session_id) WHERE session_id IS NOT NULL DO NOTHING;
    UPDATE public.playback_sessions SET counted_at = pg_catalog.now() WHERE id = session.id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.start_auralis_playback(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_auralis_playback_event(uuid, integer, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_auralis_playback(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_auralis_playback_event(uuid, integer, text, numeric) TO authenticated;

DROP POLICY IF EXISTS "Users can add to own history" ON public.play_history;
DROP POLICY IF EXISTS "Users manage own play history" ON public.play_history;
DROP POLICY IF EXISTS "Users can view own history" ON public.play_history;
CREATE POLICY "Users can view own history" ON public.play_history FOR SELECT USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE ON public.play_history FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_artist_monthly_listeners(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_artist_returning_listeners(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_monthly_listeners(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_artist_returning_listeners(uuid) TO anon, authenticated;
