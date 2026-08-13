import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, CheckCircle2, AlertTriangle, Loader2, Activity, RefreshCw } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiConfig, saveApiConfig, testAiConnection, discoverGeminiModels } from "@/lib/echo/llm";
import type { ApiProviderId, ApiConfig } from "@/lib/echo/types";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export function SettingsPage() {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig());
  const [testing, setTesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredGeminiModels, setDiscoveredGeminiModels] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    saveApiConfig(config);
    toast.success("API provider configuration saved");
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    const savedConfig = saveApiConfig(config);
    const result = await testAiConnection(savedConfig);

    setTesting(false);
    setTestResult(result);

    if (result.ok) {
      toast.success("AI API connection working!");
    } else {
      toast.error(`Connection failed: ${result.message}`);
    }
  }

  async function handleDiscoverModels() {
    if (!config.geminiApiKey.trim()) {
      toast.error("Please enter a Gemini API Key first");
      return;
    }
    setDiscovering(true);
    const models = await discoverGeminiModels(config.geminiApiKey.trim());
    setDiscovering(false);
    if (models.length > 0) {
      setDiscoveredGeminiModels(models);
      if (!models.includes(config.geminiModel)) {
        setConfig({ ...config, geminiModel: models[0]! });
      }
      toast.success(`Discovered ${models.length} generateContent models from Gemini!`);
    } else {
      toast.error("Could not discover models. Verify your Gemini API Key.");
    }
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">System Configuration</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">AI API Settings</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configure your AI provider keys or choose the Built-in ECHO Engine (Offline Mode) for diagnostic checks and study plan recommendations.
          </p>
        </div>

        <form onSubmit={handleSave} className="glass-card p-6 space-y-6 sm:p-8">
          {/* Active Provider Radio Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Active AI Provider Mode
            </label>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {(
                [
                  { id: "gemini", name: "Google Gemini", badge: "Live API" },
                  { id: "openai", name: "OpenAI", badge: "GPT-4o" },
                  { id: "anthropic", name: "Anthropic Claude", badge: "Claude 3.5" },
                  { id: "custom", name: "Custom LLM Endpoint", badge: "Local/Proxy" },
                ] as { id: ApiProviderId; name: string; badge: string }[]
              ).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setConfig({ ...config, activeProvider: p.id })}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all min-h-[52px] ${
                    config.activeProvider === p.id
                      ? "border-primary bg-primary/20 text-white shadow-glow"
                      : "border-white/10 bg-black/20 hover:border-white/30 text-slate-400"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{p.badge}</span>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      config.activeProvider === p.id ? "border-primary bg-primary" : "border-white/20"
                    }`}
                  >
                    {config.activeProvider === p.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini Settings */}
          {config.activeProvider === "gemini" && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Google Gemini Settings</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleDiscoverModels}
                  disabled={discovering}
                  className="text-xs text-primary"
                >
                  {discovering ? (
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="size-3.5 mr-1" />
                  )}
                  Discover Models
                </Button>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gemini API Key</label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  className="mt-1 bg-black/50 border-white/10 font-mono text-xs text-white min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Model Selection</label>
                <select
                  value={config.geminiModel || "gemini-1.5-flash"}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs font-mono font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Latest Generation)</option>
                  {discoveredGeminiModels
                    .filter((m) => !["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"].includes(m))
                    .map((m) => (
                      <option key={m} value={m}>
                        {m} (Discovered)
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Test Connection Output */}
          {testResult && (
            <div
              className={`rounded-xl border p-4 text-xs font-mono space-y-1 ${
                testResult.ok
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                <span>{testResult.ok ? "✓ AI Connection Working" : "✕ Connection Failed"}</span>
              </div>
              <p className="text-[11px] opacity-90">{testResult.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing} className="border-white/20 bg-white/5 hover:bg-white/10 w-full sm:w-auto min-h-[44px]">
              {testing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Testing Connection...
                </>
              ) : (
                <>
                  <Activity className="mr-2 size-4 text-primary" /> Test Connection
                </>
              )}
            </Button>

            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-glow w-full sm:w-auto min-h-[44px]">
              <Save className="mr-2 size-4" /> Save Configuration
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
