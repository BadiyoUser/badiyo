// Extract the most specific, human-readable message from any thrown value
// (including Supabase FunctionsHttpError, whose default message is just
// "Edge Function returned a non-2xx status code"). Always returns a string
// that starts with a capital letter.

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

async function readFunctionsErrorBody(err: unknown): Promise<string | null> {
  const ctx = (err as { context?: unknown })?.context;
  const res = ctx as Response | undefined;
  if (!res || typeof res.clone !== "function") return null;
  try {
    const text = await res.clone().text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      const msg = parsed?.error ?? parsed?.message ?? parsed?.error_description;
      if (typeof msg === "string" && msg.trim()) return msg.trim();
    } catch {
      if (text.trim()) return text.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getErrorMessage(err: unknown): Promise<string> {
  const bodyMsg = await readFunctionsErrorBody(err);
  if (bodyMsg) return capitalize(bodyMsg);
  if (err instanceof Error && err.message) return capitalize(err.message);
  if (typeof err === "string" && err) return capitalize(err);
  const anyMsg = (err as { message?: unknown })?.message;
  if (typeof anyMsg === "string" && anyMsg) return capitalize(anyMsg);
  return "Unknown error";
}
