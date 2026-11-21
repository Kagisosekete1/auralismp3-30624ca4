CREATE INDEX IF NOT EXISTS play_history_track_played_user_idx
ON public.play_history (track_id, played_at, user_id);

CREATE OR REPLACE FUNCTION public.get_artist_monthly_listeners(artist_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(DISTINCT history.user_id)
  FROM public.play_history AS history
  JOIN public.tracks AS track ON track.id = history.track_id
  WHERE track.user_id = artist_user_id
    AND track.is_approved IS TRUE
    AND history.played_at >= pg_catalog.now() - interval '30 days'
    AND history.user_id <> artist_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_artist_monthly_listeners(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_artist_monthly_listeners(uuid) TO anon, authenticated;
