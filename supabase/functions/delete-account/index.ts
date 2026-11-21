import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Content-Type": "application/json" };
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, {});
  const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply(401, {});
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return reply(401, {});
    if ((await req.json()).confirm !== "DELETE") return reply(400, {});
    for (const name of ["audio", "avatars", "covers", "reels"]) {
      const bucket = admin.storage.from(name);
      async function clear(prefix: string) {
        while (true) {
          const { data, error } = await bucket.list(prefix, { limit: 100 });
          if (error) throw error;
          if (!data?.length) return;
          const files: string[] = [];
          for (const item of data) {
            if (!item.name || /[/\\]/.test(item.name) || [".",".."].includes(item.name)) throw Error("Invalid path");
            const path = prefix + "/" + item.name;
            if (item.id) files.push(path);
            else await clear(path);
          }
          if (files.length && (await bucket.remove(files)).error) throw Error("Storage deletion failed");
        }
      }
      await clear(user.id);
    }
    const result = await admin.auth.admin.deleteUser(user.id);
    if (result.error) throw result.error;
    return reply(200, { deleted: true });
  } catch {
    return reply(500, { deleted: false });
  }
});
