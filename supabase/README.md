Community chat setup

1) Run the SQL migration in your Supabase project (SQL editor or migrate):
   - `supabase/migrations/20250915_create_chats_table.sql`

2) Deploy the Edge Function `cleanup-chats` (located at `supabase/functions/cleanup-chats`) and set environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (use the service_role key)

3) Schedule the `cleanup-chats` function in Supabase to run every minute or every 5 minutes depending on your needs. The function deletes messages older than 1 hour.

Notes:
- The web client subscribes to `public.chats` table via Supabase Realtime (Postgres replication). Make sure Realtime and the `chats` table are enabled in your Supabase settings.
- The `service_role` key is sensitive; keep it out of client-side code.
