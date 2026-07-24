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
      arr.push({ day: key, minutes: heatmap?.get(key) ?? 0 });
    }
    return arr;
  }, [heatmap]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { data: found } = await supabase.from("profiles").select("id,display_name").ilike("display_name", newFriend).limit(1).maybeSingle();
    if (!found) { toast.error("User not found"); return; }
    if (found.id === profile.id) { toast.error("That's you 😉"); return; }
    await supabase.from("friendships").upsert({ user_id: profile.id, friend_id: found.id, status: "accepted" }, { onConflict: "user_id,friend_id" });
    setNewFriend("");
    qc.invalidateQueries({ queryKey: ["friends", profile.id] });
    toast.success(`Added ${found.display_name}`);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    await supabase.from("profiles").update({ display_name: name }).eq("id", profile.id);
    setEditing(false);
    qc.invalidateQueries();
  }

  if (!profile) return null;
  const xp = xpProgress(profile.xp);

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full gradient-brand text-2xl font-black text-primary-foreground glow">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveName} className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder={profile.display_name} className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
              <button className="rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground">Save</button>
            </form>
          ) : (
            <>
              <h1 className="truncate text-xl font-black">{profile.display_name}</h1>
              <p className="text-xs text-primary">{profile.title}</p>
              <button onClick={() => { setEditing(true); setName(profile.display_name); }} className="mt-1 text-[11px] text-muted-foreground underline">Edit name</button>
            </>
          )}
        </div>
        <button onClick={signOut} className="grid h-10 w-10 place-items-center rounded-xl border border-border"><LogOut className="h-4 w-4" /></button>
      </header>

      <section className="mt-5 rounded-3xl gradient-brand p-5 text-primary-foreground glow">
        <div className="flex items-center justify-between">
          <div><p className="text-xs opacity-80">Level {xp.level}</p><p className="text-lg font-bold">{profile.xp} XP</p></div>
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25"><div className="h-full bg-white/90" style={{ width: `${xp.pct}%` }} /></div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold">Activity</h2>
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
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><Award className="h-4 w-4" /> Badges</h2>
        <div className="flex flex-wrap gap-2">
          {badges.length === 0 && <p className="text-xs text-muted-foreground">Earn your first badge by completing missions.</p>}
          {badges.map((b: any) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold">🏆 {b.badges?.name}</div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4" /> Friends</h2>
        <form onSubmit={addFriend} className="flex gap-2">
          <input value={newFriend} onChange={e => setNewFriend(e.target.value)} placeholder="Search by display name" className="flex-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm outline-none" />
          <button className="rounded-2xl gradient-brand px-4 text-sm font-bold text-primary-foreground">Add</button>
        </form>
        <ul className="mt-3 space-y-2">
          {friends.map((f: any) => {
            const other = f.user_id === profile.id ? f.friend : f.user;
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{other?.display_name?.charAt(0)}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{other?.display_name}</p><p className="text-[11px] text-muted-foreground">{other?.xp} XP · {other?.streak}d streak</p></div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Link to="/app/mastery" className="rounded-2xl gradient-brand p-3 text-center text-xs font-semibold text-primary-foreground glow">Mastery</Link>
        <Link to="/app/skills" className="rounded-2xl border border-border bg-card p-3 text-center text-xs font-semibold">Skill Tree</Link>
        <Link to="/app/notifications" className="rounded-2xl border border-border bg-card p-3 text-center text-xs font-semibold">Alerts</Link>
      </div>
    </div>
  );
}
