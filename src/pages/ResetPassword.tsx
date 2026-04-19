import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Invalid reset link or session expired");
        nav("/forgot-password");
      }
    };
    checkSession();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pw) {
      setError("Please enter a new password");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (pw !== pwConfirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: pw });
      
      if (updateError) {
        setError(updateError.message || "Failed to update password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");
      setLoading(false);
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        nav("/auth");
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-background to-card">
        <Card className="w-full max-w-md p-8 border-0 shadow-pop text-center pop-in">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-mint/10 p-4">
              <CheckCircle className="size-8 text-mint" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Updated!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been successfully reset. Redirecting you to login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-background to-card">
      <Card className="w-full max-w-md p-6 border-0 shadow-pop pop-in">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-mint/10 p-3">
            <Lock className="size-6 text-mint" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Create New Password</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Enter a new password to regain access to your account.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/20 flex gap-2 text-sm text-coral">
            <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">New Password</label>
            <Input 
              type="password" 
              placeholder="At least 6 characters"
              required
              minLength={6}
              value={pw} 
              onChange={e => setPw(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Confirm Password</label>
            <Input 
              type="password" 
              placeholder="Re-enter your password"
              required
              minLength={6}
              value={pwConfirm} 
              onChange={e => setPwConfirm(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>

          <Button 
            disabled={loading || !pw || !pwConfirm}
            type="submit"
            className="w-full h-11 font-bold gradient-mint text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Password requirements: At least 6 characters
        </div>
      </Card>
    </div>
  );
}
