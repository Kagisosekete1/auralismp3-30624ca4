import { supabase } from "@/integrations/supabase/client";

export async function dispatchPushNotification(
  type: "song_like" | "follower",
  actorId: string,
  relatedId: string,
) {
  const actorField = type === "song_like" ? "actor_id" : "follower_id";
  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("type", type)
    .eq("related_id", relatedId)
    .contains("data", { [actorField]: actorId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !notification) return;
  await supabase.functions.invoke("send-onesignal", {
    body: { notificationId: notification.id },
  });
}
