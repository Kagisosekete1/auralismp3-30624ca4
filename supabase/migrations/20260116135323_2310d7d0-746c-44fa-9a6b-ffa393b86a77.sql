-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  artist_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  website TEXT,
  followers_count INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  is_artist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tracks table for uploaded music
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album TEXT,
  genre TEXT,
  secondary_genre TEXT,
  bpm INTEGER,
  key TEXT,
  duration INTEGER DEFAULT 0,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  video_reel_url TEXT,
  is_explicit BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  version TEXT DEFAULT 'original',
  mood_tags TEXT[],
  is_approved BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  gradient TEXT DEFAULT 'from-primary to-accent',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(playlist_id, track_id)
);

-- Create liked_tracks table
CREATE TABLE public.liked_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, track_id)
);

-- Create follows table for following artists
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tracks policies
CREATE POLICY "Approved tracks are viewable by everyone" ON public.tracks FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own tracks" ON public.tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tracks" ON public.tracks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tracks" ON public.tracks FOR DELETE USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Public playlists are viewable by everyone" ON public.playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Playlist tracks policies
CREATE POLICY "Playlist tracks viewable if playlist is accessible" ON public.playlist_tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can add tracks to own playlists" ON public.playlist_tracks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can remove tracks from own playlists" ON public.playlist_tracks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Liked tracks policies
CREATE POLICY "Users can view own liked tracks" ON public.liked_tracks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can like tracks" ON public.liked_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike tracks" ON public.liked_tracks FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Create storage buckets for audio files and covers
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true);

-- Storage policies for audio bucket
CREATE POLICY "Audio files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Users can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for covers bucket
CREATE POLICY "Covers are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own covers" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for reels bucket
CREATE POLICY "Reels are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Users can upload reels" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own reels" ON storage.objects FOR UPDATE USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own reels" ON storage.objects FOR DELETE USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();