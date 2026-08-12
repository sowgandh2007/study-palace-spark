import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, Award, UserPlus, GraduationCap, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWeeklyHeatmap, xpProgress } from "@/lib/studysphere";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: Profile,
});

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [newFriend, setNewFriend] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      return data;
    },
  });

  const { data: heatmap } = useQuery({
    queryKey: ["heat", profile?.id],
    enabled: !!profile,
    queryFn: () => getWeeklyHeatmap(profile!.id),
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("friendships").select("*, friend:profiles!friendships_friend_id_fkey(*), user:profiles!friendships_user_id_fkey(*)").or(`user_id.eq.${profile!.id},friend_id.eq.${profile!.id}`);
      return data ?? [];
    },
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["badges", profile?.id],
    enabled: !!profile,
    queryFn: async () => (await supabase.from("user_badges").select("*, badges(*)").eq("user_id", profile!.id)).data ?? [],
  });

  const { data: mastery = [] } = useQuery({
    queryKey: ["profile-mastery", profile?.id],
    enabled: !!profile,
    queryFn: async () => (await supabase.from("subject_mastery").select("subject,mastery").eq("user_id", profile!.id).order("mastery", { ascending: false }).limit(4)).data ?? [],
  });

  const days = useMemo(() => {
    const arr: { day: string; minutes: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ day: key, minutes: heatmap?.[key] ?? 0 });
    }
    return arr;
  }, [heatmap]);

  const xp = xpProgress(profile?.xp ?? 0);

  async function updateName(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !name) return;
    await supabase.from("profiles").update({ display_name: name }).eq("id", profile.id);
    setEditing(false);
    qc.invalidateQueries();
    toast.success("Name updated");
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !newFriend) return;
    const { data: target } = await supabase.from("profiles").select("id").ilike("display_name", newFriend.trim()).maybeSingle();
    if (!target) { toast.error("User not found"); return; }
    await supabase.from("friendships").insert({ user_id: profile.id, friend_id: target.id, status: "accepted" });
    setNewFriend("");
    qc.invalidateQueries();
    toast.success("Friend added");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md md:max-w-xl px-5 pt-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">ECHO Verification Profile</h1>
        <button onClick={signOut} className="flex items-center gap-1 text-xs text-destructive font-medium hover:underline">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 border border-primary/30 text-xl font-bold text-primary font-mono">
          {profile.display_name?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={updateName} className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none" />
              <button className="rounded-xl bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Save</button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold">{profile.display_name}</h2>
              <button onClick={() => { setName(profile.display_name ?? ""); setEditing(true); }} className="text-muted-foreground hover:text-foreground">
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-xs font-medium text-primary mt-0.5">{profile.title || "Verified Student"}</p>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5 card-shadow">
        <div className="flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Verification Level {xp.level}</p><p className="font-mono text-base font-bold text-foreground mt-0.5">{profile.xp} XP</p></div>
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${xp.pct}%` }} /></div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Activity Map</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="grid grid-cols-[repeat(12,1fr)] gap-1">
            {days.map((d) => {
              const l = d.minutes === 0 ? 0 : d.minutes < 30 ? 1 : d.minutes < 60 ? 2 : d.minutes < 120 ? 3 : 4;
              const bg = ["bg-muted/50","bg-primary/20","bg-primary/40","bg-primary/70","bg-primary"][l];
              return <div key={d.day} title={`${d.day}: ${d.minutes} min`} className={"aspect-square rounded-[3px] " + bg} />;
            })}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Award className="h-4 w-4 text-primary" /> Conceptual Stability Map</h2>
          <Link to="/app/mastery" className="text-[11px] font-semibold text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {mastery.length === 0 && <p className="text-xs text-muted-foreground">Complete a diagnostic probe to build your stability map.</p>}
          {mastery.map((s: any) => {
            const m = Number(s.mastery);
            const bg = m >= 80 ? "bg-success" : m >= 60 ? "bg-primary" : m >= 40 ? "bg-warning" : "bg-destructive";
            return (
              <div key={s.subject} className="rounded-2xl border border-border bg-card p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs"><span className="font-semibold">{s.subject}</span><span className="font-mono font-bold">{Math.round(m)}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={"h-full " + bg} style={{ width: `${m}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Award className="h-4 w-4 text-primary" /> Verification Badges</h2>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 && <p className="text-xs text-muted-foreground">Earn your first badge by completing diagnostic probes.</p>}
          {badges.map((b: any) => (
            <div key={b.id} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold">{b.badges?.icon ?? "🏆"} {b.badges?.name}</div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><UserPlus className="h-4 w-4 text-primary" /> Verification Peers</h2>
        <form onSubmit={addFriend} className="flex gap-2">
          <input value={newFriend} onChange={e => setNewFriend(e.target.value)} placeholder="Search by display name" className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none" />
          <button className="rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">Add</button>
        </form>
        <ul className="mt-3 space-y-2">
          {friends.map((f: any) => {
            const other = f.user_id === profile.id ? f.friend : f.user;
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-foreground">{other?.display_name?.charAt(0)}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{other?.display_name}</p><p className="font-mono text-[10px] text-muted-foreground">{other?.xp} XP · {other?.streak}d activity</p></div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Link to="/app/mastery" className="rounded-xl bg-primary p-3 text-center text-xs font-semibold text-primary-foreground">Stability</Link>
        <Link to="/app/skills" className="rounded-xl border border-border bg-card p-3 text-center text-xs font-semibold hover:border-primary/50">Stability Tree</Link>
        <Link to="/app/notifications" className="rounded-xl border border-border bg-card p-3 text-center text-xs font-semibold hover:border-primary/50">Alerts</Link>
      </div>
    </div>
  );
}
