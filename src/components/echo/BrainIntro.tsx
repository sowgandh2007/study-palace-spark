import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil, Boxes, GitBranch, ClipboardCheck, Calendar, Laptop } from "lucide-react";

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

const LEFT_PRINCIPLES = [
  {
    num: "1",
    title: "Simplify relentlessly",
    desc: "Explain the idea in plain English as if teaching a beginner.",
    icon: Pencil,
  },
  {
    num: "3",
    title: "Anchor with analogies",
    desc: "Tie the new concept to something you already understand intuitively.",
    icon: GitBranch,
  },
  {
    num: "5",
    title: "Space out the reps",
    desc: "Reviewing across 3 separate 20-minute sessions beats a single 60-minute cram session.",
    icon: Calendar,
  },
];

const RIGHT_PRINCIPLES = [
  {
    num: "2",
    title: "Deconstruct to first principles",
    desc: "Break the concept down into its smallest fundamental parts.",
    icon: Boxes,
  },
  {
    num: "4",
    title: "Test before you feel ready",
    desc: "Use active recall instead of passive re-reading. Close your notes and write or speak what you know from memory.",
    icon: ClipboardCheck,
  },
  {
    num: "6",
    title: "Build or break something",
    desc: "Apply the concept to a real scenario, problem, or project. Direct feedback from errors is the fastest path to mastery.",
    icon: Laptop,
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
    ? 1.0
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
        <div className="absolute inset-0 z-0 bg-[#87c5f8]">
          {/* Blocky Pixel Clouds */}
          <div className="absolute top-12 left-10">
            <div className="w-24 h-6 bg-white border-2 border-[#12335c] shadow-[4px_4px_0_rgba(18,51,92,0.2)]" />
          </div>
          <div className="absolute top-24 right-16">
            <div className="w-36 h-8 bg-white border-2 border-[#12335c] shadow-[4px_4px_0_rgba(18,51,92,0.2)]" />
          </div>
          <div className="absolute top-48 left-1/4">
             <div className="w-16 h-4 bg-white border-2 border-[#12335c] shadow-[4px_4px_0_rgba(18,51,92,0.2)]" />
          </div>

          {/* Blocky Ocean Water Horizon */}
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-[#2e62a1] border-t-4 border-[#1b4880]">
            {/* Water Light Shimmer Line (Hard Pixel Lines) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-72 h-2 bg-[#6da5e3]" />
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-2 bg-[#6da5e3]" />
            <div className="absolute top-16 left-1/4 w-32 h-2 bg-[#6da5e3]" />
            <div className="absolute top-24 right-1/4 w-24 h-2 bg-[#6da5e3]" />
          </div>
        </div>

        {/* Header Title Section (Fade out as we reach final state) */}
        <div
          className="relative z-20 pt-14 sm:pt-16 px-4 text-center space-y-4 transition-all duration-500"
          style={{
            opacity: isFinalStage ? 0 : Math.max(0, 1 - progress * 1.4),
            transform: `translateY(${progress * -30}px)`,
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-border shadow-[2px_2px_0_rgba(45,27,78,1)]">
            <div className="size-5 bg-primary grid place-items-center text-white font-pixel text-[10px] border border-border">
              C
            </div>
            <span className="text-xs font-retro font-bold uppercase tracking-widest text-primary">ECHO_SYSTEM</span>
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h1 className="text-4xl sm:text-6xl font-pixel text-foreground drop-shadow-[4px_4px_0_rgba(45,27,78,0.2)]">
              ECHO
            </h1>
            <p className="text-sm sm:text-base font-bold uppercase tracking-wider text-foreground font-retro mt-2">
              Evidence-Based Conceptual Honesty Engine
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs sm:text-sm text-foreground font-sans font-bold max-w-sm mx-auto bg-white border-2 border-border px-4 py-2 shadow-[2px_2px_0_rgba(45,27,78,1)]">
              “The answer is correct. But is the understanding real?”
            </p>
          </div>
        </div>

        {/* Center Stage Animation Area */}
        <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none px-4 py-2">
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
            /* State 4: Uniform 3-Column Layout with 6 Non-Overlapping Cards + Center Pixel Brain */
            <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6 md:gap-10 pointer-events-auto animate-in fade-in zoom-in-95 duration-700">
              {/* Background Connection Rays */}
              <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 400 300">
                <line x1="200" y1="150" x2="60" y2="50" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="200" y1="150" x2="340" y2="50" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="200" y1="150" x2="60" y2="150" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="200" y1="150" x2="340" y2="150" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="200" y1="150" x2="60" y2="250" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="200" y1="150" x2="340" y2="250" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
              </svg>

              {/* LEFT COLUMN: Cards 1, 3, 5 */}
              <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-4 max-w-[280px] sm:max-w-[320px] z-20">
                {LEFT_PRINCIPLES.map((principle) => {
                  const Icon = principle.icon;
                  return (
                    <div
                      key={principle.num}
                      className="retro-pixel-card p-3 sm:p-4 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="grid size-7 sm:size-8 place-items-center border-2 border-border bg-primary text-white shrink-0 shadow-[2px_2px_0_rgba(45,27,78,1)]">
                          <Icon className="size-3.5 sm:size-4" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="grid size-5 place-items-center bg-brand text-white font-pixel text-[10px] border-2 border-border shrink-0 shadow-[1px_1px_0_rgba(45,27,78,1)]">
                            {principle.num}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground font-retro leading-tight truncate uppercase">
                            {principle.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed font-sans font-bold">
                        {principle.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CENTER COLUMN: Pixel Brain */}
              <div className="relative z-30 flex flex-col items-center justify-center shrink-0">
                {/* Blocky Aura */}
                <div className="absolute size-40 sm:size-56 bg-brand/30 border-[4px] border-brand animate-pulse [image-rendering:pixelated]" />
                <div className="relative p-2.5 sm:p-3.5 retro-pixel-card bg-white shadow-[8px_8px_0_rgba(45,27,78,1)]">
                  <PixelBrainSVG className="w-20 h-20 sm:w-32 sm:h-32 [image-rendering:pixelated]" />
                </div>
              </div>

              {/* RIGHT COLUMN: Cards 2, 4, 6 */}
              <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-4 max-w-[280px] sm:max-w-[320px] z-20">
                {RIGHT_PRINCIPLES.map((principle) => {
                  const Icon = principle.icon;
                  return (
                    <div
                      key={principle.num}
                      className="retro-pixel-card p-3 sm:p-4 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="grid size-7 sm:size-8 place-items-center border-2 border-border bg-primary text-white shrink-0 shadow-[2px_2px_0_rgba(45,27,78,1)]">
                          <Icon className="size-3.5 sm:size-4" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="grid size-5 place-items-center bg-brand text-white font-pixel text-[10px] border-2 border-border shrink-0 shadow-[1px_1px_0_rgba(45,27,78,1)]">
                            {principle.num}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground font-retro leading-tight truncate uppercase">
                            {principle.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed font-sans font-bold">
                        {principle.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Down Bouncing Footer Indicator */}
        <div
          className="relative z-20 pb-6 text-center transition-opacity duration-300"
          style={{ opacity: isFinalStage ? 0.4 : 1 }}
        >
          <div className="inline-flex flex-col items-center gap-1 text-[11px] font-retro font-bold uppercase tracking-widest text-primary bg-white border-2 border-border shadow-[2px_2px_0_rgba(45,27,78,1)] px-4 py-2">
            <ChevronDown className="size-5 animate-bounce-subtle text-brand" />
            <span>{isFinalStage ? "Proceed" : "Scroll Down"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
