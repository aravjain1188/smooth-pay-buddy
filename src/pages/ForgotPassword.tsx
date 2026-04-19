import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    setSent(true); toast.success("Reset link sent!");
  };
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-pop">
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">We'll email you a magic link.</p>
        {sent ? <p className="text-success">Check your inbox!</p> : (
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full h-12 gradient-coral text-white border-0">Send reset link</Button>
          </form>
        )}
        <Link to="/auth" className="block text-center text-sm text-primary mt-4 hover:underline">Back to sign in</Link>
      </Card>
    </div>
  );
}
