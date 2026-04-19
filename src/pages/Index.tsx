import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/game/PageShell";
import { newRun } from "@/game/store";
import type { Mode, Specialization } from "@/game/scenarios";
import { Rocket, Sparkles, Trophy, Coins, Crown, Flame, Calendar, Users, Lock, Target, Brain } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { toast } from "sonner";
import heroImg from "@/assets/hero-founder.jpg";

const SPECS: { id: Specialization; label: string; emoji: string; tag: string; pro?: boolean }[] = [
  { id: "generic", label: "Generalist", emoji: "🧭", tag: "All scenarios" },
  { id: "marketing", label: "Marketing", emoji: "📣", tag: "CAC, virality, PR", pro: true },
  { id: "saas", label: "SaaS", emoji: "🛠️", tag: "Churn, MRR, scale", pro: true },
  { id: "ecommerce", label: "E-commerce", emoji: "📦", tag: "Inventory, AOV, ops", pro: true },
];

const MODES: { id: Mode; label: string; months: number; tint: string }[] = [
  { id: "easy", label: "Chill — 6 months", months: 6, tint: "gradient-mint" },
  { id: "medium", label: "Standard — 12 months", months: 12, tint: "gradient-coral" },
  { id: "hard", label: "Brutal — 24 months", months: 24, tint: "gradient-grape" },
];

