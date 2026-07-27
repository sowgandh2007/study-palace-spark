import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Pin, Trash2, LogOut, FileText, Copy, Smile,
  Music2, Timer, Play, Pause, ListTodo, Vote, Target, Activity, Plus, Check, X, Settings,
  Trophy, Sparkles, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/rooms/$roomId")({
  component: RoomPage,
});

// New tables aren't in generated types yet — use a loose client for those.
const sb = supabase as any;

type Tab = "members" | "chat" | "tasks" | "polls" | "goals" | "feed" | "files" | "board" | "quiz";

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("members");
  const [meId, setMeId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null)); }, []);

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => (await sb.from("rooms").select("*").eq("id", roomId).maybeSingle()).data,
  });

  const roomRef = useRef(room);
  roomRef.current = room;
  const meIdRef = useRef(meId);
  meIdRef.current = meId;

  useEffect(() => {
    if (!meId) return;
    supabase.from("room_members")
      .upsert({ room_id: roomId, user_id: meId }, { onConflict: "room_id,user_id" })
      .then(({ error }) => {
        if (error && !/duplicate/i.test(error.message)) toast.error(error.message);
        qc.invalidateQueries({ queryKey: ["members", roomId] });
        logEvent(roomId, meId, "joined", "joined the room").catch(() => {});
      });
  }, [meId, roomId, qc]);

  // Realtime for room row (playlist/break timer and deletion check)
  useEffect(() => {
    const ch = supabase.channel("room-" + roomId)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          const currentRoom = roomRef.current;
          const currentMeId = meIdRef.current;
          if (currentRoom && currentRoom.owner_id !== currentMeId) {
            toast.error("This room has been deleted by its owner.");
          }
          navigate({ to: "/app" });
        } else {
          qc.invalidateQueries({ queryKey: ["room", roomId] });
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc, navigate]);

  // Realtime for group quiz invitations
  useEffect(() => {
    if (!meId) return;
    const ch = supabase.channel("room-quiz-" + roomId)
      .on("broadcast", { event: "start-exam" }, ({ payload }) => {
        if (payload.hostId !== meId) {
          toast.info(`${payload.hostName} started a Live Group Exam!`, {
            description: `Topic: ${payload.topic} (${payload.duration} mins)`,
            action: {
              label: "Join Exam",
              onClick: () => {
                setTab("quiz");
                localStorage.setItem(`active-group-quiz:${roomId}`, JSON.stringify(payload));
                window.dispatchEvent(new Event("group-quiz-updated"));
              }
            },
            duration: 10000,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, meId]);

  const isOwner = !!room && !!meId && room.owner_id === meId;

  async function performLeave(): Promise<void> {
    if (!meId) return;
    setLeaving(true);
    await logEvent(roomId, meId, "left", "left the room");
    const { error } = await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", meId);
    if (error) {
      toast.error("Failed to leave room: " + error.message);
      setLeaving(false);
    } else {
      toast.success("Left room successfully");
      setIsLeaveDialogOpen(false);
      navigate({ to: "/app/rooms" });
    }
  }

  async function performDelete(retryCount = 0): Promise<void> {
    setDeleting(true);
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
      toast.error("Failed to delete room: " + error.message, {
        action: {
          label: "Retry",
          onClick: () => { performDelete(retryCount + 1); },
        },
      });
      setDeleting(false);
    } else {
      toast.success("Room deleted successfully");
      setIsDeleteDialogOpen(false);
      navigate({ to: "/app/rooms" });
    }
  }

  if (!room) return <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>;

  const tabs: Tab[] = ["members", "chat", "tasks", "polls", "goals", "feed", "files", "board", "quiz"];
  const label: Record<Tab, string> = {
    members: "Members", chat: "Chat", tasks: "Tasks", polls: "Polls",
    goals: "Goals", feed: "Feed", files: "Files", board: "Board",
    quiz: "Group Exam",
  };

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-24">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem
                onSelect={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => setIsLeaveDialogOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Room
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <PlaylistBar room={room} isOwner={isOwner} />
      <BreakTimerBar room={room} isOwner={isOwner} roomId={roomId} meId={meId} />

      <div className="mt-4 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 rounded-2xl border border-border bg-card p-1 text-xs w-max">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={"rounded-xl px-3 py-2 font-semibold transition-colors whitespace-nowrap " + (tab === t ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
              {label[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {tab === "members" && <MembersTab roomId={roomId} meId={meId} />}
        {tab === "chat" && <ChatTab roomId={roomId} meId={meId} isOwner={isOwner} />}
        {tab === "tasks" && <TasksTab roomId={roomId} meId={meId} />}
        {tab === "polls" && <PollsTab roomId={roomId} meId={meId} />}
        {tab === "goals" && <GoalsTab roomId={roomId} meId={meId} isOwner={isOwner} />}
        {tab === "feed" && <FeedTab roomId={roomId} />}
        {tab === "files" && <ResourcesTab roomId={roomId} meId={meId} isOwner={isOwner} />}
        {tab === "board" && <WhiteboardTab roomId={roomId} meId={meId} />}
        {tab === "quiz" && <GroupExamTab roomId={roomId} meId={meId} isOwner={isOwner} />}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this study room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Study Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this study room? You will need the room code to join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performLeave();
              }}
              disabled={leaving}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              {leaving ? "Leaving..." : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- shared helpers ----------

async function logEvent(roomId: string, userId: string, kind: string, message: string, meta: any = {}) {
  await sb.from("room_events").insert({ room_id: roomId, user_id: userId, kind, message, meta });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ---------- Playlist ----------

function detectPlaylist(url: string): string | null {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/spotify\.com/.test(url)) return "spotify";
  return "link";
}

function PlaylistBar({ room, isOwner }: { room: any; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(room.playlist_url ?? "");
  useEffect(() => { setVal(room.playlist_url ?? ""); }, [room.playlist_url]);

  async function save() {
    const url = val.trim() || null;
    const kind = url ? detectPlaylist(url) : null;
    const { error } = await supabase.from("rooms").update({ playlist_url: url, playlist_kind: kind } as any).eq("id", room.id);
    if (error) { toast.error(error.message); return; }
    toast.success(url ? "Playlist updated" : "Playlist cleared");
    setEditing(false);
  }

  if (!room.playlist_url && !editing) {
    if (!isOwner) return null;
    return (
      <button onClick={() => setEditing(true)} className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
        <Music2 className="h-4 w-4" /> Add shared study playlist
      </button>
    );
  }

  if (editing) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-card p-3">
        <label className="text-[10px] font-bold uppercase text-muted-foreground">Playlist URL</label>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="YouTube or Spotify link"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
        <div className="mt-2 flex gap-2">
          <button onClick={save} className="rounded-xl gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground">Save</button>
          <button onClick={() => setEditing(false)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-primary-foreground"><Music2 className="h-4 w-4" /></div>
      <a href={room.playlist_url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold underline">
        {room.playlist_kind === "youtube" ? "YouTube" : room.playlist_kind === "spotify" ? "Spotify" : "Playlist"} · Open
      </a>
      {isOwner && <button onClick={() => setEditing(true)} className="text-[11px] text-muted-foreground underline">Edit</button>}
    </div>
  );
}

// ---------- Break timer ----------

function BreakTimerBar({ room, isOwner, roomId, meId }: { room: any; isOwner: boolean; roomId: string; meId: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ends = room.break_ends_at ? new Date(room.break_ends_at).getTime() : 0;
  const remaining = Math.max(0, Math.round((ends - now) / 1000));
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (ends && remaining === 0 && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.success("Break over — back to studying!");
    }
    if (remaining > 0) notifiedRef.current = false;
  }, [remaining, ends]);

  async function startBreak(mins: number) {
    const to = new Date(Date.now() + mins * 60 * 1000).toISOString();
    const { error } = await supabase.from("rooms").update({ break_ends_at: to } as any).eq("id", room.id);
    if (error) { toast.error(error.message); return; }
    if (meId) logEvent(roomId, meId, "break", `started a ${mins} min break`).catch(() => {});
  }
  async function endBreak() {
    await supabase.from("rooms").update({ break_ends_at: null } as any).eq("id", room.id);
  }

  const active = remaining > 0;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <div className={"grid h-9 w-9 place-items-center rounded-xl " + (active ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground")}>
        <Timer className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{active ? "Shared break" : "No break running"}</p>
        <p className="text-[11px] text-muted-foreground">
          {active ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} left · everyone resumes together` : "Sync a break for the whole room"}
        </p>
      </div>
      {isOwner && (active
        ? <button onClick={endBreak} className="rounded-xl border border-border px-2 py-1 text-[11px] font-semibold"><Pause className="h-3 w-3" /></button>
        : <div className="flex gap-1">
            {[5, 10, 15].map((m) => (
              <button key={m} onClick={() => startBreak(m)} className="rounded-xl gradient-brand px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                {m}m
              </button>
            ))}
          </div>)}
    </div>
  );
}

// ---------- Members ----------

function MembersTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: ["members", roomId],
    queryFn: async () => {
      const { data } = await sb.from("room_members").select("*, profiles(*)").eq("room_id", roomId);
      const ids = (data ?? []).map((m: any) => m.user_id);
      if (!ids.length) return data ?? [];
      const { data: sm } = await sb.from("subject_mastery").select("user_id,subject,mastery").in("user_id", ids).order("mastery", { ascending: false });
      const topBy: Record<string, { subject: string; mastery: number }> = {};
      (sm ?? []).forEach((r: any) => { if (!topBy[r.user_id]) topBy[r.user_id] = { subject: r.subject, mastery: Number(r.mastery) }; });
      return (data ?? []).map((m: any) => ({ ...m, topMastery: topBy[m.user_id] ?? null }));
    },
  });

  useEffect(() => {
    const ch = supabase.channel("rm-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["members", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  useEffect(() => {
    if (!meId) return;
    const t = setInterval(async () => {
      await supabase.from("room_members").update({ timer_seconds: Math.floor(Date.now() / 1000) }).eq("room_id", roomId).eq("user_id", meId);
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
                {m.topMastery && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    🎯 {m.topMastery.subject} {Math.round(m.topMastery.mastery)}%
                  </p>
                )}
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

// ---------- Chat ----------

const EMOJIS = ["👍", "🔥", "💯", "🎉", "😂", "❤️"];

function ChatTab({ roomId, meId, isOwner }: { roomId: string; meId: string | null; isOwner: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["msgs", roomId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("messages")
        .select("*, profiles!messages_user_profile_fk(display_name), message_reactions(emoji,user_id)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("msg-" + roomId)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", roomId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
        () => qc.invalidateQueries({ queryKey: ["msgs", roomId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !meId || sending) return;
    const t = body.trim();
    setSending(true);
    setBody("");
    const { error } = await supabase.from("messages").insert({ room_id: roomId, user_id: meId, body: t });
    setSending(false);
    if (error) {
      toast.error(error.message);
      setBody(t);
      return;
    }
    qc.invalidateQueries({ queryKey: ["msgs", roomId] });
  }

  async function togglePin(id: string, pinned: boolean) {
    const { error } = await supabase.from("messages").update({ pinned: !pinned }).eq("id", id);
    if (error) toast.error(error.message);
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
              <p className="mt-1"><b>{m.profiles?.display_name ?? "Member"}:</b> {m.body}</p>
            </div>
          ))}
        </div>
      )}
      <div ref={listRef} className="h-[55vh] space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3">
        {isLoading && <p className="py-8 text-center text-xs text-muted-foreground">Loading messages...</p>}
        {!isLoading && messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Say hello 👋</p>}
        {messages.map((m: any, i: number) => {
          const mine = m.user_id === meId;
          const reactions: Record<string, number> = {};
          (m.message_reactions ?? []).forEach((r: any) => { reactions[r.emoji] = (reactions[r.emoji] ?? 0) + 1; });
          const prev = messages[i - 1];
          const showDay = !prev || fmtDay(prev.created_at) !== fmtDay(m.created_at);
          return (
            <div key={m.id}>
              {showDay && <p className="my-2 text-center text-[10px] font-bold uppercase text-muted-foreground">{fmtDay(m.created_at)}</p>}
              <div className={"group flex " + (mine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[80%] rounded-2xl px-3 py-2 text-sm " + (mine ? "gradient-brand text-primary-foreground" : "bg-muted")}>
                  {!mine && <p className="text-[10px] font-bold opacity-70">{m.profiles?.display_name ?? "Member"}</p>}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-1 text-[9px] opacity-60">{fmtTime(m.created_at)}</p>
                  {Object.keys(reactions).length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {Object.entries(reactions).map(([e, n]) => (
                        <span key={e} className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px]">{e} {n}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100">
                    {EMOJIS.map((e) => <button key={e} type="button" onClick={() => react(m.id, e)}>{e}</button>)}
                    {(mine || isOwner) && <button type="button" onClick={() => togglePin(m.id, m.pinned)}><Pin className="h-3 w-3" /></button>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <Smile className="h-4 w-4 text-muted-foreground" />
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message..." className="flex-1 bg-transparent text-sm outline-none" />
        <button disabled={sending || !body.trim()} className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}

// ---------- Tasks (shared to-do) ----------

function TasksTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const { data: todos = [] } = useQuery({
    queryKey: ["todos", roomId],
    queryFn: async () => (await sb.from("room_todos").select("*, profiles(display_name)").eq("room_id", roomId).order("done").order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("todo-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "room_todos", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["todos", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !meId) return;
    const t = title.trim(); setTitle("");
    const { error } = await sb.from("room_todos").insert({ room_id: roomId, user_id: meId, title: t });
    if (error) { toast.error(error.message); setTitle(t); }
  }
  async function toggle(t: any) {
    const done = !t.done;
    await sb.from("room_todos").update({ done, done_by: done ? meId : null }).eq("id", t.id);
    if (done && meId) logEvent(roomId, meId, "todo", `finished "${t.title}"`).catch(() => {});
  }
  async function del(id: string) {
    await sb.from("room_todos").delete().eq("id", id);
  }
  async function saveEdit() {
    if (!editing) return;
    await sb.from("room_todos").update({ title: editing.title }).eq("id", editing.id);
    setEditing(null);
  }

  const done = todos.filter((t: any) => t.done).length;

  return (
    <div>
      <div className="mb-3 rounded-2xl border border-border bg-card p-3">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Shared checklist</p>
        <p className="text-xl font-bold">{done} / {todos.length}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-brand transition-all" style={{ width: `${todos.length ? (done / todos.length) * 100 : 0}%` }} />
        </div>
      </div>
      <form onSubmit={add} className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
        <ListTodo className="h-4 w-4 text-muted-foreground" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task..." className="flex-1 bg-transparent text-sm outline-none" />
        <button className="grid h-8 w-8 place-items-center rounded-xl gradient-brand text-primary-foreground"><Plus className="h-4 w-4" /></button>
      </form>
      <ul className="space-y-2">
        {todos.map((t: any) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <button onClick={() => toggle(t)} className={"grid h-6 w-6 place-items-center rounded-md border " + (t.done ? "gradient-brand text-primary-foreground border-transparent" : "border-border")}>
              {t.done && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              {editing && editing.id === t.id ? (
                <input autoFocus value={editing.title} onChange={(e) => setEditing({ id: editing!.id, title: e.target.value })}
                  onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none" />
              ) : (
                <button onClick={() => setEditing({ id: t.id, title: t.title })} className="block w-full text-left">
                  <p className={"truncate text-sm font-semibold " + (t.done ? "line-through text-muted-foreground" : "")}>{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">by {t.profiles?.display_name ?? "member"}</p>
                </button>
              )}
            </div>
            {(t.user_id === meId) && (
              <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            )}
          </li>
        ))}
        {todos.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No tasks yet.</li>}
      </ul>
    </div>
  );
}

// ---------- Polls ----------

function PollsTab({ roomId, meId }: { roomId: string; meId: string | null }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState<string[]>(["", ""]);

  const { data: polls = [] } = useQuery({
    queryKey: ["polls", roomId],
    queryFn: async () => (await sb.from("room_polls").select("*, room_poll_votes(option_idx,user_id), profiles(display_name)").eq("room_id", roomId).order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("poll-" + roomId)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_polls", filter: `room_id=eq.${roomId}` }, () => qc.invalidateQueries({ queryKey: ["polls", roomId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "room_poll_votes" }, () => qc.invalidateQueries({ queryKey: ["polls", roomId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!meId) return;
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) { toast.error("Add a question and at least 2 options"); return; }
    const { error } = await sb.from("room_polls").insert({ room_id: roomId, user_id: meId, question: question.trim(), options: cleaned });
    if (error) { toast.error(error.message); return; }
    setCreating(false); setQuestion(""); setOpts(["", ""]);
  }

  async function vote(pollId: string, idx: number) {
    if (!meId) return;
    await sb.from("room_poll_votes").upsert({ poll_id: pollId, user_id: meId, option_idx: idx }, { onConflict: "poll_id,user_id" });
  }
  async function close(id: string) {
    await sb.from("room_polls").update({ closed: true }).eq("id", id);
  }
  async function remove(id: string) {
    await sb.from("room_polls").delete().eq("id", id);
  }

  return (
    <div>
      {!creating ? (
        <button onClick={() => setCreating(true)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground">
          <Vote className="h-4 w-4" /> New poll
        </button>
      ) : (
        <form onSubmit={create} className="mb-3 space-y-2 rounded-2xl border border-border bg-card p-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={o} onChange={(e) => setOpts(opts.map((x, j) => j === i ? e.target.value : x))} placeholder={`Option ${i + 1}`} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
              {opts.length > 2 && <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="text-muted-foreground"><X className="h-4 w-4" /></button>}
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpts([...opts, ""])} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">+ Option</button>
            <button className="rounded-xl gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground">Create</button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Cancel</button>
          </div>
        </form>
      )}
      <ul className="space-y-3">
        {polls.map((p: any) => {
          const opts: string[] = Array.isArray(p.options) ? p.options : [];
          const votes: any[] = p.room_poll_votes ?? [];
          const total = votes.length;
          const myVote = votes.find((v) => v.user_id === meId)?.option_idx;
          return (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm font-bold">{p.question}</p>
                {p.user_id === meId && (
                  <div className="flex items-center gap-1">
                    {!p.closed && <button onClick={() => close(p.id)} className="text-[10px] text-muted-foreground underline">Close</button>}
                    <button onClick={() => remove(p.id)} className="text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">by {p.profiles?.display_name ?? "member"} · {total} vote{total === 1 ? "" : "s"} {p.closed && "· closed"}</p>
              <div className="mt-2 space-y-2">
                {opts.map((label, i) => {
                  const count = votes.filter((v) => v.option_idx === i).length;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const mine = myVote === i;
                  return (
                    <button key={i} disabled={p.closed} onClick={() => vote(p.id, i)}
                      className={"relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-xs " + (mine ? "border-primary" : "border-border")}>
                      <div className="absolute inset-y-0 left-0 bg-primary/15 transition-all" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between">
                        <span className="font-semibold">{label} {mine && "✓"}</span>
                        <span className="text-muted-foreground">{pct}% · {count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
        {polls.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No polls yet.</li>}
      </ul>
    </div>
  );
}

// ---------- Goals ----------

function GoalsTab({ roomId, meId, isOwner }: { roomId: string; meId: string | null; isOwner: boolean }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(10);
  const [unit, setUnit] = useState("");

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", roomId],
    queryFn: async () => (await sb.from("room_goals").select("*").eq("room_id", roomId).order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("goal-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "room_goals", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["goals", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!meId || !title.trim()) return;
    const { error } = await sb.from("room_goals").insert({ room_id: roomId, user_id: meId, title: title.trim(), target, unit: unit.trim() || null });
    if (error) { toast.error(error.message); return; }
    setCreating(false); setTitle(""); setTarget(10); setUnit("");
  }
  async function bump(g: any, delta: number) {
    const next = Math.max(0, Math.min(g.target, (g.progress ?? 0) + delta));
    await sb.from("room_goals").update({ progress: next }).eq("id", g.id);
    if (next >= g.target && meId) logEvent(roomId, meId, "goal", `hit goal "${g.title}"`).catch(() => {});
  }
  async function remove(id: string) { await sb.from("room_goals").delete().eq("id", id); }

  return (
    <div>
      {isOwner && (!creating ? (
        <button onClick={() => setCreating(true)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground">
          <Target className="h-4 w-4" /> New room goal
        </button>
      ) : (
        <form onSubmit={create} className="mb-3 space-y-2 rounded-2xl border border-border bg-card p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. "Complete 100 DSA questions"' className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          <div className="flex gap-2">
            <input type="number" min={1} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit (questions, pages)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground">Create</button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Cancel</button>
          </div>
        </form>
      ))}
      <ul className="space-y-3">
        {goals.map((g: any) => {
          const pct = Math.round(((g.progress ?? 0) / g.target) * 100);
          return (
            <li key={g.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-bold">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground">{g.progress ?? 0} / {g.target} {g.unit ?? ""}</p>
                </div>
                {isOwner && <button onClick={() => remove(g.id)} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></button>}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex gap-2">
                {[1, 5, 10].map((n) => (
                  <button key={n} onClick={() => bump(g, n)} className="rounded-xl border border-border px-3 py-1 text-xs font-semibold">+{n}</button>
                ))}
                <button onClick={() => bump(g, -1)} className="ml-auto rounded-xl border border-border px-3 py-1 text-xs font-semibold">-1</button>
              </div>
            </li>
          );
        })}
        {goals.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{isOwner ? "Set a collective goal for the room." : "The owner hasn't set any goals yet."}</li>}
      </ul>
    </div>
  );
}

// ---------- Feed ----------

function FeedTab({ roomId }: { roomId: string }) {
  const qc = useQueryClient();
  const { data: events = [] } = useQuery({
    queryKey: ["events", roomId],
    queryFn: async () => (await sb.from("room_events").select("*, profiles(display_name)").eq("room_id", roomId).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("evt-" + roomId).on("postgres_changes", { event: "INSERT", schema: "public", table: "room_events", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["events", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  const iconFor = (k: string) => {
    if (k === "joined" || k === "left") return "👋";
    if (k === "todo") return "✅";
    if (k === "goal") return "🎯";
    if (k === "badge") return "🏅";
    if (k === "mastery") return "🚀";
    if (k === "chapter") return "📖";
    if (k === "break") return "☕";
    return "•";
  };

  return (
    <ul className="space-y-2">
      {events.map((e: any) => (
        <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-base">{iconFor(e.kind)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm"><b>{e.profiles?.display_name ?? "Member"}</b> {e.message}</p>
            <p className="text-[10px] text-muted-foreground">{fmtDay(e.created_at)} · {fmtTime(e.created_at)}</p>
          </div>
        </li>
      ))}
      {events.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"><Activity className="mx-auto mb-1 h-4 w-4" /> No activity yet.</li>}
    </ul>
  );
}

// ---------- Resources ----------

function ResourcesTab({ roomId, meId, isOwner }: { roomId: string; meId: string | null; isOwner: boolean }) {
  const qc = useQueryClient();
  const { data: resources = [], error: loadError } = useQuery({
    queryKey: ["res", roomId],
    queryFn: async () => {
      const { data, error } = await sb.from("resources").select("*, profiles!resources_user_profile_fk(display_name)").eq("room_id", roomId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastFail, setLastFail] = useState<File | null>(null);

  useEffect(() => {
    const ch = supabase.channel("res-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "resources", filter: `room_id=eq.${roomId}` }, () => {
      qc.invalidateQueries({ queryKey: ["res", roomId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId, qc]);

  async function doUpload(file: File) {
    if (!meId) { toast.error("Not signed in"); return; }
    setUploading(true); setProgress(10); setLastFail(null);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${roomId}/${crypto.randomUUID()}-${safe}`;
      setProgress(30);
      const { error: upErr } = await supabase.storage.from("resources").upload(path, file, {
        upsert: false, contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      setProgress(80);
      const ext = file.name.split(".").pop()?.toLowerCase();
      const kind: "pdf" | "image" | "note" =
        ext === "pdf" ? "pdf" : ["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "") ? "image" : "note";
      const { error: dbErr } = await sb.from("resources").insert({ room_id: roomId, user_id: meId, title: file.name, kind, storage_path: path });
      if (dbErr) {
        await supabase.storage.from("resources").remove([path]).catch(() => {});
        throw dbErr;
      }
      setProgress(100);
      qc.invalidateQueries({ queryKey: ["res", roomId] });
      logEvent(roomId, meId, "resource", `shared "${file.name}"`).catch(() => {});
      toast.success("Uploaded");
    } catch (err) {
      console.error("[resource upload]", err);
      setLastFail(file);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (file) await doUpload(file);
  }

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("resources").createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) { toast.error(error?.message ?? "Could not open file"); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function deleteResource(id: string, storagePath: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const { error: storageErr } = await supabase.storage.from("resources").remove([storagePath]);
      if (storageErr) console.error("Error deleting from storage:", storageErr);

      const { error: dbErr } = await sb.from("resources").delete().eq("id", id);
      if (dbErr) throw dbErr;

      toast.success("File deleted successfully");
      qc.invalidateQueries({ queryKey: ["res", roomId] });
      logEvent(roomId, meId || "", "resource_delete", `deleted "${title}"`).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-6 text-sm font-semibold text-muted-foreground">
        {uploading ? `Uploading... ${progress}%` : "Upload PDF / Image / Notes"}
        <input type="file" onChange={onPick} disabled={uploading} className="hidden" accept=".pdf,image/*,.txt,.md,.doc,.docx" />
      </label>
      {uploading && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {lastFail && !uploading && (
        <button onClick={() => doUpload(lastFail)} className="mt-2 w-full rounded-xl border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive">
          Retry upload of "{lastFail.name}"
        </button>
      )}
      {loadError && <p className="mt-2 text-center text-xs text-destructive">Failed to load resources</p>}
      <ul className="mt-3 space-y-2">
        {resources.map((r: any) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-5 w-5" /></div>
            <button onClick={() => download(r.storage_path)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="text-[11px] text-muted-foreground">{r.kind} · {r.profiles?.display_name ?? "member"} · {fmtDay(r.created_at)}</p>
            </button>
            {(isOwner || r.user_id === meId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteResource(r.id, r.storage_path, r.title);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
        {resources.length === 0 && <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No resources yet.</li>}
      </ul>
    </div>
  );
}

// ---------- Whiteboard ----------

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

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [roomId]);

  useEffect(() => {
    const ch = supabase.channel("wb-" + roomId).on("postgres_changes", { event: "*", schema: "public", table: "whiteboard_strokes", filter: `room_id=eq.${roomId}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {["#c084fc", "#38bdf8", "#f472b6", "#facc15", "#f87171", "#ffffff"].map((c) => (
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

// ---------- Group Exam Tab (Multiplayer) ----------

function GroupExamTab({ roomId, meId, isOwner }: { roomId: string; meId: string | null; isOwner: boolean }) {
  const [gameState, setGameState] = useState<"setup" | "lobby" | "active" | "results">("setup");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [useTimer, setUseTimer] = useState(true);
  const [timerDuration, setTimerDuration] = useState(10);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [quiz, setQuiz] = useState<Q[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [hostName, setHostName] = useState("");
  const [players, setPlayers] = useState<Array<{ id: string; name: string; score?: number; total?: number; finished: boolean }>>([]);

  const callAi = useServerFn(aiGenerate);
  const quizChRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", meId],
    queryFn: async () => {
      if (!meId) return null;
      const { data } = await supabase.from("profiles").select("display_name").eq("id", meId).maybeSingle();
      return data;
    },
    enabled: !!meId
  });
  const myName = profile?.display_name || "Anonymous";

  async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const pdfjs = (window as any)['pdfjs-dist/build/pdf'];
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    return text;
  }

  useEffect(() => {
    if (!meId) return;
    const channel = supabase.channel("room-quiz-" + roomId);
    
    channel
      .on("broadcast", { event: "start-exam" }, ({ payload }) => {
        setQuiz(payload.quiz);
        setAnswers(new Array(payload.quiz.length).fill(-1));
        setTopic(payload.topic);
        setHostId(payload.hostId);
        setHostName(payload.hostName);
        setSubmitted(false);
        setGameState("lobby");
        if (payload.useTimer) {
          setTimeRemaining(payload.duration * 60);
        } else {
          setTimeRemaining(null);
        }
        setPlayers([{ id: payload.hostId, name: payload.hostName, finished: false }]);
        
        if (payload.hostId !== meId) {
          channel.send({
            type: "broadcast",
            event: "player-join",
            payload: { id: meId, name: myName }
          });
        }
      })
      .on("broadcast", { event: "player-join" }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.some(p => p.id === payload.id)) return prev;
          return [...prev, { id: payload.id, name: payload.name, finished: false }];
        });
        channel.send({
          type: "broadcast",
          event: "presence-reply",
          payload: { id: meId, name: myName, finished: false }
        });
      })
      .on("broadcast", { event: "presence-reply" }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.some(p => p.id === payload.id)) return prev;
          return [...prev, { id: payload.id, name: payload.name, finished: payload.finished }];
        });
      })
      .on("broadcast", { event: "player-submit" }, ({ payload }) => {
        setPlayers(prev => prev.map(p => p.id === payload.id 
          ? { ...p, finished: true, score: payload.score, total: payload.total }
          : p
        ));
      })
      .on("broadcast", { event: "cancel-exam" }, () => {
        toast.info("The host cancelled the exam.");
        resetQuiz();
      })
      .subscribe();

    quizChRef.current = channel;

    const handleUpdate = () => {
      const savedQuiz = localStorage.getItem(`active-group-quiz:${roomId}`);
      if (savedQuiz) {
        const payload = JSON.parse(savedQuiz);
        setQuiz(payload.quiz);
        setAnswers(new Array(payload.quiz.length).fill(-1));
        setTopic(payload.topic);
        setHostId(payload.hostId);
        setHostName(payload.hostName);
        setSubmitted(false);
        setGameState("lobby");
        if (payload.useTimer) {
          setTimeRemaining(payload.duration * 60);
        } else {
          setTimeRemaining(null);
        }
        localStorage.removeItem(`active-group-quiz:${roomId}`);
      }
    };
    
    window.addEventListener("group-quiz-updated", handleUpdate);

    // Initial check
    handleUpdate();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("group-quiz-updated", handleUpdate);
    };
  }, [roomId, meId, myName]);

  useEffect(() => {
    if (timeRemaining === null || gameState !== "active" || submitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast.warning("Time is up! Submitting your answers.");
      submitAnswers();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeRemaining, gameState, submitted]);

  async function hostExam() {
    setBusy(true);
    let pdfText = "";
    if (pdfFile) {
      setExtracting(true);
      try {
        pdfText = await extractPdfText(pdfFile);
        if (!pdfText.trim()) throw new Error("Could not extract readable text from PDF.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "PDF extraction failed");
        setBusy(false);
        setExtracting(false);
        return;
      } finally {
        setExtracting(false);
      }
    }

    try {
      const quizSource = pdfFile ? `the uploaded document text: "${pdfText.slice(0, 8000)}"` : `the topic "${topic}"`;
      const prompt = `Create a ${difficulty} difficulty quiz with ${count} MCQs based on ${quizSource}.
Return JSON format matching this shape:
{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}
Generate strictly ${count} questions. Return ONLY JSON.`;

      const res = await callAi({ data: { prompt, json: true, system: "You return only strict JSON." } });
      const qs = (parseAiJson<{ questions?: Q[] }>(res.text)?.questions) ?? [];
      if (qs.length === 0) throw new Error("Failed to generate questions. Please try again.");

      setQuiz(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setHostId(meId);
      setHostName(myName);
      setSubmitted(false);
      setGameState("lobby");
      setPlayers([{ id: meId!, name: myName, finished: false }]);
      if (useTimer) {
        setTimeRemaining(timerDuration * 60);
      } else {
        setTimeRemaining(null);
      }

      quizChRef.current?.send({
        type: "broadcast",
        event: "start-exam",
        payload: {
          quiz: qs,
          topic: pdfFile ? `PDF: ${pdfFile.name}` : topic,
          hostId: meId,
          hostName: myName,
          useTimer,
          duration: timerDuration
        }
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start quiz");
    } finally {
      setBusy(false);
    }
  }

  function startExam() {
    setGameState("active");
  }

  async function submitAnswers() {
    if (!quiz) return;
    const finalScore = quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setSubmitted(true);
    setGameState("results");
    
    quizChRef.current?.send({
      type: "broadcast",
      event: "player-submit",
      payload: {
        id: meId,
        name: myName,
        score: finalScore,
        total: quiz.length
      }
    });

    setPlayers(prev => prev.map(p => p.id === meId 
      ? { ...p, finished: true, score: finalScore, total: quiz.length }
      : p
    ));
    
    if (meId) {
      await supabase.from("ai_quizzes").insert({
        user_id: meId,
        topic: topic,
        difficulty,
        questions: quiz,
        answers,
        score: finalScore
      });
      qc.invalidateQueries({ queryKey: ["quizzes-history", meId] });
    }
  }

  function cancelExam() {
    quizChRef.current?.send({
      type: "broadcast",
      event: "cancel-exam",
      payload: {}
    });
    resetQuiz();
  }

  function resetQuiz() {
    setQuiz(null);
    setAnswers([]);
    setSubmitted(false);
    setTimeRemaining(null);
    setPlayers([]);
    setGameState("setup");
    setPdfFile(null);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      {gameState === "setup" && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-base font-bold">Host Live Group Exam</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Generate an interactive exam from a topic or PDF and challenge active study room members! Emojis and full styling included.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPdfFile(null)}
              className={`rounded-xl border py-2 text-xs font-bold transition-all ${!pdfFile ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
            >
              ✏️ Topic Name
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setPdfFile(file);
                };
                input.click();
              }}
              className={`rounded-xl border py-2 text-xs font-bold transition-all ${pdfFile ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
            >
              📄 {pdfFile ? "PDF Selected" : "Upload PDF"}
            </button>
          </div>

          {!pdfFile ? (
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Topic / chapters</span>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Operating Systems" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </label>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-2.5">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{pdfFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setPdfFile(null)} className="text-xs font-bold text-destructive hover:underline">Remove</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Difficulty</p>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Questions</p>
              <select value={count} onChange={e => setCount(+e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none">
                {[3, 5, 8, 10, 15].map(c => (
                  <option key={c} value={c}>{c} Questions</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Timer Limit</p>
                <p className="text-[10px] text-muted-foreground">Synchronized countdown for all players</p>
              </div>
              <input 
                type="checkbox" 
                checked={useTimer} 
                onChange={(e) => setUseTimer(e.target.checked)} 
                className="h-4 w-4 accent-[color:var(--brand)] cursor-pointer"
              />
            </div>
            {useTimer && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-muted/40 p-2 text-xs">
                <span className="font-semibold text-muted-foreground">Timer Duration:</span>
                <select value={timerDuration} onChange={e => setTimerDuration(+e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 outline-none">
                  {[1, 3, 5, 10, 15, 30].map(m => (
                    <option key={m} value={m}>{m} mins</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button onClick={hostExam} disabled={busy || (!pdfFile && !topic.trim())} className="w-full rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 shadow transition-all hover:scale-[1.01]">
            {busy ? (extracting ? "Extracting PDF..." : "Preparing Live Exam...") : "🚀 Start Group Exam"}
          </button>
        </div>
      )}

      {gameState === "lobby" && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 text-center">
          <div className="animate-bounce mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold">Group Exam Lobby</h2>
            <p className="text-xs text-muted-foreground">Topic: <span className="font-bold text-foreground">{topic}</span></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Host: <span className="font-bold text-primary">{hostName}</span></p>
          </div>

          <div className="border-t border-b border-border py-3">
            <p className="text-xs font-bold text-left text-muted-foreground uppercase tracking-wider mb-2">Players Joined ({players.length}):</p>
            <div className="flex flex-wrap gap-1.5 justify-start">
              {players.map(p => (
                <span key={p.id} className="rounded-full bg-primary/10 text-primary border border-primary/10 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {p.name} {p.id === hostId && "(Host)"}
                </span>
              ))}
            </div>
          </div>

          {hostId === meId ? (
            <div className="flex gap-2">
              <button onClick={cancelExam} className="flex-1 rounded-xl border border-border bg-background py-2.5 text-xs font-bold text-destructive hover:bg-muted">Cancel</button>
              <button onClick={startExam} className="flex-1 rounded-xl gradient-brand py-2.5 text-xs font-bold text-primary-foreground shadow">Start Exam Now</button>
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/30 p-3">
              <p className="text-xs font-bold text-muted-foreground animate-pulse">Waiting for host to start the exam...</p>
            </div>
          )}
        </div>
      )}

      {gameState === "active" && quiz && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Group Exam</p>
              <p className="text-sm font-bold truncate">{topic}</p>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/20 px-3.5 py-1 text-xs font-bold text-destructive animate-pulse">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-3 text-xs flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Study Buddies:</span>
            <div className="flex items-center gap-1">
              {players.map(p => (
                <div key={p.id} title={`${p.name} - ${p.finished ? 'Finished' : 'Answering...'}`} className={`h-2.5 w-2.5 rounded-full ${p.finished ? 'bg-success' : 'bg-muted-foreground animate-pulse'}`} />
              ))}
            </div>
          </div>

          {quiz.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-bold">{i + 1}. {q.q}</p>
              <div className="mt-3 space-y-1.5">
                {q.options.map((o, k) => {
                  const isPicked = answers[i] === k;
                  return (
                    <button key={k} disabled={submitted}
                      onClick={() => { const a = [...answers]; a[i] = k; setAnswers(a); }}
                      className={"flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all " + (isPicked ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:bg-muted")}>
                      <span className={`grid h-5 w-5 place-items-center rounded-lg border text-[10px] font-bold uppercase transition-colors shrink-0 ${isPicked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/30"}`}>
                        {String.fromCharCode(65 + k)}
                      </span>
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={submitAnswers} className="w-full rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow">Submit Answers</button>
        </div>
      )}

      {gameState === "results" && quiz && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <h2 className="text-base font-bold">🏆 Multiplayer Leaderboard</h2>
            </div>
            
            <div className="divide-y divide-border">
              {players
                .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                .map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                      <p className="truncate text-xs font-bold text-foreground">
                        {p.name} {p.id === meId && "(You)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.finished ? (
                        <span className="rounded-full bg-success/15 border border-success/20 px-2.5 py-0.5 text-[10px] font-bold text-success">
                          {p.score ?? 0} / {p.total ?? quiz.length}
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground animate-pulse">
                          Answering...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="text-center font-bold text-xs text-muted-foreground py-2 border-t border-b border-dashed border-border">
            Review answers and explanations below!
          </div>

          {quiz.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-bold">{i + 1}. {q.q}</p>
              <div className="mt-3 space-y-1.5">
                {q.options.map((o, k) => {
                  const isPicked = answers[i] === k;
                  const isCorrect = k === q.answer;
                  const isWrong = isPicked && k !== q.answer;
                  return (
                    <button key={k} disabled
                      className={"flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all " + (isCorrect ? "border-success bg-success/10 font-semibold text-success" : isWrong ? "border-destructive bg-destructive/10 font-semibold text-destructive" : "border-border bg-background opacity-60")}>
                      {isCorrect && <Check className="h-4 w-4 text-success shrink-0" />}
                      {isWrong && <X className="h-4 w-4 text-destructive shrink-0" />}
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 rounded-xl border border-border/40 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {q.explanation}</p>
            </div>
          ))}

          <button onClick={resetQuiz} className="w-full rounded-2xl border border-border bg-background py-3 text-sm font-bold hover:bg-muted transition-all">Back to Lobby</button>
        </div>
      )}
    </div>
  );
}
