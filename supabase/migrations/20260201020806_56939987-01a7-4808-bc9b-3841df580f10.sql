-- Fix the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can receive notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);