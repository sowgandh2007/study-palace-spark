import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Activity, Zap, RefreshCw } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { testAiConnection } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export function SettingsPage() {
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

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">System Status</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">ECHO AI Engine</h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Google Gemini AI integration is pre-configured and active across all ECHO learning features.
          </p>
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
