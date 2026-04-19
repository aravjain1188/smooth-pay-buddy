import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRun } from "@/game/store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Sparkles, RotateCw, Crown, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Result() {
  const { user, profile, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [run, setRun] = useRun();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!authLoading && !user) nav("/auth"); }, [user, authLoading, nav]);
  useEffect(() => { if (!authLoading && user && !run) nav("/"); }, [run, user, authLoading, nav]);

  if (!run) return null;

  const won = !run.bankrupt;

  const generateReport = async () => {
    if (!user) return;
    if (!profile?.is_pro && (profile?.reports_used ?? 0) >= 1) {
      toast.error("Free tier: 1 AI report. Upgrade to Pro for unlimited.");
      nav("/pro"); return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-report", {
        body: {
          mode: run.mode, specialization: run.specialization,
          months: run.month - 1, totalMonths: run.endDateMonths,
          cash: run.cash, users: run.users, score: run.score, bankrupt: run.bankrupt,
          history: run.history,
        },
      });
      if (error) throw error;
      setReport(data?.report || "No report returned.");
    } catch (e: any) {
      toast.error(e.message || "Could not generate report");
    } finally { setLoading(false); }
  };

  const playAgain = () => { setRun(null); nav("/"); };

  return (
    <PageShell>
      {won && (
        <Card className="overflow-hidden border-0 shadow-pop mb-4 pop-in">
          <img src="/images/success-celebration.jpg" alt="Success celebration" className="w-full h-48 object-cover" />
        </Card>
      )}
      {!won && (
        <Card className="overflow-hidden border-0 shadow-pop mb-4 pop-in">
          <img src="/images/crisis-moment.jpg" alt="Crisis moment" className="w-full h-48 object-cover opacity-80" />
        </Card>
      )}
      <Card className={`p-6 border-0 shadow-pop pop-in text-white ${won ? "gradient-mint" : "gradient-coral"}`}>
        <div className="text-center">
          <div className="text-6xl mb-2 float-y">{won ? "🏆" : "💸"}</div>
          <h1 className="text-3xl font-bold">{won ? "You survived!" : "Bankrupt!"}</h1>
          <p className="text-white/90 mt-1 text-sm">{won ? "Founder mode unlocked." : "Reality bit hard. Try again?"}</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <ResStat label="Score" value={String(run.score)} />
            <ResStat label="Cash" value={`₹${run.cash}`} />
            <ResStat label="Months" value={`${Math.min(run.month - 1, run.endDateMonths)}/${run.endDateMonths}`} />
          </div>
        </div>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft">
        <h2 className="font-bold text-lg flex items-center gap-2"><Trophy className="size-5 text-coral" /> Your decisions</h2>
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {run.history.map((h, i) => (
            <div key={i} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
              <p className="text-xs text-muted-foreground">M{i + 1} · {h.scenario.slice(0, 60)}…</p>
              <p className="font-medium">→ {h.choice}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl gradient-grape flex items-center justify-center text-white shrink-0"><Sparkles className="size-5" /></div>
          <div className="flex-1">
            <p className="font-bold flex items-center gap-2">AI Founder Report {!profile?.is_pro && <Badge variant="outline" className="text-[10px]">1 free</Badge>}</p>
            <p className="text-xs text-muted-foreground">Personalized analysis of every call you made.</p>
          </div>
        </div>
        {report ? (
          <div className="mt-4 rounded-xl bg-muted p-4 text-sm whitespace-pre-wrap">{report}</div>
        ) : (
          <Button onClick={generateReport} disabled={loading} className="w-full mt-4 h-11 gradient-grape text-white border-0">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><FileText className="size-4" /> Generate AI Report</>}
          </Button>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button onClick={playAgain} className="h-12 gradient-coral text-white border-0"><RotateCw className="size-4" /> Play again</Button>
        <Link to="/leaderboard"><Button variant="outline" className="w-full h-12"><Trophy className="size-4" /> Ranks</Button></Link>
      </div>
      {!profile?.is_pro && (
        <Link to="/pro" className="block mt-3">
          <Card className="p-4 border-0 shadow-soft gradient-grape text-white flex items-center gap-3">
            <Crown className="size-5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Go Pro — unlimited reports + 200 coins</p>
              <p className="text-xs opacity-90">One-time ₹199</p>
            </div>
            <span>→</span>
          </Card>
        </Link>
      )}
    </PageShell>
  );
}

function ResStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur p-3">
      <p className="text-[10px] uppercase opacity-90 font-semibold">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}
