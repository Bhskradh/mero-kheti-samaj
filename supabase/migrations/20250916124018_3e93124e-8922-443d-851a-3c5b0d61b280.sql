-- Enable RLS on both tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Add user_id column to tasks table for user-specific todos
ALTER TABLE public.tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS policies for chats table (public read, authenticated write with rate limiting)
CREATE POLICY "Anyone can view chat messages" 
ON public.chats 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.chats 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for tasks table (user-specific access only)
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for chats table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;