import { supabase } from "@/integrations/supabase/client";

const BUCKET = "address-photos";
const SIGN_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Extract the object path within the address-photos bucket from a stored URL.
 * Supports both legacy public URLs (`/object/public/address-photos/<path>`)
 * and already-signed URLs (`/object/sign/address-photos/<path>?token=...`).
 * Returns null if the URL doesn't reference this bucket.
 */
export function extractAddressPhotoPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const tail = url.slice(idx + marker.length);
  const path = tail.split("?")[0];
  return path || null;
}

/**
 * Convert a stored address-photos URL into a short-lived signed URL the
 * private bucket will actually serve. Returns the original URL as a fallback
 * (e.g. for non-bucket URLs) so callers can render something.
 */
export async function signAddressPhotoUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const path = extractAddressPhotoPath(url);
  if (!path) return url;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
