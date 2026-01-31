-- Add isrc_code column to tracks table for automatic ISRC generation
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS isrc_code TEXT UNIQUE;

-- Create index for faster ISRC lookups
CREATE INDEX IF NOT EXISTS idx_tracks_isrc_code ON public.tracks(isrc_code);

-- Add video_reel_url column if not exists (for 5-second video reels)
-- This column should already exist based on types.ts, but ensuring it's there
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'video_reel_url') THEN
    ALTER TABLE public.tracks ADD COLUMN video_reel_url TEXT;
  END IF;
END $$;