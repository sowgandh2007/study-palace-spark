import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrainCircuit, BookOpen, Sparkles, ChevronDown, Calendar, Zap, TrendingUp } from "lucide-react";
import "./NotebookIntro.css";

function PageShell({ children }: { children: ReactNode }) {
  return <div className="nb-page nb-right h-full flex flex-col justify-center">{children}</div>;
}

const LEAF_COUNT = 3;

export function NotebookIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      setProgress(p);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  function leafAngle(i: number) {
    const span = 0.9 / LEAF_COUNT;
    const start = i * span;
    const local = Math.min(1, Math.max(0, (progress - start) / span));
    return -180 * local;
  }

  const leaves: ReactNode[] = [
    // Page 1 — the ECHO question
    <PageShell key="quote">
      <div className="space-y-5 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-700">Page One</p>
        <p className="text-2xl sm:text-4xl font-semibold leading-snug text-slate-800 [font-family:Georgia,serif]">
          “The answer is correct.
          <br />
          But is the{" "}
          <span className="underline decoration-sky-500 decoration-2 underline-offset-4 text-sky-800">
            understanding real
          </span>
          ?”
        </p>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          ECHO doesn't ask whether you know the answer. It asks whether your understanding survives.
        </p>
      </div>
    </PageShell>,

    // Page 2 — core idea
    <PageShell key="idea">
      <div className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-700">The Core Idea</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <BookOpen className="size-6 text-sky-700" /> Evidence, not recall
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
          ECHO continuously compares your <strong>perceived understanding</strong> with{" "}
          <strong>demonstrated evidence</strong>, detects conceptual fragility, and reads your academic
          context to decide what should happen next.
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
          {[
            "Direct, Explain, Variation, Assumption, Error Detection, Transfer",
            "Understanding Stability Score from 0 to 100",
            "Repair slots scheduled around tomorrow's class",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-sky-600 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </PageShell>,

    // Page 3 — philosophy loop
    <PageShell key="loop">
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-700">The ECHO Loop</p>
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          Plan → Learn → Reflect → Verify → Adapt
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: "Plan", text: "Timetable & notes shape focus." },
            { icon: BookOpen, label: "Learn", text: "Attend class, engage mechanism." },
            { icon: Sparkles, label: "Reflect", text: "Say what you understand." },
            { icon: Zap, label: "Verify", text: "Six dimensions probe concept." },
            { icon: TrendingUp, label: "Adapt", text: "Stability decides next action." },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-sky-900/10 bg-white/70 px-3 py-2">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className="text-[10px] leading-relaxed text-slate-600 mt-0.5">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>,
  ];

  return (
    <div ref={sectionRef} className="nb-scroll" style={{ height: "340vh" }}>
      <div className="nb-sticky">
        <div className="nb-book">
          {/* Static left page — ECHO introduction */}
          <div className="nb-page nb-left flex flex-col justify-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-sky-700/10 border border-sky-700/25 text-sky-800">
                  <BrainCircuit className="size-5" />
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  ECHO
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-sky-800">
                Evidence-Based Conceptual Honesty Engine
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 max-w-sm">
                A continuous learning intelligence system: plan the night before, learn in class, reflect
                honestly, verify with evidence, and adapt tomorrow.
              </p>
              <div className="rounded-xl border border-sky-900/10 bg-white/70 p-3.5 max-w-sm">
                <p className="text-[11px] uppercase tracking-widest font-bold text-sky-800 font-mono">
                  Understanding Stability
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  0–39 Surface · 40–59 Fragile · 60–79 Developing · 80–100 Stable
                </p>
              </div>
            </div>
          </div>

          {/* Static right page — revealed after all turns */}
          <div className="nb-page nb-right hidden sm:flex flex-col justify-center">
            <div className="space-y-3 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-700">Keep Scrolling</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">The Five ECHO Stages</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Each stage opens its own tool. Scroll on to stack the stage cards.
              </p>
              <ChevronDown className="size-6 mx-auto text-sky-700 animate-bounce" />
            </div>
          </div>

          {/* Turning leaves */}
          {leaves.map((content, i) => (
            <div
              key={i}
              className="nb-leaf"
              style={{
                transform: `rotateY(${leafAngle(i)}deg)`,
                zIndex: 40 - i,
              }}
            >
              <div className="nb-face">
                {content}
                <div className="nb-shade" />
              </div>
              <div className="nb-face nb-face-back nb-page nb-left flex flex-col items-center justify-center p-2">
                {i === 0 ? (
                  <img
                    src="/images/notebook_core_idea.png"
                    alt="The Core Idea"
                    className="w-full h-full object-contain rounded-xl p-1"
                  />
                ) : (
                  <img
                    src="/images/notebook_echo_loop.png"
                    alt="The ECHO Loop"
                    className="w-full h-full object-contain rounded-xl p-1"
                  />
                )}
              </div>
            </div>
          ))}

          <div className="nb-spine" />
          <div className="nb-rings">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="nb-ring" />
            ))}
          </div>
        </div>

        <div className="nb-hint text-[10px] font-mono uppercase tracking-[0.3em] text-sky-800/70">
          Scroll to turn the page
        </div>
      </div>
    </div>
  );
}