const Index = () => {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<"prologue" | "spec" | "mode">("prologue");
  const [spec, setSpec] = useState<Specialization>("generic");
  const [resumeRun, setResumeRun] = useState<null | { mode: Mode; month: number; endDateMonths: number; cash: number; score: number }>(null);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem("fg_run_v1");
      if (!raw) { setResumeRun(null); return; }
      const r = JSON.parse(raw);
      if (r && !r.ended && !r.bankrupt && r.month <= r.endDateMonths) setResumeRun(r);
      else setResumeRun(null);
    } catch { setResumeRun(null); }
  }, [user, step]);

  if (loading || !user) {
    return <div className="min-h-dvh flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const start = (mode: Mode, months: number) => {
    sfx.levelUp();
    localStorage.removeItem("fg_run_v1");
    const run = newRun(mode, spec, months);
    localStorage.setItem("fg_run_v1", JSON.stringify(run));
    nav("/play");
  };

  const discardRun = () => {
    localStorage.removeItem("fg_run_v1");
    setResumeRun(null);
  };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Hey, {profile?.display_name || "Founder"} 👋</h1>
          <p className="text-sm text-muted-foreground">Ready for another run?</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 px-3 py-1.5 rounded-xl"><Coins className="size-3.5" />{profile?.coins ?? 0}</Badge>
          {profile?.is_pro && <Badge className="gap-1 bg-grape text-white border-0 px-3 py-1.5 rounded-xl"><Crown className="size-3.5" />Pro</Badge>}
        </div>
      </div>

      {step === "prologue" && (
        <div className="space-y-4 pop-in">
          {resumeRun && (
            <Card className="p-4 border-0 shadow-pop gradient-mint text-white">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⏯️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Resume your run</p>
                  <p className="text-xs opacity-90">{resumeRun.mode} · Month {resumeRun.month}/{resumeRun.endDateMonths} · ₹{resumeRun.cash} · {resumeRun.score} pts</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button onClick={() => { sfx.tap(); nav("/play"); }} className="bg-white text-mint hover:bg-white/90 font-bold">Resume</Button>
                <Button onClick={discardRun} variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20">Discard</Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden border-0 shadow-pop">
            <img src={heroImg} alt="A founder surfing a wave of rupee coins" width={1024} height={768} className="w-full h-44 object-cover" />
            <div className="gradient-hero p-6 text-white">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90 mb-2">
                <Sparkles className="size-4" /> The Founders Gauntlet
              </div>
              <h2 className="text-3xl font-bold leading-tight">Run a startup. Survive the chaos. Climb the ranks.</h2>
              <p className="text-white/90 mt-3 text-sm leading-relaxed">
                Each month a new founder dilemma hits — pricing, hiring, pivots, viral moments. Make the call, watch your cash and users react in real time.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat icon={<Coins className="size-4" />} label="Cash" value="₹1,000" />
                <Stat icon={<Users className="size-4" />} label="Users" value="50" />
                <Stat icon={<Trophy className="size-4" />} label="Score" value="0" />
              </div>

              <div className="rounded-xl bg-muted p-4 text-sm">
                <p className="font-bold flex items-center gap-2"><Flame className="size-4 text-coral" /> How a run works</p>
                <ol className="mt-2 space-y-1.5 text-muted-foreground text-[13px] list-decimal pl-4">
                  <li>Pick a specialization & length (6 / 12 / 24 months).</li>
                  <li>Each month: read the scenario, pick one of 3 choices.</li>
                  <li>Cash and users update instantly. Survive without going bankrupt.</li>
                  <li>Beat your high score, climb the leaderboard, earn coins.</li>
                </ol>
              </div>

              <div className="rounded-xl bg-muted p-4 text-sm">
                <p className="font-bold flex items-center gap-2"><Target className="size-4 text-grape" /> Win Goal</p>
                <p className="text-muted-foreground mt-1">Survive your full term without going bankrupt and rack up the highest score. Top 3 ranks = bonus coins.</p>
              </div>

              <Button onClick={() => { sfx.tap(); setStep("spec"); }} className="w-full h-14 text-base font-bold gradient-coral text-white border-0 shadow-pop">
                <Rocket className="size-5" /> Start a New Run
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/daily" onClick={() => sfx.tap()} className="block">
              <Card className="p-4 border-0 shadow-soft hover:shadow-pop transition-shadow h-full">
                <div className="size-10 rounded-xl gradient-mint flex items-center justify-center text-white mb-2"><Calendar className="size-5" /></div>
                <p className="font-bold text-sm">Daily Challenge</p>
                <p className="text-xs text-muted-foreground">Same scenarios for everyone today</p>
              </Card>
            </Link>
            <Link to="/multiplayer" onClick={() => sfx.tap()} className="block">
              <Card className="p-4 border-0 shadow-soft hover:shadow-pop transition-shadow h-full">
                <div className="size-10 rounded-xl gradient-grape flex items-center justify-center text-white mb-2"><Users className="size-5" /></div>
                <p className="font-bold text-sm">Multiplayer</p>
                <p className="text-xs text-muted-foreground">2–4 friends, one room code</p>
              </Card>
            </Link>
          </div>

          <Card className="p-4 border-0 shadow-soft flex items-center gap-3 bg-muted/40">
            <div className="size-10 rounded-xl gradient-coral flex items-center justify-center text-white"><Brain className="size-5" /></div>
            <div className="flex-1">
              <p className="font-bold text-sm">Post-run AI report</p>
              <p className="text-xs text-muted-foreground">Get a personalized founder breakdown after every game.</p>
            </div>
          </Card>
        </div>
      )}

      {step === "spec" && (
        <div className="space-y-4 pop-in">
          <h2 className="text-xl font-bold">Pick your specialization</h2>
          <div className="grid grid-cols-2 gap-3">
            {SPECS.map((s) => {
              const locked = !!s.pro && !profile?.is_pro;
              return (
                <button key={s.id} onClick={() => {
                  if (locked) { sfx.tap(); toast.error("Pro specialization — upgrade to unlock"); nav("/pro"); return; }
                  sfx.tap(); setSpec(s.id); setStep("mode");
                }}
                  className={`relative text-left p-4 rounded-2xl bg-card shadow-soft border-2 transition-all hover:scale-[1.02] ${spec === s.id && !locked ? "border-primary" : "border-transparent"} ${locked ? "opacity-80" : ""}`}>
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <p className="font-bold flex items-center gap-1">
                    {s.label}
                    {locked && <Lock className="size-3.5 text-grape" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.tag}</p>
                  {locked && <Badge className="absolute top-2 right-2 bg-grape text-white border-0 text-[9px] px-1.5 py-0">PRO</Badge>}
                </button>
              );
            })}
          </div>
          {!profile?.is_pro && (
            <Link to="/pro" className="block">
              <Card className="p-3 border-0 shadow-soft gradient-grape text-white flex items-center gap-2">
                <Crown className="size-4" />
                <p className="text-xs font-semibold flex-1">Unlock all specializations + snarky meme reactions</p>
                <span className="text-xs">→</span>
              </Card>
            </Link>
          )}
          <Button variant="ghost" onClick={() => setStep("prologue")} className="w-full">← Back</Button>
        </div>
      )}

      {step === "mode" && (
        <div className="space-y-4 pop-in">
          <h2 className="text-xl font-bold">Choose your gauntlet</h2>
          <div className="space-y-3">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => start(m.id, m.months)}
                className={`w-full p-5 rounded-2xl text-white shadow-pop ${m.tint} text-left hover:scale-[1.01] transition-transform`}>
                <p className="font-bold text-lg">{m.label}</p>
                <p className="text-sm text-white/85">{m.months} monthly decisions • {m.id === "hard" ? "Crises hit harder" : m.id === "medium" ? "Balanced run" : "Forgiving start"}</p>
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setStep("spec")} className="w-full">← Back</Button>
        </div>
      )}
    </PageShell>
  );
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs opacity-90">{icon}{label}</div>
      <p className="font-bold text-lg leading-tight">{value}</p>
    </div>
  );
}

export default Index;
