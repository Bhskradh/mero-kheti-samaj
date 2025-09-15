-- Create `chats` table to store temporary messages
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text,
  message text,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

-- Index to speed up deletion/selecting by time
CREATE INDEX IF NOT EXISTS idx_chats_inserted_at ON public.chats (inserted_at);