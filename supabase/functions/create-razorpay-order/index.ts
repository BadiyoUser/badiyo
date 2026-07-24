// Supabase Edge Function: create-razorpay-order
// Looks up the authoritative price from service_catalogue_config using
// service_duration_minutes sent by the client. NEVER trusts a client-supplied amount.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({ error: "Razorpay keys are not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const durationMinutes = Number(body?.service_duration_minutes);
    const currency = typeof body?.currency === "string" ? body.currency : "INR";
    const receipt = typeof body?.receipt === "string" ? body.receipt : `rcpt_${Date.now()}`;

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return json({ error: "service_duration_minutes is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: svc, error: svcErr } = await supabase
      .from("service_catalogue_config")
      .select("price")
      .eq("duration_minutes", durationMinutes)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (svcErr || !svc) {
      return json({ error: "Service not available" }, 400);
    }

    const amount = Math.round(Number(svc.price) * 100);
    if (!Number.isInteger(amount) || amount < 100) {
      return json({ error: "Invalid service price" }, 500);
    }

    const auth = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency, receipt }),
    });

    const text = await rzpRes.text();
    if (!rzpRes.ok) {
      console.error("Razorpay order create failed", rzpRes.status, text);
      return json({ error: "Failed to create Razorpay order", details: text }, 502);
    }

    const order = JSON.parse(text);
    return json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (err) {
    console.error("create-razorpay-order error", err);
    return json({ error: (err as Error).message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
