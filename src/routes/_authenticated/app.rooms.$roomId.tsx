import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send, Pin, Trash2, LogOut, Users, MessageSquare, FileText, PenTool, Copy, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/rooms/$roomId")({
  component: RoomPage,
});

type Tab = "members" | "chat" | "resources" | "board";

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("members");
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null)); }, []);

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle()).data,
  });

  // ensure membership
  useEffect(() => {
    if (!meId) return;
    supabase.from("room_members").upsert({ room_id: roomId, user_id: meId }, { onConflict: "room_id,user_id" }).then(() => {
      qc.invalidateQueries({ queryKey: ["members", roomId] });
    });
  }, [meId, roomId, qc]);

  const isOwner = !!room && !!meId && room.owner_id === meId;

  async function leave() {
    if (!meId) return;
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", meId);
    navigate({ to: "/app/rooms" });
  }

  async function deleteRoom() {
    if (!confirm("Delete this room? This cannot be undone.")) return;
    await supabase.from("rooms").delete().eq("id", roomId);
    navigate({ to: "/app/rooms" });
  }

  if (!room) return <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate({ to: "/app/rooms" })} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"><ArrowLeft className="h-4 w-4" /></button>
        <div className="mx-3 flex-1 text-center">
          <h1 className="truncate text-base font-bold">{room.name}</h1>
          <button
            onClick={() => { navigator.clipboard.writeText(room.code); toast.success("Code copied"); }}
            className="mx-auto mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]"
          >
            {room.code} <Copy className="h-3 w-3" />
          </button>
        </div>
        {isOwner ? (
          <button onClick={deleteRoom} className="grid h-10 w-10 place-items-center rounded-xl border border-destructive/40 text-destructive"><Trash2 className="h-4 w-4" /></button>
        ) : (
          <button onClick={leave} className="grid h-10 w-10 place-items-center rounded-xl border border-border"><LogOut className="h-4 w-4" /></button>
        )}
      </header>

      <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl border border-border bg-card p-1 text-xs">
        {(["members","chat","resources","board"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"rounded-xl py-2 font-semibold capitalize transition-colors " + (tab === t ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
            {t === "board" ? "Whiteboard" : t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "members" && <MembersTab roomId={roomId} meId={meId} />}
        {tab === "chat" && <ChatTab roomId={roomId} meId={meId} isOwner={isOwner} />}
        {tab === "resources" && <ResourcesTab roomId={roomId} meId={meId} />}
        {tab === "board" && <WhiteboardTab roomId={roomId} meId={meId} />}
      </div>
    </div>
  );
}

function MembersTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: ["members", roomId],
    queryFn: async () => {
      const { data } = await supabase.from("room_members").select("*, profiles(*)").eq("room_id", roomId);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("rm-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["members", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  // local session timer heartbeat
  useEffect(() => {
    if (!meId) return;
    const t = setInterval(async () => {
      await supabase.from("room_members").update({ timer_seconds: (Math.floor(Date.now() / 1000)) }).eq("room_id", roomId).eq("user_id", meId);
    }, 30000);
    return () => clearInterval(t);
  }, [meId, roomId]);

  return (
    <ul className="space-y-3">
      {members.map((m: any) => {
        const p = m.profiles;
        return (
          <li key={m.id} className="rounded-2xl border border-border bg-card p-4 card-shadow">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full gradient-brand text-lg font-bold text-primary-foreground">
                {(p?.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{p?.display_name ?? "Guest"}</p>
                  <StatusPill status={m.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {m.subject || "Free study"} {m.topic ? "· " + m.topic : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] text-muted-foreground">
              <Metric label="XP" value={p?.xp ?? 0} />
              <Metric label="Streak" value={(p?.streak ?? 0) + "d"} />
              <Metric label="Focus" value={m.focus_score} />
              <Metric label="Progress" value={m.progress_pct + "%"} />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full gradient-brand" style={{ width: `${m.progress_pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    studying: "bg-success/20 text-success",
    quiz: "bg-info/20 text-info",
    break: "bg-warning/20 text-warning",
    offline: "bg-muted text-muted-foreground",
  };
  return <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize " + (map[status] ?? "bg-muted")}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 py-1.5">
      <p className="text-xs font-bold text-foreground">{value}</p>
      <p>{label}</p>
    </div>
  );
}

const EMOJIS = ["👍","🔥","💯","🎉","😂","❤️"];

function ChatTab({ roomId, meId, isOwner }: { roomId: string; meId: string | null; isOwner: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["msgs", roomId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*, profiles(display_name), message_reactions(emoji,user_id)").eq("room_id", roomId).order("created_at");
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("msg-" + roomId)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, () => qc.invalidateQueries({ queryKey: ["msgs", roomId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => qc.invalidateQueries({ queryKey: ["msgs", roomId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !meId) return;
    const t = body; setBody("");
    await supabase.from("messages").insert({ room_id: roomId, user_id: meId, body: t });
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from("messages").update({ pinned: !pinned }).eq("id", id);
  }
  async function react(mid: string, emoji: string) {
    if (!meId) return;
    await supabase.from("message_reactions").upsert({ message_id: mid, user_id: meId, emoji }, { onConflict: "message_id,user_id,emoji" });
  }

  const pinned = messages.filter((m: any) => m.pinned);

  return (
    <div>
      {pinned.length > 0 && (
        <div className="mb-3 space-y-2">
          {pinned.map((m: any) => (
            <div key={"p" + m.id} className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary"><Pin className="h-3 w-3" /> Pinned</div>
              <p className="mt-1"><b>{m.profiles?.display_name}:</b> {m.body}</p>
            </div>
          ))}
        </div>
      )}
      <div ref={listRef} className="h-[55vh] space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3">
        {messages.map((m: any) => {
          const mine = m.user_id === meId;
          const reactions: Record<string, number> = {};
          (m.message_reactions ?? []).forEach((r: any) => { reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1; });
          return (
            <div key={m.id} className={"group flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[80%] rounded-2xl px-3 py-2 text-sm " + (mine ? "gradient-brand text-primary-foreground" : "bg-muted")}>
                {!mine && <p className="text-[10px] font-bold opacity-70">{m.profiles?.display_name}</p>}
                <p>{m.body}</p>
                {Object.keys(reactions).length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {Object.entries(reactions).map(([e, n]) => (
                      <span key={e} className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px]">{e} {n}</span>
                    ))}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100">
                  {EMOJIS.map((e) => <button key={e} onClick={() => react(m.id, e)}>{e}</button>)}
                  {(mine || isOwner) && <button onClick={() => togglePin(m.id, m.pinned)}><Pin className="h-3 w-3" /></button>}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Say hello 👋</p>}
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Smile className="h-4 w-4 text-muted-foreground" />
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message..." className="flex-1 bg-transparent text-sm outline-none" />
        <button className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-primary-foreground"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

function ResourcesTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const qc = useQueryClient();
  const { data: resources = [] } = useQuery({
    queryKey: ["res", roomId],
    queryFn: async () => (await supabase.from("resources").select("*, profiles(display_name)").eq("room_id", roomId).order("created_at", { ascending: false })).data ?? [],
  });
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !meId) return;
    setUploading(true);
    try {
      const path = `${roomId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("resources").upload(path, file);
      if (error) throw error;
      const ext = file.name.split(".").pop()?.toLowerCase();
      const kind: "pdf" | "image" | "note" | "mindmap" | "paper" =
        ext === "pdf" ? "pdf" : ["png","jpg","jpeg","gif","webp"].includes(ext ?? "") ? "image" : "note";
      await supabase.from("resources").insert({ room_id: roomId, user_id: meId, title: file.name, kind, storage_path: path });
      qc.invalidateQueries({ queryKey: ["res", roomId] });
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function download(path: string) {
    const { data } = await supabase.storage.from("resources").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-6 text-sm font-semibold text-muted-foreground">
        {uploading ? "Uploading..." : "Upload PDF / Image / Notes"}
        <input type="file" onChange={upload} className="hidden" />
      </label>
      <ul className="mt-3 space-y-2">
        {resources.map((r: any) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-5 w-5" /></div>
            <button onClick={() => download(r.storage_path)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="text-[11px] text-muted-foreground">{r.kind} · {r.profiles?.display_name}</p>
            </button>
          </li>
        ))}
        {resources.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No resources yet.</li>}
      </ul>
    </div>
  );
}

function WhiteboardTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const pathRef = useRef<Array<[number, number]>>([]);
  const [color, setColor] = useState("#c084fc");

  const draw = (paths: Array<{ path: any; color?: string }>) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of paths) {
      const pts = (s.path?.pts ?? []) as Array<[number, number]>;
      if (pts.length < 2) continue;
      ctx.strokeStyle = s.path?.color ?? "#c084fc";
      ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  };

  const load = async () => {
    const { data } = await supabase.from("whiteboard_strokes").select("*").eq("room_id", roomId).order("created_at");
    draw((data ?? []) as any);
  };

  useEffect(() => { load(); }, [roomId]);

  useEffect(() => {
    const ch = supabase.channel("wb-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "whiteboard_strokes", filter: `room_id=eq.${roomId}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  function point(e: React.PointerEvent) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * c.width), Math.round(((e.clientY - r.top) / r.height) * c.height)] as [number, number];
  }
  function down(e: React.PointerEvent) { drawingRef.current = true; pathRef.current = [point(e)]; }
  function move(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    pathRef.current.push(point(e));
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const [a, b] = pathRef.current.slice(-2);
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  async function up() {
    if (!drawingRef.current || !meId) return;
    drawingRef.current = false;
    if (pathRef.current.length < 2) return;
    await supabase.from("whiteboard_strokes").insert({ room_id: roomId, user_id: meId, path: { pts: pathRef.current, color } as any });
    pathRef.current = [];
  }

  async function clearAll() {
    if (!confirm("Erase entire whiteboard?")) return;
    await supabase.from("whiteboard_strokes").delete().eq("room_id", roomId);
    const c = canvasRef.current; if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }
  function exportPng() {
    const url = canvasRef.current!.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = "whiteboard.png"; a.click();
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {["#c084fc","#38bdf8","#f472b6","#facc15","#f87171","#ffffff"].map((c) => (
          <button key={c} onClick={() => setColor(c)} className={"h-7 w-7 rounded-full border-2 " + (color === c ? "border-foreground" : "border-transparent")} style={{ backgroundColor: c }} />
        ))}
        <button onClick={exportPng} className="ml-auto rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Export</button>
        <button onClick={clearAll} className="rounded-xl border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={720} height={960}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="aspect-[3/4] w-full touch-none rounded-2xl border border-border bg-card"
      />
    </div>
  );
}
