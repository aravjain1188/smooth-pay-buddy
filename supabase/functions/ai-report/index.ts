import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) return json(500, { error: "AI not configured" });
    if (!SUPABASE_URL || !SERVICE_ROLE) return json(500, { error: "Backend not configured" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData.user) return json(401, { error: "Invalid session" });
    const userId = userData.user.id;

    let body: any;
    try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

    const r = body?.run ?? body;
    if (!r || typeof r !== "object") return json(400, { error: "Missing run data" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, reports_used")
      .eq("user_id", userId)
      .maybeSingle();

    const used = profile?.reports_used ?? 0;
    if (used >= 1 && !profile?.is_pro) {
      return json(402, { error: "Upgrade to Pro for more reports" });
    }

    const choices = Array.isArray(r.choices)
      ? r.choices
      : Array.isArray(r.history)
        ? r.history.map((h: any) => ({ scenario: h.scenario, choice: h.choice }))
        : [];

    const summary = `Specialization: ${r.specialization ?? "generic"}. Mode: ${r.mode ?? "easy"}. Months survived: ${r.months ?? 0}/${r.totalMonths ?? "?"}. Final cash: ₹${r.cash ?? 0}. Users: ${r.users ?? "?"}. Score: ${r.score ?? 0}. Bankrupt: ${!!r.bankrupt}. Choices: ${choices.map((c: any) => `${c.scenario} -> ${c.choice}`).join("; ")}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a brutally honest startup post-mortem coach. Output 4 short markdown sections: ## What you nailed, ## Where you fumbled, ## Pattern across decisions, ## Next-run playbook. Keep total under 250 words.",
          },
          { role: "user", content: summary },
        ],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) return json(429, { error: "AI rate limit hit. Try again in a moment." });
      if (aiRes.status === 402) return json(402, { error: "AI credits exhausted. Add credits in Lovable Cloud." });
      return json(502, { error: `AI gateway error (${aiRes.status})` });
    }

    const aiJson = await aiRes.json();
    const report = aiJson?.choices?.[0]?.message?.content;
    if (!report) return json(502, { error: "AI returned empty response" });

    // Use service role to bypass the protect_profile_fields trigger
    await supabase.from("profiles").update({ reports_used: used + 1 }).eq("user_id", userId);

    return json(200, { report });
  } catch (e) {
    console.error("ai-report error:", e);
    return json(500, { error: String((e as Error).message || e) });
  }
});
