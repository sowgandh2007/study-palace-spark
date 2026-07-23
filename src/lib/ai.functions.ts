import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AiInput = {
  system?: string;
  prompt?: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  json?: boolean;
  model?: string;
  cacheKey?: string;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const aiGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => data as AiInput)
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // Cache lookup
    if (data.cacheKey) {
      const { data: hit } = await context.supabase
        .from("ai_cache")
        .select("payload")
        .eq("cache_key", data.cacheKey)
        .maybeSingle();
      if (hit) return hit.payload as { text: string; json?: unknown };
    }

    const messages =
      data.messages ??
      [
        ...(data.system ? [{ role: "system" as const, content: data.system }] : []),
        { role: "user" as const, content: data.prompt ?? "" },
      ];

    const body: Record<string, unknown> = {
      model: data.model ?? "google/gemini-2.5-flash",
      messages,
    };
    if (data.json) body.response_format = { type: "json_object" };

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 429) throw new Error("Rate limited. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace billing.");
      throw new Error(`AI error ${res.status}: ${err.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content ?? "";
    let json: unknown = undefined;
    if (data.json) {
      try { json = JSON.parse(text); } catch { /* keep undefined */ }
    }
    const result = { text, json };

    if (data.cacheKey) {
      await context.supabase.from("ai_cache").insert({ cache_key: data.cacheKey, payload: result });
    }

    return result;
  });
