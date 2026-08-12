import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, CheckCircle2, AlertTriangle, Loader2, Activity, RefreshCw } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
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

    // Save configuration first before testing
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
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">System Configuration</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">AI API Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your AI provider keys and model selections for ECHO reflection analysis, targeted probe generation, and study plan recommendations.
          </p>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-6 sm:p-8">
          {/* Active Provider Radio Cards */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Active AI Provider
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "gemini", name: "Google Gemini", badge: "Recommended" },
                  { id: "openai", name: "OpenAI", badge: "GPT-4o" },
                  { id: "anthropic", name: "Anthropic Claude", badge: "Claude 3.5" },
                  { id: "custom", name: "Custom LLM Endpoint", badge: "Local/Proxy" },
                ] as { id: ApiProviderId; name: string; badge: string }[]
              ).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setConfig({ ...config, activeProvider: p.id })}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    config.activeProvider === p.id
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                      : "border-border bg-background/50 hover:border-border/80 text-muted-foreground"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{p.badge}</span>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      config.activeProvider === p.id ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {config.activeProvider === p.id && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini Settings */}
          {config.activeProvider === "gemini" && (
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
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
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gemini API Key</label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  className="mt-1 bg-background font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Model Selection</label>
                <select
                  value={config.geminiModel || "gemini-1.5-flash"}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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

          {/* OpenAI Settings */}
          {config.activeProvider === "openai" && (
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">OpenAI Settings</h3>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">OpenAI API Key</label>
                <Input
                  type="password"
                  placeholder="sk-proj-..."
                  value={config.openaiApiKey}
                  onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                  className="mt-1 bg-background font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Model Selection</label>
                <select
                  value={config.openaiModel || "gpt-4o-mini"}
                  onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                  <option value="gpt-4o">gpt-4o (High Intelligence)</option>
                </select>
              </div>
            </div>
          )}

          {/* Anthropic Settings */}
          {config.activeProvider === "anthropic" && (
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Anthropic Claude Settings</h3>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Anthropic API Key</label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={config.anthropicApiKey}
                  onChange={(e) => setConfig({ ...config, anthropicApiKey: e.target.value })}
                  className="mt-1 bg-background font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Model Selection</label>
                <select
                  value={config.anthropicModel || "claude-3-5-sonnet-20240620"}
                  onChange={(e) => setConfig({ ...config, anthropicModel: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet-20240620 (Recommended)</option>
                  <option value="claude-3-haiku-20240307">claude-3-haiku-20240307 (Fast)</option>
                </select>
              </div>
            </div>
          )}

          {/* Custom Endpoint Settings */}
          {config.activeProvider === "custom" && (
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Custom LLM Endpoint</h3>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Endpoint URL</label>
                <Input
                  type="text"
                  placeholder="https://api.openai.com/v1/chat/completions"
                  value={config.customEndpoint}
                  onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value })}
                  className="mt-1 bg-background font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Model Name</label>
                <Input
                  type="text"
                  placeholder="gpt-4o-mini"
                  value={config.customModel}
                  onChange={(e) => setConfig({ ...config, customModel: e.target.value })}
                  className="mt-1 bg-background font-mono text-xs"
                />
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
            <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing} className="w-full sm:w-auto">
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

            <Button type="submit" size="lg" className="w-full sm:w-auto">
              <Save className="mr-2 size-4" /> Save API Configuration
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
