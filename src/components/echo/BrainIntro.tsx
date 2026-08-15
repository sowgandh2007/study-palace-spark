import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

export function PixelBrainSVG({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="brain-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      {/* Outer Glow Path */}
      <path
        d="M50 15 C30 15 15 30 15 50 C15 70 30 85 45 85 C47 85 49 84 50 82 C51 84 53 85 55 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z"
        fill="url(#brain-grad)"
        filter="url(#brain-glow)"
      />
      {/* Left Hemisphere Sulci & Fissures */}
      <path d="M48 20 C35 20 20 32 20 48 C20 62 30 78 45 78 L48 78 Z" fill="#3b82f6" />
      <path d="M28 35 C35 32 42 38 45 35" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 48 C32 44 40 50 46 46" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 62 C34 58 42 64 46 60" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />

      {/* Right Hemisphere Sulci & Fissures */}
      <path d="M52 20 C65 20 80 32 80 48 C80 62 70 78 55 78 L52 78 Z" fill="#2563eb" />
      <path d="M72 35 C65 32 58 38 55 35" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M76 48 C68 44 60 50 54 46" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M72 62 C66 58 58 64 54 60" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />

      {/* Longitudinal Fissure Line */}
      <line x1="50" y1="18" x2="50" y2="82" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />

      {/* Pixel highlight accents */}
      <rect x="32" y="26" width="4" height="4" fill="#dbeafe" rx="1" />
      <rect x="64" y="26" width="4" height="4" fill="#dbeafe" rx="1" />
      <rect x="24" y="40" width="4" height="4" fill="#93c5fd" rx="1" />
      <rect x="72" y="40" width="4" height="4" fill="#93c5fd" rx="1" />
    </svg>
  );
}

const DIMENSIONS_INFO = [
  {
    num: "1",
    title: "Functional",
    desc: "Understand the purpose, role, and real-world function.",
    pos: "top-4 left-4 sm:top-10 sm:left-12 text-left",
  },
  {
    num: "2",
    title: "Structural",
    desc: "Explore the components, arrangement, and architecture.",
    pos: "top-4 right-4 sm:top-10 sm:right-12 text-right",
  },
  {
    num: "3",
    title: "Behavioral",
    desc: "Study the principles, mechanisms, and cause-effect relationships.",
    pos: "top-1/3 left-2 sm:left-8 text-left",
  },
  {
    num: "4",
    title: "Contextual",
    desc: "Understand the environment, conditions, and boundaries.",
    pos: "top-1/3 right-2 sm:right-8 text-right",
  },
  {
    num: "5",
    title: "Comparative",
    desc: "Compare with alternatives to deepen clarity.",
    pos: "bottom-12 left-4 sm:bottom-16 sm:left-14 text-left",
  },
  {
    num: "6",
    title: "Evolutionary",
    desc: "Trace its history, improvements, and future potential.",
    pos: "bottom-12 right-4 sm:bottom-16 sm:right-14 text-right",
  },
];

