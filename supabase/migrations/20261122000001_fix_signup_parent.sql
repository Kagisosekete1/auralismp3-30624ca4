CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.id::text || '@no-email.invalid'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, user_id, username, full_name, display_name, artist_name)
  VALUES (NEW.id, NEW.id,
    COALESCE(NULLIF(lower(NEW.raw_user_meta_data->>'username'), ''), lower(split_part(NEW.email, '@', 1)) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'artist_name')
  ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE
  SET display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
      artist_name = COALESCE(EXCLUDED.artist_name, public.profiles.artist_name);
  RETURN NEW;
END;
$$;
