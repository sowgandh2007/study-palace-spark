import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Lightbulb, BookOpen, ListChecks, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/assistant")({
  component: Assistant,
});

const SYSTEM = `You are StudySphere AI, a friendly, patient tutor. Explain clearly, offer step-by-step reasoning, and prefer hints over direct answers unless the user explicitly asks for the solution. Use short paragraphs and markdown.`;

const QUICK = [
  { label: "Explain a concept", icon: BookOpen, prefix: "Explain like I'm learning it for the first time: " },
  { label: "Summarize notes", icon: ListChecks, prefix: "Summarize these notes into key points: " },
  { label: "Give me a hint", icon: Lightbulb, prefix: "Give me a hint (not the answer) for: " },
  { label: "Make 5 MCQs", icon: HelpCircle, prefix: "Generate 5 multiple choice questions with answers for: " },
];

function Assistant() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  useEffect(() => {
    if (!uid || chatId) return;
    (async () => {
      const { data } = await supabase.from("ai_chats").select("id").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setChatId(data.id);
      else {
        const { data: c } = await supabase.from("ai_chats").insert({ user_id: uid, title: "Study Assistant" }).select("id").single();
        if (c) setChatId(c.id);
      }
    })();
  }, [uid, chatId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["ai-messages", chatId],
    enabled: !!chatId,
    queryFn: async () => (await supabase.from("ai_messages").select("*").eq("chat_id", chatId!).order("created_at")).data ?? [],
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!uid || !chatId) return;
      await supabase.from("ai_messages").insert({ chat_id: chatId, user_id: uid, role: "user", content: text });
      qc.invalidateQueries({ queryKey: ["ai-messages", chatId] });
      const history = [...messages, { role: "user", content: text }].slice(-12);
      const res = await call({
        data: {
          system: SYSTEM,
          messages: history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        },
      });
      await supabase.from("ai_messages").insert({ chat_id: chatId, user_id: uid, role: "assistant", content: res.text });
      qc.invalidateQueries({ queryKey: ["ai-messages", chatId] });
    },
  });

  function submit() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    send.mutate(t);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-96px)] max-w-md md:max-w-4xl flex-col px-4 pt-6">
      <h1 className="px-1 text-xl font-black">Study Assistant</h1>
      <p className="px-1 text-xs text-muted-foreground">Ask anything. I give hints first.</p>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <button key={q.label} onClick={() => setInput(q.prefix)} className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">{q.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "mr-4 text-sm"}>
            {m.role === "user" ? m.content : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {send.isPending && <div className="mr-4 animate-pulse text-sm text-muted-foreground">Thinking…</div>}
      </div>

      <div className="sticky bottom-0 flex items-end gap-2 rounded-3xl border border-border bg-card p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Ask a question…"
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button onClick={submit} disabled={send.isPending || !input.trim()} className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
