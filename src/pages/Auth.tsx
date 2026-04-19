import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Rocket, Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");

  // Handle email confirmation from URL
  useEffect(() => {
    const { hash } = window.location;
    if (hash.includes("type=recovery") || hash.includes("type=signup")) {
      supabase.auth.onAuthStateChange((_evt, sess) => {
        if (sess?.user) {
          toast.success("Email confirmed! Welcome, founder!");
          nav("/");
        }
      });
    }
  }, [nav]);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!email) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (mode === "signup" && !name) {
      setError("Please enter your name");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
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
        
        // If signup succeeded, try to sign in immediately
        if (signupData.user) {
          // Small delay to let profile trigger fire
          await new Promise(r => setTimeout(r, 1000));
          
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) {
            // If login fails, it might be due to email confirmation requirement
            toast.success("Account created! Check your email to confirm your account.");
            setLoading(false);
            return;
          }
          
          // Store device preference if remember device is checked
          if (rememberDevice) {
            localStorage.setItem("rememberDevice", JSON.stringify({ email, timestamp: Date.now() }));
          }
          
          toast.success("Account created! Welcome, founder!");
          nav("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message || "Invalid email or password");
          setLoading(false);
          return;
        }
        
        // Store device preference if remember device is checked
        if (rememberDevice) {
          localStorage.setItem("rememberDevice", JSON.stringify({ email, timestamp: Date.now() }));
        } else {
          localStorage.removeItem("rememberDevice");
        }
        
        toast.success("Welcome back, founder!");
        nav("/");
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Authentication failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally { 
      setLoading(false); 
    }
  };
  
  // Load saved credentials if remember device is enabled
  useEffect(() => {
    const saved = localStorage.getItem("rememberDevice");
    if (saved) {
      try {
        const { email: savedEmail } = JSON.parse(saved);
        setEmail(savedEmail);
        setRememberDevice(true);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-background to-card">
      <Card className="w-full max-w-md p-8 shadow-pop pop-in border-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl gradient-coral text-white shadow-pop float-y mb-4">
            <Rocket className="size-8" />
          </div>
          <h1 className="text-3xl font-bold">Founders Gauntlet</h1>
          <p className="text-muted-foreground text-sm mt-2">Run a startup. Survive the chaos. Climb the ranks.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/20 text-sm text-coral">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label className="text-sm font-medium">Founder Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name"
                disabled={loading}
                className="h-10 mt-1"
              />
            </div>
          )}
          
          <div>
            <Label className="text-sm font-medium">Email Address</Label>
            <Input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="h-10 mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Password</Label>
            <div className="relative mt-1">
              <Input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={6} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {mode === "signin" && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                disabled={loading}
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember this device
              </label>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-11 text-base font-bold gradient-coral text-white border-0 shadow-pop"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {mode === "signup" ? "Creating..." : "Signing in..."}
              </>
            ) : (
              mode === "signup" ? "Create account" : "Sign in"
            )}
          </Button>
        </form>

        {mode === "signin" && (
          <div className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-coral font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border text-center text-sm">
          <button 
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }} 
            className="text-primary font-semibold hover:underline"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
