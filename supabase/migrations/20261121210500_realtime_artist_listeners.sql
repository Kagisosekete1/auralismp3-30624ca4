CREATE TABLE IF NOT EXISTS public.artist_listener_activity (
  artist_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listener_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_listened_at timestamptz NOT NULL,
  last_listened_at timestamptz NOT NULL,
  returning_visit_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artist_user_id, listener_user_id),
  CHECK (artist_user_id <> listener_user_id)
);

CREATE INDEX IF NOT EXISTS artist_listener_activity_last_listened_idx
  ON public.artist_listener_activity (artist_user_id, last_listened_at DESC);

CREATE TABLE IF NOT EXISTS public.artist_listener_stats (
  artist_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_listeners bigint NOT NULL DEFAULT 0,
  returning_listeners bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_listener_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_listener_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artist listener totals are public" ON public.artist_listener_stats;
CREATE POLICY "Artist listener totals are public"
  ON public.artist_listener_stats FOR SELECT USING (true);

REVOKE ALL ON public.artist_listener_activity FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.artist_listener_stats FROM PUBLIC;
GRANT SELECT ON public.artist_listener_stats TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_artist_listener_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  track_artist uuid;
BEGIN
  SELECT track.user_id INTO track_artist
  FROM public.tracks AS track
  WHERE track.id = NEW.track_id
    AND track.is_approved IS TRUE;

  IF track_artist IS NULL OR track_artist = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.artist_listener_activity (
    artist_user_id, listener_user_id, first_listened_at, last_listened_at
  ) VALUES (
    track_artist, NEW.user_id, NEW.played_at, NEW.played_at
  )
  ON CONFLICT (artist_user_id, listener_user_id) DO UPDATE
  SET returning_visit_count = public.artist_listener_activity.returning_visit_count
        + CASE
            WHEN NEW.played_at >= public.artist_listener_activity.last_listened_at + interval '24 hours'
              THEN 1
            ELSE 0
          END,
      last_listened_at = GREATEST(public.artist_listener_activity.last_listened_at, NEW.played_at);

  INSERT INTO public.artist_listener_stats (
    artist_user_id, monthly_listeners, returning_listeners, updated_at
  )
  SELECT activity.artist_user_id,
         count(*) FILTER (WHERE activity.last_listened_at >= pg_catalog.now() - interval '30 days'),
         count(*) FILTER (
           WHERE activity.last_listened_at >= pg_catalog.now() - interval '30 days'
             AND activity.returning_visit_count > 0
         ),
         pg_catalog.now()
  FROM public.artist_listener_activity AS activity
  WHERE activity.artist_user_id = track_artist
  GROUP BY activity.artist_user_id
  ON CONFLICT (artist_user_id) DO UPDATE
  SET monthly_listeners = EXCLUDED.monthly_listeners,
      returning_listeners = EXCLUDED.returning_listeners,
      updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_artist_listener_activity_after_play ON public.play_history;
CREATE TRIGGER record_artist_listener_activity_after_play
AFTER INSERT ON public.play_history
FOR EACH ROW EXECUTE FUNCTION public.record_artist_listener_activity();

WITH ordered_plays AS (
  SELECT track.user_id AS artist_user_id,
         history.user_id AS listener_user_id,
         history.played_at,
         lag(history.played_at) OVER (
           PARTITION BY track.user_id, history.user_id ORDER BY history.played_at
         ) AS previous_play
  FROM public.play_history AS history
  JOIN public.tracks AS track ON track.id = history.track_id
  WHERE track.is_approved IS TRUE
    AND history.user_id <> track.user_id
), listener_totals AS (
  SELECT artist_user_id, listener_user_id,
         min(played_at) AS first_listened_at,
         max(played_at) AS last_listened_at,
         count(*) FILTER (
           WHERE previous_play IS NOT NULL
             AND played_at >= previous_play + interval '24 hours'
         )::integer AS returning_visit_count
  FROM ordered_plays
  GROUP BY artist_user_id, listener_user_id
)
INSERT INTO public.artist_listener_activity (
  artist_user_id, listener_user_id, first_listened_at, last_listened_at, returning_visit_count
)
SELECT artist_user_id, listener_user_id, first_listened_at, last_listened_at, returning_visit_count
FROM listener_totals
ON CONFLICT (artist_user_id, listener_user_id) DO UPDATE
SET first_listened_at = LEAST(public.artist_listener_activity.first_listened_at, EXCLUDED.first_listened_at),
    last_listened_at = GREATEST(public.artist_listener_activity.last_listened_at, EXCLUDED.last_listened_at),
    returning_visit_count = GREATEST(public.artist_listener_activity.returning_visit_count, EXCLUDED.returning_visit_count);

INSERT INTO public.artist_listener_stats (
  artist_user_id, monthly_listeners, returning_listeners, updated_at
)
SELECT activity.artist_user_id,
       count(*) FILTER (WHERE activity.last_listened_at >= pg_catalog.now() - interval '30 days'),
       count(*) FILTER (
         WHERE activity.last_listened_at >= pg_catalog.now() - interval '30 days'
           AND activity.returning_visit_count > 0
       ),
       pg_catalog.now()
FROM public.artist_listener_activity AS activity
GROUP BY activity.artist_user_id
ON CONFLICT (artist_user_id) DO UPDATE
SET monthly_listeners = EXCLUDED.monthly_listeners,
    returning_listeners = EXCLUDED.returning_listeners,
    updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.get_artist_monthly_listeners(artist_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)
  FROM public.artist_listener_activity AS activity
  WHERE activity.artist_user_id = $1
    AND activity.last_listened_at >= pg_catalog.now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.get_artist_returning_listeners(artist_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)
  FROM public.artist_listener_activity AS activity
  WHERE activity.artist_user_id = $1
    AND activity.last_listened_at >= pg_catalog.now() - interval '30 days'
    AND activity.returning_visit_count > 0;
$$;

REVOKE ALL ON FUNCTION public.get_artist_monthly_listeners(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_artist_returning_listeners(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_monthly_listeners(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_artist_returning_listeners(uuid) TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'artist_listener_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_listener_stats;
  END IF;
END;
$$;
