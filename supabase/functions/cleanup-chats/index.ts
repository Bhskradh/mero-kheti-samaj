import { createClient } from "@supabase/supabase-js";

// Local TS shim: declare `Deno` for editor/typecheck. At runtime (Supabase Edge)
// `Deno.env` will be available.
declare const Deno: any;

const SUPABASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get("SUPABASE_URL") : process.env.SUPABASE_URL) || "";
const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") : process.env.SUPABASE_SERVICE_ROLE_KEY) || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function handler(req: Request): Promise<Response> {
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .lt('inserted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Cleanup error', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500 });
  }
}
