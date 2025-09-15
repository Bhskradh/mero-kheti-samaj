-- Create `tasks` table for farmer to-do items and scheduled reminders
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text,
  title text NOT NULL,
  details text,
  due_at timestamptz,
  remind_before integer DEFAULT 0, -- seconds before due_at to trigger reminder
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks (due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks (completed);
