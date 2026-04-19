import { useEffect, useState } from "react";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Trophy, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Row = { display_name: string; mode: string; specialization: string; score: number; months_survived: number; final_cash: number; created_at: string };

export default function Leaderboard() {
  const { profile, refreshProfile, user } = useAuth();
  const [allTime, setAllTime] = useState<Row[]>([]);
  const [daily, setDaily] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.rpc("get_leaderboard", { _limit: 50 }),
      supabase.from("game_runs").select("display_name, mode, specialization, score, months_survived, final_cash, created_at")
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .order("score", { ascending: false }).limit(50),
    ]);
    setAllTime((a as Row[]) || []);
    setDaily((d as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const claim = async (period: "all" | "daily") => {
    if (!user) return;
    setClaiming(period);
    const { data, error } = await supabase.rpc("claim_rank_bonus", { _period: period });
    setClaiming(null);
    if (error) { toast.error(error.message); return; }
    const r = data as { success?: boolean; reason?: string; bonus?: number; rank?: number };
    if (r?.success) {
      toast.success(`+${r.bonus} coins! You're rank #${r.rank} 🏆`);
      await refreshProfile();
    } else if (r?.reason === "already_claimed") {
      toast.info("Already claimed for this period");
    } else if (r?.reason === "not_top_3") {
      toast.error("Top 3 only — keep grinding!");
    } else {
      toast.error("Could not claim bonus");
    }
  };

  const myName = profile?.display_name;

  return (
    <PageShell>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Trophy className="size-6 text-coral" /> Leaderboards</h1>
      <p className="text-sm text-muted-foreground mb-4">🥇 100 coins · 🥈 60 coins · 🥉 30 coins — claim once per day/week.</p>
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-2 w-full h-12">
          <TabsTrigger value="all" className="text-base">All-time</TabsTrigger>
          <TabsTrigger value="daily" className="text-base">Today</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ClaimButton period="all" onClaim={claim} loading={claiming === "all"} />
          <Board rows={allTime} loading={loading} myName={myName} />
        </TabsContent>
        <TabsContent value="daily">
          <ClaimButton period="daily" onClaim={claim} loading={claiming === "daily"} />
          <Board rows={daily} loading={loading} myName={myName} empty="No runs today yet — be the first!" />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function ClaimButton({ period, onClaim, loading }: { period: "all" | "daily"; onClaim: (p: "all" | "daily") => void; loading: boolean }) {
  return (
    <Button onClick={() => onClaim(period)} disabled={loading} className="w-full mt-4 h-11 gradient-mint text-white border-0">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />} Claim my rank bonus
    </Button>
  );
}

function Board({ rows, loading, empty, myName }: { rows: Row[]; loading: boolean; empty?: string; myName?: string }) {
  if (loading) return <p className="text-center text-muted-foreground py-10">Loading…</p>;
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-10">{empty || "No runs yet — start one!"}</p>;
  return (
    <div className="space-y-2 mt-4">
      {rows.map((r, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        const mine = myName && r.display_name === myName;
        return (
          <Card key={i} className={`p-4 border-0 flex items-center gap-3 ${i < 3 ? "shadow-pop gradient-coral text-white" : "shadow-soft"} ${mine ? "ring-2 ring-primary" : ""}`}>
            <div className={`size-10 rounded-xl flex items-center justify-center font-bold text-lg ${i < 3 ? "bg-white/20" : "bg-muted"}`}>
              {medal || `#${i + 1}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{r.display_name}{mine && " (you)"}</p>
              <p className={`text-xs ${i < 3 ? "text-white/85" : "text-muted-foreground"}`}>{r.specialization} · {r.mode} · {r.months_survived} mo</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{r.score}</p>
              <p className={`text-[10px] ${i < 3 ? "text-white/85" : "text-muted-foreground"}`}>₹{r.final_cash}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
