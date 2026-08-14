import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import "./ScrollStack.css";

export interface ScrollStackItem {
  id: string;
  stageNumber: string;
  stageTitle: string;
  icon: React.ElementType;
  description: string;
  content: React.ReactNode;
}

export interface ScrollStackProps {
  items: ScrollStackItem[];
  defaultExpandedId?: string;
}

export function ScrollStack({ items, defaultExpandedId }: ScrollStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId || null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="scroll-stack-container space-y-6">
      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        const IconComponent = item.icon;
        const topOffset = `${4.5 + idx * 1.8}rem`;
        const zIndex = idx + 10;

        return (
          <div
            key={item.id}
            id={`stage-card-${item.id}`}
            className={`scroll-stack-card rounded-3xl border border-blue-500/25 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
              isExpanded
                ? "bg-gradient-to-br from-[#071330] via-[#0b1b44] to-[#0f245c] ring-2 ring-blue-500/50"
                : "bg-gradient-to-br from-[#050d24] via-[#081538] to-[#0b1c48] hover:border-blue-400/40 cursor-pointer"
            }`}
            style={
              {
                "--stack-top": topOffset,
                "--stack-z": zIndex,
              } as React.CSSProperties
            }
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("textarea")) {
                return;
              }
              toggleExpand(item.id);
            }}
          >
            {/* Top Bar: 01 Number (left) & Circular Icon (right) */}
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-400 text-sm sm:text-base tracking-wider">
                {item.stageNumber}
              </span>
              <div className="rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 p-3 sm:p-3.5 flex items-center justify-center shrink-0">
                <IconComponent className="size-5 sm:size-6" />
              </div>
            </div>

            {/* Title & Description matching Figma */}
            <div className="mt-2 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {item.stageTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                {item.description}
              </p>
            </div>

            {/* OPEN MENU link matching Figma screenshot */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleExpand(item.id)}
                className="text-xs font-mono font-bold tracking-widest text-primary flex items-center gap-1.5 hover:underline uppercase cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    CLOSE MENU <ChevronDown className="size-4" />
                  </>
                ) : (
                  <>
                    OPEN MENU <ChevronRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            {/* Expanded Content View (New & Existing ECHO Tools) */}
            {isExpanded && (
              <div className="mt-6 pt-6 border-t border-blue-500/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
