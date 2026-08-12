import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Key, Server, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";
import type { ApiConfig } from "@/lib/echo/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { apiConfig, updateApiConfig } = useEcho();

  const [provider, setProvider] = useState<ApiConfig["activeProvider"]>(apiConfig.activeProvider);
  const [geminiKey, setGeminiKey] = useState(apiConfig.geminiApiKey);
  const [openaiKey, setOpenaiKey] = useState(apiConfig.openaiApiKey);
  const [anthropicKey, setAnthropicKey] = useState(apiConfig.anthropicApiKey);
  const [customEndpoint, setCustomEndpoint] = useState(apiConfig.customEndpoint);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const newConfig: ApiConfig = {
      activeProvider: provider,
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
      anthropicApiKey: anthropicKey.trim(),
      customEndpoint: customEndpoint.trim(),
    };
    updateApiConfig(newConfig);
    toast.success("API configuration updated successfully");
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">API Provider Configuration</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Configure AI API Providers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add your custom API keys for Google Gemini, OpenAI, Anthropic, or a Custom LLM endpoint.
          </p>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Active AI Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["gemini", "openai", "anthropic", "custom"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`rounded-xl border p-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background/50 hover:border-border/80 text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="size-3.5 text-primary" /> Google Gemini API Key
            </label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">Used for Gemini 1.5 Flash live probe generation and scoring.</p>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="size-3.5 text-primary" /> OpenAI API Key
            </label>
            <Input
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">Used for GPT-4o-mini json format probe generation.</p>
          </div>

          {/* Anthropic API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="size-3.5 text-primary" /> Anthropic Claude API Key
            </label>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">Used for Claude model evaluation.</p>
          </div>

          {/* Custom LLM Endpoint */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Server className="size-3.5 text-primary" /> Custom LLM Endpoint URL
            </label>
            <Input
              type="url"
              placeholder="https://your-custom-llm-server.com/api/generate"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              className="bg-background/60 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">Custom proxy or local Ollama/LM Studio HTTP endpoint.</p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border/60">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" /> Keys saved in local browser storage only
            </span>
            <Button type="submit">
              Save API Configuration <CheckCircle2 className="ml-1.5 size-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
