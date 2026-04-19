import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/game/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Crown, Coins, Trophy, User, Save, Volume2, VolumeX, Trash2, ExternalLink } from "lucide-react";
import { getMuted, setMuted } from "@/lib/sounds";
import mascot from "@/assets/mascot-rocket.png";

export default function Profile() {
  const { user, profile, refreshProfile, signOut, loading } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);
  useEffect(() => { if (profile) setName(profile.display_name); }, [profile]);
  useEffect(() => { setMutedState(getMuted()); }, []);

  const save = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) { toast.error("Name must be at least 2 characters"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("user_id", user.id);
    if (error) toast.error(error.message); else { toast.success("Saved!"); await refreshProfile(); }
    setSaving(false);
  };

  const out = async () => { await signOut(); nav("/auth"); };

  const toggleSound = (m: boolean) => {
    setMuted(m);
    setMutedState(m);
    toast.success(m ? "Sounds muted" : "Sounds on");
  };

  const clearLocalRun = () => {
    localStorage.removeItem("fg_run_v1");
    toast.success("In-progress run cleared");
  };

  if (!profile) return <PageShell><p>Loading…</p></PageShell>;

  return (
    <PageShell>
      <Card className="p-6 border-0 shadow-pop gradient-grape text-white pop-in relative overflow-hidden">
        <img src={mascot} alt="" width={512} height={512} loading="lazy" className="absolute -right-6 -bottom-6 w-32 h-32 opacity-30 pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <div className="size-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">{profile.display_name.slice(0, 1).toUpperCase()}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-sm opacity-90 truncate">{user?.email}</p>
            {profile.is_pro && <Badge className="mt-1 bg-white/25 border-0 text-white"><Crown className="size-3 mr-1" />Pro Founder</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 relative">
          <PStat icon={<Coins className="size-4" />} label="Coins" value={String(profile.coins)} />
          <PStat icon={<Trophy className="size-4" />} label="Best" value={String(profile.high_score)} />
          <PStat icon={<User className="size-4" />} label="Runs" value={String(profile.total_runs)} />
        </div>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft">
        <p className="font-bold mb-3">Display name</p>
        <Label className="text-xs text-muted-foreground">This shows on the leaderboard</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="mt-1" />
        <Button onClick={save} disabled={saving} className="w-full mt-3 gradient-coral text-white border-0"><Save className="size-4" /> Save</Button>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {muted ? <VolumeX className="size-5 text-muted-foreground" /> : <Volume2 className="size-5 text-primary" />}
            <div>
              <p className="font-bold">Sound effects</p>
              <p className="text-xs text-muted-foreground">{muted ? "Muted" : "Tap, win and crisis SFX on"}</p>
            </div>
          </div>
          <Switch checked={!muted} onCheckedChange={(v) => toggleSound(!v)} />
        </div>
      </Card>

      <Card className="p-5 mt-4 border-0 shadow-soft space-y-2">
        <p className="font-bold">Quick actions</p>
        <Button onClick={clearLocalRun} variant="outline" className="w-full justify-start"><Trash2 className="size-4" /> Clear in-progress run</Button>
        <Link to="/leaderboard" className="block"><Button variant="outline" className="w-full justify-start"><Trophy className="size-4" /> View leaderboard</Button></Link>
        <a href="mailto:support@example.com" className="block"><Button variant="outline" className="w-full justify-start"><ExternalLink className="size-4" /> Contact support</Button></a>
      </Card>

      {!profile.is_pro && (
        <Link to="/pro" className="block mt-4">
          <Card className="p-4 border-0 shadow-pop gradient-coral text-white flex items-center gap-3">
            <Crown className="size-5" />
            <div className="flex-1">
              <p className="font-bold">Upgrade to Pro</p>
              <p className="text-xs opacity-90">Unlock all specializations, unlimited reports, snarky reactions · ₹49</p>
            </div>
            <span>→</span>
          </Card>
        </Link>
      )}

      <Button onClick={out} variant="outline" className="w-full mt-4 h-12"><LogOut className="size-4" /> Sign out</Button>
    </PageShell>
  );
}

function PStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center justify-center gap-1 text-xs opacity-90">{icon}{label}</div>
      <p className="font-bold text-lg text-center">{value}</p>
    </div>
  );
}
