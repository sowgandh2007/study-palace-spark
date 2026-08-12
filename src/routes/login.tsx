import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrainCircuit, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/assessment" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 card-shadow">
        <div className="text-center space-y-2">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 border border-primary/40 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to ECHO Engine</h1>
          <p className="text-xs text-muted-foreground">Evidence-based conceptual honesty & diagnostic verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
            <Input
              required
              type="email"
              placeholder="student@echo.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-background/60"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <Input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-background/60"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Sign In
          </Button>
        </form>

        <div className="pt-2 text-center text-xs">
          <Link to="/assessment" search={{ concept: "binary-search", demo: "true" }} className="font-semibold text-primary hover:underline">
            Try Binary Search Demo Probe (No login needed) →
          </Link>
        </div>
      </div>
    </div>
  );
}
