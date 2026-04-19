import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated!"); nav("/");
  };
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-pop">
        <h1 className="text-2xl font-bold mb-6">Set a new password</h1>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>New password</Label><Input type="password" required minLength={6} value={pw} onChange={(e)=>setPw(e.target.value)} /></div>
          <Button type="submit" className="w-full h-12 gradient-coral text-white border-0">Update password</Button>
        </form>
      </Card>
    </div>
  );
}
