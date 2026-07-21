import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  component: Notifs,
});

function Notifs() {
  const qc = useQueryClient();
  const { data: userId } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: items = [] } = useQuery({
    queryKey: ["notifs", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", userId!).order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel("notif-" + userId).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => qc.invalidateQueries({ queryKey: ["notifs", userId] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  async function markAll() {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Notifications</h1>
        <button onClick={markAll} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Mark all read</button>
      </header>

      <ul className="mt-6 space-y-2">
        {items.length === 0 && (
          <li className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8" /> No notifications yet
          </li>
        )}
        {items.map((n) => (
          <li key={n.id} className={"rounded-2xl border p-3 " + (n.read ? "border-border bg-card" : "border-primary/40 bg-primary/10")}>
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-brand text-primary-foreground"><Bell className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {n.read && <Check className="h-4 w-4 text-muted-foreground" />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
