import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { SCENARIOS } from "@/game/scenarios";
import { supabase } from "@/integrations/supabase/client";
import { sfx, vibrate } from "@/lib/sounds";
import { Calendar, Trophy, Coins, Users as UsersIcon, Check } from "lucide-react";
import { toast } from "sonner";

function todaySeed() {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Daily() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const seed = todaySeed();
  const todayKey = `fg_daily_${seed}`;
  const challenge = useMemo(() => seededShuffle(SCENARIOS, seed).slice(0, 5), [seed]);

  const [step, setStep] = useState(0);
  const [cash, setCash] = useState(1000);
  const [users, setUsers] = useState(50);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (!user) nav("/auth"); }, [user, nav]);
  useEffect(() => {
    if (localStorage.getItem(todayKey)) { setSubmitted(true); setDone(true); }
  }, [todayKey]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const c = challenge[step].choices[i];
    setCash((v) => Math.max(0, v + c.cashDelta));
    setUsers((v) => Math.max(0, v + c.usersDelta));
    setScore((v) => v + Math.max(0, c.cashDelta) + Math.max(0, c.usersDelta) * 5 + (c.good ? 50 : 0));
    if (c.good) { sfx.good(); vibrate(40); } else { sfx.bad(); vibrate(120); }
    setTimeout(() => {
      if (step + 1 >= challenge.length) { setDone(true); finalize(score + Math.max(0, c.cashDelta) + Math.max(0, c.usersDelta) * 5 + (c.good ? 50 : 0)); }
      else { setStep(step + 1); setPicked(null); }
    }, 1200);
  };

  const finalize = async (finalScore: number) => {
    if (!user || !profile || submitted) return;
    try {
      await supabase.from("game_runs").insert({
        user_id: user.id, display_name: profile.display_name,
        mode: "daily", specialization: "generic",
        final_cash: cash, months_survived: challenge.length, score: finalScore, bankrupt: cash <= 0,
      });
      localStorage.setItem(todayKey, "1");
      setSubmitted(true);
      sfx.victory();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-4">
        <div className="size-12 rounded-2xl gradient-mint text-white flex items-center justify-center"><Calendar className="size-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
          <p className="text-xs text-muted-foreground">Same 5 scenarios. Everyone. Today.</p>
        </div>
      </div>

      {done ? (
        <Card className="p-6 border-0 shadow-pop gradient-mint text-white text-center pop-in">
          <Check className="size-12 mx-auto" />
          <h2 className="text-2xl font-bold mt-2">Today's run done!</h2>
          <p className="opacity-90 mt-1">Score: <strong>{score}</strong> · Cash ₹{cash} · Users {users}</p>
          <Link to="/leaderboard"><Button className="mt-4 bg-white text-foreground hover:bg-white/90"><Trophy className="size-4" /> Today's leaderboard</Button></Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl bg-card p-2.5 shadow-soft text-center"><div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1"><Coins className="size-3" />Cash</div><p className="font-bold">₹{cash}</p></div>
            <div className="rounded-xl bg-card p-2.5 shadow-soft text-center"><div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1"><UsersIcon className="size-3" />Users</div><p className="font-bold">{users}</p></div>
            <div className="rounded-xl bg-card p-2.5 shadow-soft text-center"><div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1"><Trophy className="size-3" />Score</div><p className="font-bold">{score}</p></div>
          </div>
          <Badge variant="secondary" className="mb-3">Round {step + 1} / {challenge.length}</Badge>
          <Card className="p-5 border-0 shadow-pop pop-in">
            <div className="flex gap-3 items-start mb-4">
              <div className="text-4xl">{challenge[step].emoji}</div>
              <h2 className="text-lg font-bold flex-1">{challenge[step].prompt}</h2>
            </div>
            <div className="space-y-2.5">
              {challenge[step].choices.map((c, i) => (
                <button key={i} disabled={picked !== null} onClick={() => choose(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[60px] ${picked === i ? (c.good ? "border-success bg-success/10" : "border-destructive bg-destructive/10") : "border-border bg-card hover:border-primary"}`}>
                  <p className="font-semibold text-sm">{c.label}</p>
                  {picked === i && <p className="text-xs mt-1">{c.feedback}</p>}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
