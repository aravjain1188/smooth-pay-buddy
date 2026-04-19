import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error(error.message || "Failed to send reset link");
        setLoading(false);
        return;
      }
      
      setSent(true);
      toast.success("Reset link sent to your email!");
      setLoading(false);
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-background to-card">
        <Card className="w-full max-w-md p-8 border-0 shadow-pop text-center pop-in">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-mint/10 p-4">
              <CheckCircle className="size-8 text-mint" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We've sent a password reset link to <strong>{email}</strong>. Click the link to reset your password.
          </p>
          <div className="bg-card/50 border border-border rounded-lg p-4 mb-6 text-left text-sm">
            <p className="font-semibold mb-2">What's next?</p>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Open the email from Founders Gauntlet</li>
              <li>Click the password reset link</li>
              <li>Create a new password</li>
              <li>Log back in and play!</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Reset link expires in 24 hours</p>
          <Button onClick={() => nav("/auth")} className="w-full h-11 font-bold gradient-mint text-white mb-2">
            Back to Login
          </Button>
          <button onClick={() => setSent(false)} className="text-sm text-primary hover:underline w-full py-2">
            Didn't receive email? Try again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-background to-card">
      <Card className="w-full max-w-md p-6 border-0 shadow-pop pop-in">
        <button 
          onClick={() => nav("/auth")} 
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Login
        </button>
        
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-coral/10 p-3">
            <Mail className="size-6 text-coral" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-center">Reset Password</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Enter your email and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email Address</label>
            <Input 
              placeholder="your@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email"
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <Button 
            disabled={loading || !email} 
            type="submit"
            className="w-full h-11 font-bold gradient-coral text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> 
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Remember your password? <button onClick={() => nav("/auth")} className="text-primary font-semibold hover:underline">Log in</button></p>
        </div>
      </Card>
    </div>
  );
}
