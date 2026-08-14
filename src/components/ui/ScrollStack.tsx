import React, { useState, useEffect } from "react";
import "./ScrollStack.css";

export interface ScrollStackItem {
  id: string;
  stageNumber: string;
  stageName: string;
  stageTitle: string;
  badgeLabel: string;
  icon: React.ElementType;
  description: string;
  accentColor: string;
  content: React.ReactNode;
}

export interface ScrollStackProps {
  items: ScrollStackItem[];
  defaultExpandedId?: string;
}

export function ScrollStack({ items, defaultExpandedId }: ScrollStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId || items[0]?.id || null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="scroll-stack-container">
      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        const IconComponent = item.icon;
        const topOffset = `${5.5 + idx * 1.5}rem`;
        const zIndex = idx + 10;

        return (
          <div
            key={item.id}
            id={`stage-card-${item.id}`}
            className={`scroll-stack-card glass-card rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
              isExpanded ? "ring-2 ring-primary/60 bg-black/40" : "bg-black/25 hover:bg-black/35 cursor-pointer"
            }`}
            style={
              {
                "--stack-top": topOffset,
                "--stack-z": zIndex,
              } as React.CSSProperties
            }
            onClick={(e) => {
              // Don't toggle if user clicked inside an interactive button, input, or link
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("textarea")) {
                return;
              }
              toggleExpand(item.id);
            }}
          >
            {/* Card Header Bar */}
            <div className="flex items-center justify-between gap-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl border text-primary shadow-glow ${item.accentColor || "bg-primary/20 border-primary/40"}`}>
                  <IconComponent className="size-5 sm:size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold tracking-wider text-primary">
                      STAGE {item.stageNumber} · {item.stageName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono hidden sm:inline">
                      ({item.badgeLabel})
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                    {item.stageTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-mono font-bold text-white hover:bg-white/20 transition-all min-h-[38px] flex items-center gap-1.5"
                >
                  {isExpanded ? "Collapse ▲" : "Open Features ▼"}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {item.description}
            </p>

            {/* Card Expanded Content Features (New AI Features + Existing ECHO Features) */}
            {isExpanded && (
              <div className="pt-4 border-t border-white/15 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