export function BrainIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const el = containerRef.current;
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

  // Determine stage based on progress (0 to 1)
  const isFinalStage = progress >= 0.72;
  const brainScale = isFinalStage
    ? 0
    : progress < 0.25
    ? 1 + progress * 1.5
    : progress < 0.5
    ? 1.375 + (progress - 0.25) * 2.5
    : 2.0 + (progress - 0.5) * 2.4;

  const auraPulse = Math.min(1, Math.max(0, (progress - 0.2) / 0.5));

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "340vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between selection:bg-none font-sans bg-slate-900">
        {/* Pixelated Sky & Water Horizon Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#87c5f8] via-[#a8d6fa] to-[#6da5e3]">
          {/* Subtle Pixel Cloud Patterns */}
          <div className="absolute top-12 left-10 opacity-40">
            <div className="w-24 h-6 bg-white/80 rounded-full blur-[1px]" />
          </div>
          <div className="absolute top-24 right-16 opacity-50">
            <div className="w-36 h-8 bg-white/80 rounded-full blur-[1px]" />
          </div>

          {/* Ocean Water Horizon */}
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-b from-[#2e62a1] via-[#1b4880] to-[#12335c] border-t-2 border-sky-300/40">
            {/* Water Light Shimmer Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full bg-gradient-to-r from-transparent via-sky-200/20 to-transparent blur-md" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-72 h-1 bg-sky-200/40 blur-[1px]" />
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-1 bg-sky-200/30 blur-[1px]" />
          </div>
        </div>

        {/* Header Title Section (Fade out as we reach final explode state) */}
        <div
          className="relative z-20 pt-16 sm:pt-20 px-4 text-center space-y-3 transition-all duration-500"
          style={{
            opacity: isFinalStage ? 0.2 : Math.max(0, 1 - progress * 1.2),
            transform: `translateY(${progress * -30}px)`,
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-300/60 shadow-sm backdrop-blur-sm">
            <div className="size-5 rounded-full bg-sky-600 grid place-items-center text-white font-black text-[10px]">
              C
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-800">ECHO</span>
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm font-mono">
              ECHO
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
              Evidence-Based Conceptual Honesty Engine
            </p>
          </div>

          <div className="pt-1">
            <p className="text-xs sm:text-sm text-slate-800 font-medium italic font-serif max-w-sm mx-auto bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm">
              “The answer is correct. But is the understanding real?”
            </p>
          </div>
        </div>

        {/* Center Stage Animation Area */}
        <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
          {!isFinalStage ? (
            /* States 1-3: Scaling Brain with Radial Aura */
            <div className="relative flex items-center justify-center">
              {/* Concentric Aura Rings */}
              {auraPulse > 0 && (
                <>
                  <div
                    className="absolute rounded-full border-2 border-sky-200/60 bg-sky-300/20 blur-sm transition-all duration-300"
                    style={{
                      width: `${140 * brainScale}px`,
                      height: `${140 * brainScale}px`,
                      opacity: auraPulse * 0.8,
                    }}
                  />
                  <div
                    className="absolute rounded-full border-2 border-white/40 bg-sky-100/15 blur-md transition-all duration-300"
                    style={{
                      width: `${180 * brainScale}px`,
                      height: `${180 * brainScale}px`,
                      opacity: auraPulse * 0.6,
                    }}
                  />
                </>
              )}

              {/* Main Scaling Pixel Brain */}
              <div
                className="transition-transform duration-300 ease-out flex items-center justify-center"
                style={{ transform: `scale(${brainScale})` }}
              >
                <PixelBrainSVG className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-xl" />
              </div>
            </div>
          ) : (
            /* State 4: Brain Explodes into 6 Dimensions around Central Light Burst */
            <div className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center animate-in fade-in zoom-in-90 duration-700">
              {/* Central Light Burst / Starburst Rays */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="size-48 sm:size-72 rounded-full bg-gradient-to-r from-sky-200 via-white to-blue-200 blur-2xl opacity-90 animate-pulse" />
                <div className="absolute size-16 sm:size-24 rounded-full bg-white shadow-[0_0_60px_rgba(255,255,255,1)]" />

                {/* Burst Ray Lines */}
                <svg className="absolute w-full h-full max-w-lg max-h-lg opacity-60" viewBox="0 0 200 200">
                  <line x1="100" y1="100" x2="30" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="100" x2="170" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="100" x2="20" y2="100" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="100" x2="180" y2="100" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="100" x2="40" y2="170" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="100" x2="160" y2="170" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>

                {/* 6 Exploded Mini Brain Fragments */}
                <div className="absolute -top-16 -left-12 sm:-top-20 sm:-left-20">
                  <PixelBrainSVG className="w-12 h-12 sm:w-16 sm:h-16 opacity-90" />
                </div>
                <div className="absolute -top-16 -right-12 sm:-top-20 sm:-right-20">
                  <PixelBrainSVG className="w-12 h-12 sm:w-16 sm:h-16 opacity-90" />
                </div>
                <div className="absolute top-0 -left-20 sm:-left-36">
                  <PixelBrainSVG className="w-10 h-10 sm:w-14 sm:h-14 opacity-90" />
                </div>
                <div className="absolute top-0 -right-20 sm:-right-36">
                  <PixelBrainSVG className="w-10 h-10 sm:w-14 sm:h-14 opacity-90" />
                </div>
                <div className="absolute -bottom-16 -left-12 sm:-bottom-20 sm:-left-20">
                  <PixelBrainSVG className="w-12 h-12 sm:w-16 sm:h-16 opacity-90" />
                </div>
                <div className="absolute -bottom-16 -right-12 sm:-bottom-20 sm:-right-20">
                  <PixelBrainSVG className="w-12 h-12 sm:w-16 sm:h-16 opacity-90" />
                </div>
              </div>

              {/* 6 Dimension Information Badges */}
              <div className="absolute inset-0 p-4 sm:p-6 pointer-events-auto">
                {DIMENSIONS_INFO.map((dim) => (
                  <div
                    key={dim.num}
                    className={`absolute ${dim.pos} max-w-[160px] sm:max-w-[210px] p-3 sm:p-4 rounded-2xl bg-white/90 border border-sky-200/90 shadow-lg backdrop-blur-md transition-all duration-500 hover:scale-105`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="grid size-5 place-items-center rounded-md bg-sky-600 text-white font-bold text-[11px] font-mono">
                        {dim.num}
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{dim.title}</h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-700 leading-relaxed font-medium">
                      {dim.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Down Bouncing Footer Indicator */}
        <div
          className="relative z-20 pb-8 text-center transition-opacity duration-300"
          style={{ opacity: isFinalStage ? 0.3 : 1 }}
        >
          <div className="inline-flex flex-col items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-widest text-slate-800 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-sm">
            <ChevronDown className="size-4 animate-bounce text-sky-800" />
            <span>{isFinalStage ? "Explore Below" : "Scroll Down"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
