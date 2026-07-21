import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Welcome to StudySphere!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  }

  async function handleGuest() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Guest login failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">StudySphere</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Continue your streak." : "Join the study revolution."}
        </p>

        <form onSubmit={handleEmail} className="mt-8 space-y-3">
          {mode === "signup" && (
            <Field icon={<User className="h-4 w-4" />}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full bg-transparent outline-none" />
            </Field>
          )}
          <Field icon={<Mail className="h-4 w-4" />}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-transparent outline-none" />
          </Field>
          <Field icon={<Lock className="h-4 w-4" />}>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-transparent outline-none" />
          </Field>
          <button disabled={loading} className="w-full rounded-2xl gradient-brand py-3.5 text-sm font-bold text-primary-foreground glow disabled:opacity-60">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <button onClick={handleGoogle} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold hover:bg-accent">
            <GoogleIcon /> Continue with Google
          </button>
          <button onClick={handleGuest} disabled={loading} className="w-full rounded-2xl border border-border bg-card/60 py-3.5 text-sm font-semibold hover:bg-accent">
            Continue as guest
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? "New here? " : "Have an account? "}
          <span className="font-semibold text-foreground underline underline-offset-4">
            {mode === "signin" ? "Create account" : "Sign in"}
          </span>
        </button>
      </div>
    </main>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.94 0 3.24.83 3.98 1.53l2.72-2.62A9.6 9.6 0 0 0 12 2.3 9.7 9.7 0 1 0 21.7 12c0-.65-.07-1.14-.16-1.8H12z"/>
    </svg>
  );
}
