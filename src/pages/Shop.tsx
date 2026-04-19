import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SHOP_ITEMS } from "@/game/scenarios";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRun } from "@/game/store";
import { sfx } from "@/lib/sounds";
import { Coins, Crown, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function Shop() {
  const { user, profile, refreshProfile } = useAuth();
  const [run, setRun] = useRun();
  const [busy, setBusy] = useState<string | null>(null);

  if (!user) return <PageShell><p>Please <Link to="/auth" className="text-primary underline">sign in</Link>.</p></PageShell>;

  const buy = async (id: string, price: number) => {
    if (!profile) return;
    if ((profile.coins ?? 0) < price) return toast.error("Not enough coins! Win runs to earn more.");
    setBusy(id);
    try {
      if (id === "cash" && run) {
        setRun({ ...run, cash: run.cash + 500 });
      } else if (id === "tone_unlock" && run) {
        setRun({ ...run, feedbackToneUnlocked: true });
      } else if (run) {
        const inv = { ...(run.inventory || {}) };
        inv[id] = (inv[id] || 0) + 1;
        setRun({ ...run, inventory: inv });
      } else {
        toast.error("Start a run first, then buy perks for it.");
        setBusy(null); return;
      }
      const { data: ok, error } = await supabase.rpc("spend_coins", { _amount: price });
      if (error) throw error;
      if (!ok) { toast.error("Insufficient coins"); setBusy(null); return; }
      await refreshProfile();
      sfx.coin();
      toast.success(`Bought ${id}!`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="size-6" /> Shop</h1>
          <p className="text-sm text-muted-foreground">Power-ups for your next decision</p>
        </div>
        <Badge variant="secondary" className="rounded-xl px-3 py-1.5 gap-1"><Coins className="size-3.5" />{profile?.coins ?? 0}</Badge>
      </div>

      <div className="space-y-3">
        {SHOP_ITEMS.map((it) => {
          const owned = run?.inventory?.[it.id] ?? 0;
          const isAlreadyOwned = it.id === "tone_unlock" && run?.feedbackToneUnlocked;
          return (
            <Card key={it.id} className={`p-4 border-0 shadow-soft flex items-center gap-3 ${isAlreadyOwned ? "opacity-50" : ""}`}>
              <div className="size-12 rounded-xl gradient-mint text-white flex items-center justify-center font-bold text-lg shrink-0">
                {it.id === "cash" ? "₹" : it.id === "shield" ? "🛡" : it.id === "best" ? "★" : it.id === "remove" ? "½" : it.id === "tone_unlock" ? "😈" : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="font-bold">{it.name}</p>{owned > 0 && <Badge variant="outline" className="text-[10px]">x{owned}</Badge>}{isAlreadyOwned && <Badge className="bg-success text-white text-[10px]">✓ Unlocked</Badge>}</div>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <Button onClick={() => buy(it.id, it.price)} disabled={busy === it.id || isAlreadyOwned} className="gradient-coral text-white border-0 shrink-0">
                {isAlreadyOwned ? "✓" : <><Coins className="size-3.5" /> {it.price}</> }
              </Button>
            </Card>
          );
        })}
      </div>

      {!profile?.is_pro && (
        <Link to="/pro" className="block mt-5">
          <Card className="p-4 border-0 shadow-pop gradient-grape text-white flex items-center gap-3">
            <Crown className="size-5" />
            <div className="flex-1">
              <p className="font-bold">Pro Pack — ₹49</p>
              <p className="text-xs opacity-90">+200 coins, unlimited AI reports, lifetime</p>
            </div>
            <span>→</span>
          </Card>
        </Link>
      )}
    </PageShell>
  );
}
