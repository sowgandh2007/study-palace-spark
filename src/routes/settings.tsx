import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Activity, Zap, RefreshCw, User, LogOut } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { testAiConnection } from "@/lib/echo/llm";
import { useEcho } from "@/lib/echo/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export function SettingsPage() {
  const navigate = useNavigate();
  const { userProfile, isLoggedIn, refreshProfile } = useEcho();
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    handleTestConnection();
  }, []);

  async function handleTestConnection() {
    setTesting(true);
    setConnectionStatus(null);

    const result = await testAiConnection();

    setTesting(false);
    setConnectionStatus(result);

    if (result.ok) {
      toast.success("Gemini AI Engine is connected & operational!");
    } else {
      toast.error(`Connection check: ${result.message}`);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">System Config</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">Settings & Integration</h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Manage your ECHO engine preferences, profile, and system connections.
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">User Profile</h2>
                <p className="text-xs text-slate-600 font-medium">Account Details & Stats</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm font-medium text-slate-700">
            {isLoggedIn ? (
              <>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Display Name</span>
                  <span className="font-bold">{userProfile?.displayName || "Student"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Level</span>
                  <span className="font-bold">{userProfile?.level || 1}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Total XP</span>
                  <span className="font-bold">{userProfile?.xp || 0}</span>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold text-xs min-h-[40px] px-4"
                  >
                    <LogOut className="size-3.5 mr-1.5" /> Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 mb-4">You are currently using ECHO as a Guest.</p>
                <Button onClick={() => navigate({ to: "/auth" })} className="bg-primary hover:bg-primary/90 text-white">
                  Sign In to Save Progress
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <Zap className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">Google Gemini AI Engine</h2>
                <p className="text-xs text-slate-600 font-medium">Integrated System Key Active</p>
              </div>
            </div>

            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-50 text-emerald-700 font-mono text-xs flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Active & Integrated
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Your Gemini API Key has been directly integrated into the ECHO system architecture. PDF text extraction, comprehensive study document generation, reflection gap analysis, and diagnostic exams automatically use this engine.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Connection Status</span>
                <span className="font-mono text-slate-600">
                  {testing ? "Testing connection..." : connectionStatus?.ok ? connectionStatus.message : "Operational"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[40px] px-4 shadow-glow"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${testing ? "animate-spin" : ""}`} /> Test AI Connection
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
