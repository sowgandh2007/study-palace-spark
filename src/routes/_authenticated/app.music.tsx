import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Music as MusicIcon, Search, Heart, Play, Pause, Volume2 } from "lucide-react";
import { PLAYLISTS, useMusic, type Playlist } from "@/lib/music";
import { motion, fadeUp, stagger, useReducedMotion } from "@/lib/motion";

export const Route = createFileRoute("/_authenticated/app/music")({
  component: MusicPage,
});

const CATS = ["All", "Lo-fi", "Ambient", "Nature", "Noise", "Instrumental", "Focus"] as const;

function MusicPage() {
  const m = useMusic();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const reduced = useReducedMotion();

  const filtered = useMemo(
    () =>
      PLAYLISTS.filter(
        (p) =>
          (cat === "All" || p.category === cat) &&
          (q === "" || p.title.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, cat],
  );

  const favs = PLAYLISTS.filter((p) => m.favorites.includes(p.id));

  return (
    <div className="relative mx-auto max-w-md md:max-w-4xl px-5 pt-8">
      {!reduced && <Equalizer active={m.playing} />}
      <motion.div
        className="relative flex items-center gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 glow">
          <MusicIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Focus Music</h1>
          <p className="text-xs text-muted-foreground">Keeps playing as you study</p>
        </div>
      </motion.div>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search playlists"
          className="w-full rounded-2xl border border-border bg-card/60 py-2.5 pl-9 pr-3 text-sm outline-none backdrop-blur focus:border-primary"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all " +
              (cat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {m.current && (
        <div className={`mt-4 flex items-center gap-3 rounded-3xl bg-gradient-to-r ${m.current.gradient} p-4 shadow-lg`}>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black/30 text-2xl">{m.current.cover}</div>
          <div className="min-w-0 flex-1 text-white">
            <p className="truncate text-sm font-bold">{m.current.title}</p>
            <p className="text-[11px] opacity-80">{m.current.category}</p>
            <div className="mt-2 flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5" />
              <input
                type="range" min={0} max={100} value={m.volume}
                onChange={(e) => m.setVolume(+e.target.value)}
                className="h-1 flex-1 accent-white"
              />
            </div>
          </div>
          <button onClick={m.toggle} className="grid h-11 w-11 place-items-center rounded-full bg-white text-black">
            {m.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>
      )}

      {favs.length > 0 && (
        <>
          <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">Favorites</h2>
          <motion.div
            className="mt-2 grid grid-cols-2 gap-3"
            variants={stagger(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            {favs.map((p) => (
              <motion.div key={p.id} variants={fadeUp}><Card p={p} /></motion.div>
            ))}
          </motion.div>
        </>
      )}

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {cat === "All" ? "All playlists" : cat}
      </h2>
      <motion.div
        key={cat + q}
        className="mt-2 grid grid-cols-2 gap-3"
        variants={stagger(0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        {filtered.map((p) => (
          <motion.div key={p.id} variants={fadeUp}><Card p={p} /></motion.div>
        ))}
      </motion.div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">No playlists match "{q}"</p>
      )}
    </div>
  );
}

function Equalizer({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex h-64 items-end justify-between gap-1 px-3 opacity-[0.14]">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="w-full rounded-t-full bg-gradient-to-t from-fuchsia-500 to-indigo-400"
          initial={{ height: 6 }}
          animate={{ height: active ? [8, 40 + ((i * 13) % 60), 12, 28, 8] : [8, 14, 10, 18, 8] }}
          transition={{ duration: active ? 1.6 + (i % 5) * 0.15 : 3 + (i % 4) * 0.4, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.08 }}
        />
      ))}
    </div>
  );
}

function Card({ p }: { p: Playlist }) {
  const m = useMusic();
  const active = m.current?.id === p.id;
  const fav = m.favorites.includes(p.id);
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${p.gradient} p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-3xl">{p.cover}</div>
          <button
            onClick={(e) => { e.stopPropagation(); m.toggleFavorite(p.id); }}
            className="grid h-8 w-8 place-items-center rounded-full bg-black/30"
          >
            <Heart className={"h-4 w-4 " + (fav ? "fill-white text-white" : "text-white/70")} />
          </button>
        </div>
        <p className="mt-3 text-sm font-bold leading-tight">{p.title}</p>
        <p className="text-[10px] opacity-80">{p.category}</p>
        <button
          onClick={() => (active ? m.toggle() : m.play(p))}
          className={"mt-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] " + (active && m.playing ? "animate-pulse shadow-[0_0_18px_rgba(255,255,255,0.55)]" : "")}
        >
          {active && m.playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {active && m.playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
