import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) return json(401, { error: "Unauthorized" });
    const userId = userData.user.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(400, { error: "Missing fields" });
    }

    const expected = createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("Signature mismatch");
      return json(400, { error: "Invalid signature" });
    }

    await supabase
      .from("payments")
      .update({ status: "paid", razorpay_payment_id })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, coins")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile && !profile.is_pro) {
      // Use service role to bypass the protect_profile_fields trigger
      // (the trigger only fires for the 'authenticated' role).
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          coins: (profile.coins || 0) + 200,
        })
        .eq("user_id", userId);
    }

    return json(200, { success: true, pro: true });
  } catch (e) {
    console.error("verify error:", e);
    return json(500, { error: String((e as Error).message || e) });
  }
});
