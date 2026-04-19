import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Check, Loader2 } from "lucide-react";

declare global { interface Window { Razorpay: any } }

export default function Pro() {
  const { user, profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const waitForRazorpay = async (timeoutMs = 8000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.Razorpay) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  };

  const upgrade = async () => {
    if (!user) { nav("/auth"); return; }
    if (profile?.is_pro) { toast.success("You're already Pro!"); return; }
    setLoading(true);
    try {
      const ready = await waitForRazorpay();
      if (!ready) {
        toast.error("Payment SDK failed to load. Check your connection and retry.");
        setLoading(false); return;
      }

      const { data, error } = await supabase.functions.invoke("razorpay-create-order", { body: {} });
      if (error) throw new Error(error.message || "Could not create order");
      if (data?.error) throw new Error(data.error);

      const orderId = data.order_id ?? data.orderId;
      const keyId = data.key_id ?? data.keyId;
      const { amount, currency } = data;
      if (!orderId || !keyId) throw new Error("Invalid order response from server");

      const rzp = new window.Razorpay({
        key: keyId,
        amount, currency,
        order_id: orderId,
        name: "Founders Gauntlet",
        description: "Pro Founder Pack",
        prefill: { email: user.email, name: profile?.display_name },
        theme: { color: "#e85d3a" },
        handler: async (resp: any) => {
          try {
            const { data: vData, error: vErr } = await supabase.functions.invoke("razorpay-verify", {
              body: {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            if (vErr) throw new Error(vErr.message || "Verification failed");
            if (vData?.error) throw new Error(vData.error);
            await refreshProfile();
            toast.success("Welcome to Pro! 🎉");
            nav("/profile");
          } catch (e: any) {
            toast.error(e.message || "Verification failed");
          } finally { setLoading(false); }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
      setLoading(false);
    }
  };

  if (profile?.is_pro) {
    return (
      <PageShell>
        <Card className="p-8 border-0 shadow-pop gradient-grape text-white text-center pop-in">
          <Crown className="size-16 mx-auto float-y" />
          <h1 className="text-3xl font-bold mt-4">You're Pro!</h1>
          <p className="opacity-90 mt-2">Unlimited reports, 200 coin boost active.</p>
          <Link to="/"><Button className="mt-6 bg-white text-grape hover:bg-white/90">Back home</Button></Link>
        </Card>
      </PageShell>
    );
  }

  const perks = [
    "Unlimited AI Founder Reports",
    "+200 instant coins",
    "All 4 specializations unlocked",
    "Choose tone & unlock snarky reactions",
    "Pro badge on leaderboard",
    "Lifetime — no subscription",
  ];

  return (
    <PageShell>
      <Card className="p-6 border-0 shadow-pop gradient-coral text-white pop-in">
        <Crown className="size-12 float-y" />
        <h1 className="text-3xl font-bold mt-3">Pro Founder Pack</h1>
        <p className="opacity-95 text-sm mt-1">One-time payment · Lifetime access</p>
        <div className="mt-4">
          <span className="text-5xl font-bold">₹199</span>
        </div>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft">
        <ul className="space-y-3">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-3">
              <div className="size-7 rounded-full gradient-mint text-white flex items-center justify-center"><Check className="size-4" /></div>
              <span className="font-medium">{p}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Button onClick={upgrade} disabled={loading} className="w-full mt-5 h-14 text-base font-bold gradient-coral text-white border-0 shadow-pop">
        {loading ? <><Loader2 className="size-5 animate-spin" /> Opening checkout…</> : <><Crown className="size-5" /> Upgrade to Pro · ₹199</>}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-3">Secure payment via Razorpay. Test mode active.</p>
    </PageShell>
  );
}
