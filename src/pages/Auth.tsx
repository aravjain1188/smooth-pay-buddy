import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

export default function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        // Sign up with the credentials
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email, password,
          options: { 
            emailRedirectTo: window.location.origin, 
            data: { display_name: name || email.split("@")[0] }
          },
        });
        if (signupError) throw signupError;
        
        // If signup succeeded, try to sign in immediately (works if email confirmation is disabled)
        if (signupData.user) {
          // Small delay to let profile trigger fire
          await new Promise(r => setTimeout(r, 1000));
          
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) {
            // If login fails, it might be due to email confirmation requirement
            toast.success("Account created! Check your email to confirm your account.");
            return;
          }
          
          toast.success("Account created! Welcome, founder!");
          nav("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, founder!");
        nav("/");
      }
    } catch (err: any) {
      console.error("[v0] Auth error:", err);
      toast.error(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-pop pop-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl gradient-coral text-white shadow-pop float-y mb-3"><Rocket className="size-8" /></div>
          <h1 className="text-3xl font-bold">Founders Gauntlet</h1>
          <p className="text-muted-foreground text-sm mt-1">Run a startup. Survive the chaos. Climb the ranks.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div><Label>Founder name</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" /></div>
          )}
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold gradient-coral text-white border-0 shadow-pop">
            {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold hover:underline">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
        <div className="mt-2 text-center text-sm">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">Forgot password?</Link>
        </div>
      </Card>
    </div>
  );
}
