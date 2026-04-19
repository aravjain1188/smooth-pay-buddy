import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRun, pickScenario, applyChoice, maybeWorldEvent } from "@/game/store";
import type { Scenario, WorldEvent } from "@/game/scenarios";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { sfx, vibrate } from "@/lib/sounds";
import { nextReaction } from "@/lib/memes";
import { Coins, Users as UsersIcon, Calendar, Trophy, AlertTriangle, Sparkles, Zap, ShoppingBag, Crown, Clock } from "lucide-react";

const SCENARIO_TIME_LIMIT = 30; // seconds

export default function Play() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [run, setRun] = useRun();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [worldEv, setWorldEv] = useState<WorldEvent | null>(null);
  const [showResult, setShowResult] = useState<{ good: boolean; text: string; title: string; emoji: string; line: string } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [activePerks, setActivePerks] = useState({ hint: false, remove: false, best: false });
  const [timeRemaining, setTimeRemaining] = useState(SCENARIO_TIME_LIMIT);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  useEffect(() => { if (!authLoading && !user) nav("/auth"); }, [user, authLoading, nav]);
  useEffect(() => { if (!authLoading && user && !run) nav("/"); }, [run, user, authLoading, nav]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!scenario || picked !== null || timeoutOccurred) return;
    
    const startTime = run?.scenarioStartTime || Date.now();
    if (!run?.scenarioStartTime) {
      setRun({ ...run!, scenarioStartTime: startTime });
    }
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, SCENARIO_TIME_LIMIT - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !timeoutOccurred) {
        setTimeoutOccurred(true);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [scenario, picked, run, setRun, timeoutOccurred]);

  // Auto-fail on timeout
  useEffect(() => {
    if (!timeoutOccurred || !scenario || picked !== null) return;
    
    setPicked(-1);
    const mul = { cashMul: worldEv?.cashMul ?? 1, usersMul: worldEv?.usersMul ?? 1 };
    let next = applyChoice(run!, scenario, 0, mul);
    next.cash = Math.max(0, next.cash - 200);
    next = { ...next, history: [...next.history, { scenario: scenario.prompt, choice: "⏱ Time's up! (Timeout penalty)", cashAfter: next.cash }], month: next.month + 1 };
    
    if (next.cash <= 0) { next = { ...next, bankrupt: true, ended: true }; sfx.crisis(); }
    if (next.month > run!.endDateMonths) { next = { ...next, ended: true }; sfx.victory(); }
    
    setShowResult({ good: false, title: "Time's up!", line: "You took too long to decide.", emoji: "⏱️", text: "Decisive founders move fast. This one cost you." });
    setRun(next);
    sfx.bad();
    vibrate(120);
    
    setTimeout(async () => {
      if (next.ended) {
        await saveRun(next);
        nav("/result");
      } else {
        advanceToNext();
      }
    }, 2200);
  }, [timeoutOccurred, scenario, picked, worldEv, run, setRun, nav]);

  useEffect(() => {
    if (!run) return;
    if (run.ended || run.bankrupt) { nav("/result"); return; }
    if (!scenario) {
      const s = pickScenario(run);
      setScenario(s);
      setWorldEv(maybeWorldEvent(run));
      setTimeRemaining(SCENARIO_TIME_LIMIT);
      setTimeoutOccurred(false);
      const inv = { ...(run.inventory || {}) };
      const perks = { hint: false, remove: false, best: false };
      if ((inv.hint || 0) > 0) { perks.hint = true; inv.hint!--; }
      if ((inv.remove || 0) > 0) { perks.remove = true; inv.remove!--; }
      if ((inv.best || 0) > 0) { perks.best = true; inv.best!--; }
      setActivePerks(perks);
      if (perks.hint || perks.remove || perks.best) setRun({ ...run, inventory: inv });
    }
  }, [run, scenario, nav, setRun]);

  const removedIdx = useMemo(() => {
    if (!scenario || !activePerks.remove) return -1;
    const wrongIndices = scenario.choices.map((c, i) => (c.good ? -1 : i)).filter((i) => i >= 0);
    return wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  }, [scenario, activePerks.remove]);

  const bestIdx = useMemo(() => {
    if (!scenario || !activePerks.best) return -1;
    return scenario.choices.findIndex((c) => c.good);
  }, [scenario, activePerks.best]);

  if (!run || !scenario) return <div className="min-h-dvh flex items-center justify-center">Loading run…</div>;

  const monthsTotal = run.endDateMonths;
  const cashLow = run.cash < 300;

  const choose = async (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const c = scenario.choices[i];
    const mul = { cashMul: worldEv?.cashMul ?? 1, usersMul: worldEv?.usersMul ?? 1 };
    let next = applyChoice(run, scenario, i, mul);
    next = { ...next, history: [...next.history, { scenario: scenario.prompt, choice: c.label, cashAfter: next.cash }], month: next.month + 1, scenarioStartTime: undefined };

    const tone: "snarky" | "polite" = profile?.is_pro || run.feedbackToneUnlocked ? "snarky" : "polite";
    const reaction = nextReaction(!!c.good, tone);
    if (c.good) { sfx.good(); vibrate(40); setShowResult({ good: true, ...reaction, text: c.feedback }); }
    else { sfx.bad(); vibrate(120); setShowResult({ good: false, ...reaction, text: c.feedback }); }

    if (next.cash <= 0) { next = { ...next, bankrupt: true, ended: true }; sfx.crisis(); }
    if (next.month > monthsTotal) { next = { ...next, ended: true }; sfx.victory(); }
    setRun(next);

    setTimeout(async () => {
      if (next.ended) {
        await saveRun(next);
        nav("/result");
      } else {
        advanceToNext();
      }
    }, 2200);
  };

  const advanceToNext = () => {
    if (!run) return;
    if (run.ended || run.bankrupt) return;
    setShowResult(null);
    setPicked(null);
    setScenario(null);
  };

  const saveRun = async (r: typeof run) => {
    if (!user || !profile) return;
    try {
      await supabase.from("game_runs").insert({
        user_id: user.id,
        display_name: profile.display_name,
        mode: r.mode,
        specialization: r.specialization,
        final_cash: r.cash,
        months_survived: Math.min(r.month - 1, r.endDateMonths),
        score: r.score,
        bankrupt: r.bankrupt,
      });
      await refreshProfile();
    } catch (e) { console.error(e); }
  };

  const useShield = async () => {
    if (!run.inventory?.shield) return;
    const inv = { ...run.inventory }; inv.shield!--;
    setRun({ ...run, inventory: inv, shieldActive: true });
    sfx.coin();
  };

  return (
    <PageShell hideNav>
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground">← Quit</Link>
          <Badge variant="secondary" className="rounded-xl"><Calendar className="size-3.5 mr-1" /> Month {run.month} / {monthsTotal}</Badge>
        </div>
        <Progress value={(run.month / monthsTotal) * 100} className="h-2" />
        
        {scenario && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Time limit
              </span>
              <span className={`font-semibold ${timeRemaining < 10 ? "text-destructive" : timeRemaining < 15 ? "text-warning" : ""}`}>
                {timeRemaining}s
              </span>
            </div>
            <Progress 
              value={(timeRemaining / SCENARIO_TIME_LIMIT) * 100} 
              className={`h-1.5 ${timeRemaining < 10 ? "bg-destructive/20" : timeRemaining < 15 ? "bg-warning/20" : ""}`}
            />
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2">
          <HudStat icon={<Coins className="size-4" />} label="Cash" value={`₹${run.cash}`} warn={cashLow} />
          <HudStat icon={<UsersIcon className="size-4" />} label="Users" value={String(run.users)} />
          <HudStat icon={<Trophy className="size-4" />} label="Score" value={String(run.score)} />
        </div>
      </div>

      {worldEv && (
        <Card className={`p-4 mb-4 border-0 shadow-soft ${(worldEv.cashMul ?? 1) < 1 || (worldEv.usersMul ?? 1) < 1 ? "crisis-flash" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{worldEv.emoji}</div>
            <div className="flex-1">
              <p className="font-bold text-sm">{worldEv.title}</p>
              <p className="text-xs text-muted-foreground">{worldEv.message}</p>
            </div>
            {!run.shieldActive && (run.inventory?.shield ?? 0) > 0 && ((worldEv.cashMul ?? 1) < 1 || (worldEv.usersMul ?? 1) < 1) && (
              <Button size="sm" onClick={useShield} className="gradient-mint text-white border-0">Use Shield</Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5 border-0 shadow-pop pop-in">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 flex items-center gap-1">
          <AlertTriangle className="size-3.5" /> Founder Decision · {scenario.realWorld}
        </p>
        <div className="flex gap-3 items-start mb-4">
          <div className="text-4xl">{scenario.emoji}</div>
          <h2 className="text-lg font-bold leading-snug flex-1">{scenario.prompt}</h2>
        </div>

        <div className="space-y-2.5">
          {scenario.choices.map((c, i) => {
            const removed = i === removedIdx;
            const best = i === bestIdx;
            const pickedThis = picked === i;
            const reveal = picked !== null;
            return (
              <button
                key={i}
                disabled={removed || picked !== null}
                onClick={() => choose(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all min-h-[60px]
                  ${removed ? "opacity-30 line-through" : ""}
                  ${pickedThis ? (c.good ? "border-success bg-success/10" : "border-destructive bg-destructive/10") : "border-border bg-card hover:border-primary"}
                  ${best && !reveal ? "ring-2 ring-warning ring-offset-2" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm flex-1">{c.label}</p>
                  {best && !reveal && <Badge className="bg-warning text-warning-foreground border-0 text-[10px]">★ Best</Badge>}
                  {c.risk === "bold" && !reveal && <Badge variant="outline" className="text-[10px]">Bold</Badge>}
                </div>
                {activePerks.hint && !reveal && <p className="text-xs text-muted-foreground mt-1">💡 {c.hint}</p>}
                {pickedThis && <p className="text-xs mt-2 font-medium">{c.feedback}</p>}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 flex justify-center">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-primary font-semibold">
          <ShoppingBag className="size-4" /> Need a perk? Visit Shop
        </Link>
      </div>

      {showResult && (
        <button
          onClick={advanceToNext}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in"
          aria-label="Tap to continue"
        >
          <Card className={`w-full max-w-md p-6 border-0 shadow-pop pop-in ${showResult.good ? "gradient-mint" : "gradient-coral"} text-white text-left`}>
            <div className="flex items-start gap-3">
              <div className="text-5xl">{showResult.emoji}</div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-90 font-bold flex items-center gap-1">
                  {showResult.good ? <><Sparkles className="size-3" /> Hype</> : <><Zap className="size-3" /> Reality Check</>}
                </p>
                <h3 className="text-xl font-bold leading-tight">{showResult.title}</h3>
                <p className="text-sm opacity-95 mt-1">{showResult.line}</p>
                <p className="text-xs opacity-90 mt-2 italic">"{showResult.text}"</p>
                {!profile?.is_pro && !run.feedbackToneUnlocked && (
                  <p className="text-[10px] opacity-90 mt-2 flex items-center gap-1"><Crown className="size-3" /> Unlock snarky reactions in the Shop (150 coins)</p>
                )}
                <p className="text-[11px] opacity-80 mt-3 font-semibold">Tap anywhere to continue →</p>
              </div>
            </div>
          </Card>
        </button>
      )}
    </PageShell>
  );
}

function HudStat({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 text-center bg-card shadow-soft ${warn ? "ring-2 ring-destructive crisis-flash" : ""}`}>
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase">{icon}{label}</div>
      <p className="font-bold text-base leading-tight">{value}</p>
    </div>
  );
}
