-- Harden Auralis upload storage.
-- This migration is safe to run after the original bucket migration: it
-- creates the buckets when missing and tightens existing bucket settings.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'audio',
    'audio',
    true,
    104857600,
    ARRAY[
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/x-flac',
      'audio/wav',
      'audio/x-wav',
      'audio/vnd.wave'
    ]::text[]
  ),
  (
    'covers',
    'covers',
    true,
    10485760,
    ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Audio files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

CREATE POLICY "Audio files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Users can upload audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('mp3', 'flac', 'wav')
);

CREATE POLICY "Users can update own audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('mp3', 'flac', 'wav')
);

CREATE POLICY "Users can delete own audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Covers are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own covers" ON storage.objects;

CREATE POLICY "Covers are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Users can update own covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Users can delete own covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
