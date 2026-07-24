import { supabase } from "@/integrations/supabase/client";

export const APP_VERSION = "1.0.0";

function parse(v: string) {
  return v
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

/** Returns true if `current` is lower than `min`. */
export function isBelow(current: string, min: string) {
  const c = parse(current);
  const m = parse(min);
  const len = Math.max(c.length, m.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false;
}

export async function fetchMinSupportedVersion(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("min_supported_version")
      .eq("id", 1)
      .maybeSingle();
    if (error) return null;
    return data?.min_supported_version ?? null;
  } catch {
    return null;
  }
}
