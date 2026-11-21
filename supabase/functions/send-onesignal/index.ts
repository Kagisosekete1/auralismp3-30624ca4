import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const oneSignalKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  const oneSignalAppId = "efed6504-844a-420e-b7fe-8ac86feb8b11";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!authorization || !serviceRoleKey || !oneSignalKey || !oneSignalAppId || !supabaseUrl) {
    return Response.json({ error: "Server configuration is incomplete" }, { status: 500, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  let notificationId: string;
  let messageId: string;
  try {
    ({ notificationId, messageId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders });
  }
  if (messageId) {
    const { data: message, error } = await admin.from("messages")
      .select("id,sender_id,recipient_id").eq("id", messageId).maybeSingle();
    if (error || !message) return Response.json({ error: "Message not found" }, { status: 404, headers: corsHeaders });
    if (message.sender_id !== authData.user.id || message.sender_id === message.recipient_id) {
      return Response.json({ error: "Not allowed" }, { status: 403, headers: corsHeaders });
    }
    try {
      const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: { Authorization: `Key ${oneSignalKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: oneSignalAppId,
          idempotency_key: message.id,
          include_aliases: { external_id: [message.recipient_id] },
          target_channel: "push",
          headings: { en: "Auralis" },
          contents: { en: "You have a new message" },
          data: { type: "message", messageId: message.id, senderId: message.sender_id },
        }),
      });
      if (!response.ok) return Response.json({ error: "OneSignal rejected the notification" }, { status: 502, headers: corsHeaders });
      return Response.json({ sent: true }, { headers: corsHeaders });
    } catch {
      return Response.json({ error: "Could not reach OneSignal" }, { status: 502, headers: corsHeaders });
    }
  }
  if (!notificationId) return Response.json({ error: "notificationId is required" }, { status: 400, headers: corsHeaders });

  const { data: notification, error: lookupError } = await admin
    .from("notifications")
    .select("id,user_id,type,title,message,data,push_sent_at")
    .eq("id", notificationId)
    .maybeSingle();
  if (lookupError || !notification) return Response.json({ error: "Notification not found" }, { status: 404, headers: corsHeaders });

  const actorId = notification.data?.actor_id ?? notification.data?.follower_id;
  if (actorId !== authData.user.id || !["song_like", "follower"].includes(notification.type)) {
    return Response.json({ error: "Not allowed to send this notification" }, { status: 403, headers: corsHeaders });
  }

  const { data: claimed, error: claimError } = await admin
    .from("notifications")
    .update({ push_sent_at: new Date().toISOString() })
    .eq("id", notification.id)
    .is("push_sent_at", null)
    .select("id")
    .maybeSingle();
  if (claimError) return Response.json({ error: "Could not claim notification" }, { status: 500, headers: corsHeaders });
  if (!claimed) return Response.json({ sent: false, duplicate: true }, { headers: corsHeaders });

  let pushResponse: Response;
  try {
    pushResponse = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { Authorization: `Key ${oneSignalKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_aliases: { external_id: [notification.user_id] },
        target_channel: "push",
        headings: { en: notification.title },
        contents: { en: notification.message },
        data: { notificationId: notification.id, type: notification.type, ...notification.data },
      }),
    });
  } catch {
    await admin.from("notifications").update({ push_sent_at: null }).eq("id", notification.id);
    return Response.json({ error: "Could not reach OneSignal" }, { status: 502, headers: corsHeaders });
  }
  if (!pushResponse.ok) {
    await admin.from("notifications").update({ push_sent_at: null }).eq("id", notification.id);
    return Response.json({ error: "OneSignal rejected the notification" }, { status: 502, headers: corsHeaders });
  }
  return Response.json({ sent: true }, { headers: corsHeaders });
});
