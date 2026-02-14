-- Enable realtime for tracks table so play counts update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;