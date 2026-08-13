import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BrainCircuit, ArrowRight, ShieldCheck, UserCheck, Lock } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Signed in successfully (Demo Session)");
    navigate({ to: "/dashboard" });
  }

  function handleDemoStudent() {
    toast.success("Signed in as Student (Section B)");
    navigate({ to: "/dashboard" });
  }

  function handleDemoFaculty() {
    toast.success("Signed in as Faculty Portal Lead");
    navigate({ to: "/faculty" });
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-20">
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 pt-12 space-y-6">
        <div className="glass-card p-8 space-y-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 border border-primary/40 text-primary mx-auto shadow-glow">
            <BrainCircuit className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Sign In to ECHO</h1>
            <p className="text-xs text-slate-300 mt-1">Access your verified conceptual telemetry & adaptive study plan.</p>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="space-y-2 pt-2">
            <Button onClick={handleDemoStudent} className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow">
              <UserCheck className="mr-2 size-4" /> Demo Student Access
            </Button>
            <Button onClick={handleDemoFaculty} variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10">
              <ShieldCheck className="mr-2 size-4 text-primary" /> Demo Faculty Portal Access
            </Button>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#081236] px-3 font-mono text-[11px] uppercase tracking-wider text-slate-400">Or credentials</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <Input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-white text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-white text-xs"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow">
              Sign In <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
