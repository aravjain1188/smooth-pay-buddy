import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRO_AMOUNT = 4900; // ₹49.00 in paise

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KEY_ID = (Deno.env.get("RAZORPAY_KEY_ID") || "").trim();
    const KEY_SECRET = (Deno.env.get("RAZORPAY_KEY_SECRET") || "").trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!KEY_ID || !KEY_SECRET) {
      console.error("Razorpay keys missing");
      return json(500, { error: "Razorpay keys not configured." });
    }
    if (!KEY_ID.startsWith("rzp_")) {
      return json(500, { error: "Razorpay key format invalid (must start with rzp_test_ or rzp_live_)." });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "Invalid session" });
    const userId = userData.user.id;

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PRO_AMOUNT,
        currency: "INR",
        receipt: `pro_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: userId, product: "founders_gauntlet_pro" },
      }),
    });

    const orderText = await orderRes.text();
    let order: any;
    try { order = JSON.parse(orderText); } catch { order = { raw: orderText }; }

    if (!orderRes.ok) {
      console.error("Razorpay order error", orderRes.status, orderText.slice(0, 500));
      const desc = order?.error?.description || `Razorpay rejected order (HTTP ${orderRes.status}). ` +
        (orderRes.status === 401 ? "Check RAZORPAY_KEY_ID/SECRET in secrets." : "");
      return json(500, { error: desc });
    }

    await supabase.from("payments").insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount: PRO_AMOUNT,
      currency: "INR",
      status: "created",
    });

    return json(200, {
      order_id: order.id,
      amount: PRO_AMOUNT,
      currency: "INR",
      key_id: KEY_ID,
    });
  } catch (e) {
    console.error("create-order error:", e);
    return json(500, { error: String((e as Error).message || e) });
  }
});
