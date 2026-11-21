-- Persist listener/creator account type and allow an authenticated user to
-- explicitly finish creator onboarding for an existing account.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_role text NOT NULL DEFAULT 'listener';

UPDATE public.profiles
SET creator_role = CASE
  WHEN is_artist IS TRUE AND lower(COALESCE(creator_role, 'listener')) = 'listener' THEN 'artist'
  ELSE lower(COALESCE(creator_role, 'listener'))
END;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_role text := lower(COALESCE(NEW.raw_user_meta_data ->> 'creator_role', 'listener'));
  selected_artist boolean;
BEGIN
  IF selected_role NOT IN ('listener', 'artist', 'dj', 'producer') THEN
    selected_role := 'listener';
  END IF;
  selected_artist := selected_role <> 'listener';

  INSERT INTO public.users (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.id::text || '@no-email.invalid'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (
    id, user_id, username, full_name, display_name, artist_name, is_artist, creator_role
  ) VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NULLIF(lower(NEW.raw_user_meta_data ->> 'username'), ''), lower(split_part(NEW.email, '@', 1)) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name'),
    CASE WHEN selected_artist THEN COALESCE(NEW.raw_user_meta_data ->> 'artist_name', NEW.raw_user_meta_data ->> 'display_name') END,
    selected_artist,
    selected_role
  )
  ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    artist_name = COALESCE(EXCLUDED.artist_name, public.profiles.artist_name),
    is_artist = EXCLUDED.is_artist,
    creator_role = EXCLUDED.creator_role;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_auralis_creator(p_artist_name text, p_creator_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  normalized_role text := lower(trim(COALESCE(p_creator_role, '')));
  current_email text;
  current_display_name text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in before creating an artist profile.' USING ERRCODE = '42501';
  END IF;
  IF normalized_role NOT IN ('artist', 'dj', 'producer') THEN
    RAISE EXCEPTION 'Choose Artist, DJ, or Producer.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(COALESCE(p_artist_name, ''))) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'Enter a public artist name between 1 and 80 characters.' USING ERRCODE = '22023';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name')
    INTO current_email, current_display_name
  FROM auth.users WHERE id = current_user_id;

  INSERT INTO public.profiles (
    id, user_id, username, full_name, display_name, artist_name, is_artist, creator_role
  ) VALUES (
    current_user_id,
    current_user_id,
    COALESCE(NULLIF(lower(split_part(current_email, '@', 1)), ''), 'auralis') || '_' || substr(replace(current_user_id::text, '-', ''), 1, 8),
    current_display_name,
    COALESCE(current_display_name, trim(p_artist_name)),
    trim(p_artist_name),
    true,
    normalized_role
  )
  ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
    artist_name = EXCLUDED.artist_name,
    is_artist = true,
    creator_role = EXCLUDED.creator_role;
END;
$$;

REVOKE ALL ON FUNCTION public.register_auralis_creator(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_auralis_creator(text, text) TO authenticated;
