-- Create messages table for inbox/collaboration
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  release_type TEXT DEFAULT 'album',
  language TEXT,
  version TEXT DEFAULT 'original',
  description TEXT,
  is_compilation BOOLEAN DEFAULT false,
  has_cover_versions BOOLEAN DEFAULT false,
  primary_genre TEXT,
  secondary_genre TEXT,
  composition_copyright TEXT,
  recording_copyright TEXT,
  record_label TEXT,
  release_date DATE,
  pre_order_date DATE,
  sales_start_date DATE,
  is_explicit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add album_id to tracks
ALTER TABLE public.tracks ADD COLUMN album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;

-- Add image_url to posts for image sharing
ALTER TABLE public.posts ADD COLUMN image_url TEXT;

-- Add video_reel to profiles for 5 second reels
ALTER TABLE public.profiles ADD COLUMN short_reel_url TEXT;

-- Add subscription tier to profiles
ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';

-- Add is_artist flag to ensure it exists
-- (Already exists in schema)

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- RLS for messages
CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own sent messages" ON public.messages
FOR DELETE USING (auth.uid() = sender_id);

-- RLS for post_comments
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments
FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.post_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
FOR DELETE USING (auth.uid() = user_id);

-- RLS for post_likes
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
FOR DELETE USING (auth.uid() = user_id);

-- RLS for comment_likes
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON public.comment_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" ON public.comment_likes
FOR DELETE USING (auth.uid() = user_id);

-- RLS for albums
CREATE POLICY "Approved albums are viewable by everyone" ON public.albums
FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own albums" ON public.albums
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own albums" ON public.albums
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own albums" ON public.albums
FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;