import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signAddressPhotoUrl } from "./storageUrl";

async function fetchAvatarUrl(): Promise<string | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", uid)
    .single();
  if (!data?.avatar_url) return null;
  return await signAddressPhotoUrl(data.avatar_url);
}

export function useAvatarUrl() {
  return useQuery({
    queryKey: ["user-avatar-url"],
    queryFn: fetchAvatarUrl,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
