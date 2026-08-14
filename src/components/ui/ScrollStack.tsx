import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import "./ScrollStack.css";

export interface ScrollStackItem {
  id: string;
  stageNumber: string;
  stageTitle: string;
  icon: React.ElementType;
  description: string;
  to: string;
}

export interface ScrollStackProps {
  items: ScrollStackItem[];
}

export function ScrollStack({ items }: ScrollStackProps) {
  return (
    <div className="scroll-stack-container">
      {items.map((item, idx) => {
        const IconComponent = item.icon;
        const topOffset = `${5 + idx * 1.8}rem`;
        const zIndex = idx + 10;

        return (
          <Link
            key={item.id}
            to={item.to}
            className="scroll-stack-card block rounded-3xl border border-blue-500/30 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl bg-gradient-to-br from-[#050d24] via-[#081538] to-[#0b1c48] hover:border-blue-400/60 hover:shadow-blue-500/20 group text-left no-underline transition-all"
            style={
              {
                "--stack-top": topOffset,
                "--stack-z": zIndex,
              } as React.CSSProperties
            }
          >
            {/* Top Bar: 01 Number (left) & Circular Icon (right) */}
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-400 text-sm sm:text-base tracking-wider">
                {item.stageNumber}
              </span>
              <div className="rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 p-3 sm:p-3.5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
                <IconComponent className="size-5 sm:size-6" />
              </div>
            </div>

            {/* Title & Description matching Figma screenshot */}
            <div className="mt-2 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-blue-200 transition-colors">
                {item.stageTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                {item.description}
              </p>
            </div>

            {/* OPEN MENU link matching Figma screenshot */}
            <div className="pt-5 flex items-center">
              <span className="text-xs font-mono font-bold tracking-widest text-primary flex items-center gap-1.5 uppercase group-hover:underline">
                OPEN MENU <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
