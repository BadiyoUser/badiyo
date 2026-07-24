import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a row exists in public.users for the currently authenticated user.
 * Safe to call multiple times; upserts on id conflict.
 * Returns the auth user id, or null if there is no session.
 */
export async function ensureUserRow(phone?: string | null): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return null;

  const payload: { id: string; phone?: string } = { id: uid };
  if (phone) payload.phone = phone;

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false });
  if (error) {
    console.error("ensureUserRow failed:", error);
    throw error;
  }
  return uid;
}
