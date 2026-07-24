// Supabase Edge Function: verify-otp
// Verifies the OTP, creates/updates the auth user (phone), and returns a session.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, code } = await req.json().catch(() => ({}));
    const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
    const codeStr = String(code ?? "").trim();
    if (digits.length !== 10 || !/^\d{4}$/.test(codeStr)) {
      return json({ error: "Invalid phone or code" }, 400);
    }
    const fullPhone = `+91${digits}`;

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, serviceKey);

    // Find latest matching unverified, unexpired OTP.
    const { data: rows, error: qErr } = await admin
      .from("otp_codes")
      .select("id, code, expires_at, is_verified")
      .eq("phone", fullPhone)
      .eq("is_verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);
    if (qErr) {
      console.error("otp lookup failed", qErr);
      return json({ error: "Verification failed" }, 500);
    }
    const row = rows?.[0];
    if (!row || row.code !== codeStr) {
      return json({ error: "Invalid or expired code" }, 400);
    }

    // Mark verified (single-use).
    await admin.from("otp_codes").update({ is_verified: true }).eq("id", row.id);

    // Find or create auth user by phone. Supabase stores phone WITHOUT leading '+'.
    const bareNumber = `91${digits}`;
    const { data: existingId } = await admin.rpc("get_auth_user_id_by_phone", {
      _phone: bareNumber,
    });

    const password = crypto.randomUUID() + crypto.randomUUID();

    if (existingId) {
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existingId as string,
        { password },
      );
      if (updErr) {
        console.error("updateUserById failed", updErr);
        return json({ error: "Could not sign in" }, 500);
      }
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        phone: fullPhone,
        phone_confirm: true,
        password,
      });
      if (createErr) {
        console.error("createUser failed", createErr);
        return json({ error: "Could not create account" }, 500);
      }
    }

    // Sign in with the freshly-set password to mint a session.
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
      phone: fullPhone,
      password,
    });
    if (signErr || !signIn.session) {
      console.error("signInWithPassword failed", signErr);
      return json({ error: "Could not sign in" }, 500);
    }

    return json({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    });
  } catch (err) {
    console.error("verify-otp error", err);
    return json({ error: (err as Error).message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
