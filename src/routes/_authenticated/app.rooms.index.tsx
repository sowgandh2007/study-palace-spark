import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Users, Lock, Globe, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { shortCode } from "@/lib/studysphere";

export const Route = createFileRoute("/_authenticated/app/rooms/")({
  component: Rooms,
});

function Rooms() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [code, setCode] = useState("");

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];

      const { data } = await supabase
        .from("room_members")
        .select("room_id, rooms(*, room_members(count))")
        .eq("user_id", u.user.id);

      return (data ?? [])
        .map((m: any) => m.rooms)
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  useEffect(() => {
    const ch = supabase.channel("rooms-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
        qc.invalidateQueries({ queryKey: ["rooms"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members" }, () => {
        qc.invalidateQueries({ queryKey: ["rooms"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const roomCode = shortCode();
    const { data, error } = await supabase.from("rooms").insert({
      name: name || "Study Room", subject: subject || null, is_public: isPublic, code: roomCode, owner_id: u.user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("room_members").insert({ room_id: data.id, user_id: u.user.id, role: "owner", subject });
    qc.invalidateQueries({ queryKey: ["rooms"] });
    setCreating(false);
    navigate({ to: "/app/rooms/$roomId", params: { roomId: data.id } });
  }

  async function joinByCode(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: room, error } = await supabase.from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
    if (error || !room) { toast.error("Room not found"); return; }
    await supabase.from("room_members").upsert({ room_id: room.id, user_id: u.user.id, role: "member" }, { onConflict: "room_id,user_id" });
    setJoining(false);
    navigate({ to: "/app/rooms/$roomId", params: { roomId: room.id } });
  }

  return (
    <div className="mx-auto max-w-md md:max-w-5xl px-5 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Study Rooms</h1>
        <div className="flex gap-2">
          <button onClick={() => setJoining(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"><Hash className="h-4 w-4" /></button>
          <button onClick={() => setCreating(true)} className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground glow"><Plus className="h-5 w-5" /></button>
        </div>
      </header>

      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
        {rooms.length === 0 && (
          <li className="col-span-full rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No rooms yet. Create your first one to study with friends.
          </li>
        )}
        {rooms.map((r: any) => (
          <Link key={r.id} to="/app/rooms/$roomId" params={{ roomId: r.id }} className="block rounded-3xl border border-border bg-card p-4 card-shadow transition-transform active:scale-[0.99]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">{r.name}</h3>
                {r.subject && <p className="text-xs text-muted-foreground">{r.subject}</p>}
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                {r.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.room_members?.[0]?.count ?? 0} members</span>
              <span className="font-mono font-semibold text-foreground">{r.code}</span>
            </div>
          </Link>
        ))}
      </ul>

      {creating && (
        <Modal onClose={() => setCreating(false)} title="Create room">
          <form onSubmit={createRoom} className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" required className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
            <label className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <span>Public room</span>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-5 w-5 accent-[color:var(--brand)]" />
            </label>
            <button className="w-full rounded-2xl gradient-brand py-3.5 text-sm font-bold text-primary-foreground glow">Create</button>
          </form>
        </Modal>
      )}

      {joining && (
        <Modal onClose={() => setJoining(false)} title="Join with code">
          <form onSubmit={joinByCode} className="space-y-3">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDEF" required className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center font-mono text-lg tracking-widest outline-none" />
            <button className="w-full rounded-2xl gradient-brand py-3.5 text-sm font-bold text-primary-foreground glow">Join</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 pb-8 card-shadow animate-in slide-in-from-bottom">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
