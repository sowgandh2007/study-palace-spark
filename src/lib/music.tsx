import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX, X } from "lucide-react";

export type Playlist = {
  id: string;
  title: string;
  category: string;
  youtubeId: string; // playlist or video id
  kind: "playlist" | "video";
  cover: string;
  gradient: string;
};

export const PLAYLISTS: Playlist[] = [
  { id: "lofi-hiphop", title: "Lofi Hip Hop Radio", category: "Lo-fi", youtubeId: "jfKfPfyJRdk", kind: "video", cover: "🎧", gradient: "from-fuchsia-500 to-indigo-600" },
  { id: "lofi-chill", title: "Chillhop Essentials", category: "Lo-fi", youtubeId: "5yx6BWlEVcY", kind: "video", cover: "🌆", gradient: "from-violet-500 to-purple-700" },
  { id: "ambient", title: "Ambient Study", category: "Ambient", youtubeId: "sjkrrmBnpGE", kind: "video", cover: "✨", gradient: "from-sky-500 to-indigo-500" },
  { id: "rain", title: "Rain & Thunder", category: "Nature", youtubeId: "mPZkdNFkNps", kind: "video", cover: "🌧️", gradient: "from-slate-500 to-blue-700" },
  { id: "forest", title: "Forest Sounds", category: "Nature", youtubeId: "xNN7iTA57jM", kind: "video", cover: "🌲", gradient: "from-emerald-500 to-teal-700" },
  { id: "white-noise", title: "White Noise Focus", category: "Noise", youtubeId: "nMfPqeZjc2c", kind: "video", cover: "📻", gradient: "from-gray-500 to-slate-700" },
  { id: "brown-noise", title: "Brown Noise Deep Focus", category: "Noise", youtubeId: "hnf2FywYtPY", kind: "video", cover: "🟫", gradient: "from-amber-700 to-stone-800" },
  { id: "piano", title: "Peaceful Piano", category: "Instrumental", youtubeId: "4xDzrJKXOOY", kind: "video", cover: "🎹", gradient: "from-rose-400 to-fuchsia-600" },
  { id: "classical", title: "Classical for Studying", category: "Instrumental", youtubeId: "jgpJVI3tDbY", kind: "video", cover: "🎻", gradient: "from-amber-500 to-orange-600" },
  { id: "coffeeshop", title: "Coffee Shop Ambience", category: "Ambient", youtubeId: "h2zkV-l_TbY", kind: "video", cover: "☕", gradient: "from-orange-500 to-rose-600" },
  { id: "binaural", title: "Binaural Beats Focus", category: "Focus", youtubeId: "WPni755-Krg", kind: "video", cover: "🧠", gradient: "from-cyan-500 to-blue-700" },
  { id: "jazz", title: "Smooth Jazz", category: "Instrumental", youtubeId: "Dx5qFachd3A", kind: "video", cover: "🎷", gradient: "from-yellow-500 to-red-600" },
];

type Ctx = {
  current: Playlist | null;
  playing: boolean;
  volume: number;
  muted: boolean;
  favorites: string[];
  play: (p: Playlist) => void;
  toggle: () => void;
  next: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleFavorite: (id: string) => void;
};

const MusicCtx = createContext<Ctx | null>(null);

export function useMusic() {
  const c = useContext(MusicCtx);
  if (!c) throw new Error("MusicProvider missing");
  return c;
}

const LS = "studysphere:music";

export function MusicProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Playlist | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(60);
  const [muted, setMuted] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.currentId) {
          const p = PLAYLISTS.find(x => x.id === s.currentId);
          if (p) setCurrent(p);
        }
        if (typeof s.volume === "number") setVolumeState(s.volume);
        if (Array.isArray(s.favorites)) setFavorites(s.favorites);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ currentId: current?.id ?? null, volume, favorites }));
    } catch {}
  }, [current, volume, favorites]);

  function post(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }

  useEffect(() => { if (current && playing) post("playVideo"); }, [current, playing]);
  useEffect(() => { post("setVolume", [muted ? 0 : volume]); }, [volume, muted]);

  const value: Ctx = useMemo(() => ({
    current, playing, volume, muted, favorites,
    play: (p) => { setCurrent(p); setPlaying(true); },
    toggle: () => { const n = !playing; setPlaying(n); post(n ? "playVideo" : "pauseVideo"); },
    next: () => {
      if (!current) { setCurrent(PLAYLISTS[0]); setPlaying(true); return; }
      const i = PLAYLISTS.findIndex(x => x.id === current.id);
      const n = PLAYLISTS[(i + 1) % PLAYLISTS.length];
      setCurrent(n); setPlaying(true);
    },
    stop: () => { setPlaying(false); setCurrent(null); },
    setVolume: (v) => { setVolumeState(v); if (muted && v > 0) setMuted(false); },
    toggleMute: () => setMuted(m => !m),
    toggleFavorite: (id) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]),
  }), [current, playing, volume, muted, favorites]);

  const src = current
    ? `https://www.youtube.com/embed/${current.youtubeId}?enablejsapi=1&autoplay=1&loop=1&playlist=${current.youtubeId}&controls=0&modestbranding=1`
    : "";

  return (
    <MusicCtx.Provider value={value}>
      {children}
      {/* persistent hidden iframe */}
      {current && (
        <iframe
          ref={iframeRef}
          key={current.id}
          src={src}
          allow="autoplay; encrypted-media"
          className="fixed h-0 w-0 opacity-0 pointer-events-none"
          title="music"
        />
      )}
    </MusicCtx.Provider>
  );
}

export function MiniPlayer() {
  const m = useMusic();
  if (!m.current) return null;
  return (
    <div className="fixed inset-x-0 bottom-[68px] z-40 mx-auto max-w-md px-3">
      <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r ${m.current.gradient} p-2.5 pr-3 shadow-lg backdrop-blur-xl animate-fade-in`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30 text-lg">{m.current.cover}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">{m.current.title}</p>
          <p className="text-[10px] text-white/70">{m.current.category} · {m.playing ? "Playing" : "Paused"}</p>
        </div>
        <button onClick={m.toggleMute} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
          {m.muted || m.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button onClick={m.toggle} className="grid h-9 w-9 place-items-center rounded-full bg-white text-black">
          {m.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={m.next} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
          <SkipForward className="h-4 w-4" />
        </button>
        <button onClick={m.stop} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
