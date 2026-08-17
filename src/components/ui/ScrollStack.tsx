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
            className="scroll-stack-card block retro-pixel-card bg-white p-7 sm:p-9 group text-left no-underline transition-all hover:bg-muted/30"
            style={
              {
                "--stack-top": topOffset,
                "--stack-z": zIndex,
              } as React.CSSProperties
            }
          >
            {/* Top Bar: 01 Number (left) & Circular Icon (right) */}
            <div className="flex items-center justify-between">
              <span className="font-retro font-bold text-primary text-sm sm:text-base tracking-wider uppercase">
                Level {item.stageNumber}
              </span>
              <div className="border-2 border-border bg-white text-foreground p-3 sm:p-3.5 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-[2px_2px_0_rgba(45,27,78,1)]">
                <IconComponent className="size-5 sm:size-6" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-2 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-pixel text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                {item.stageTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-sans font-semibold">
                {item.description}
              </p>
            </div>

            {/* OPEN MENU link */}
            <div className="pt-5 flex items-center">
              <span className="text-xs font-retro font-bold tracking-widest text-brand flex items-center gap-1.5 uppercase">
                <span className="opacity-0 group-hover:opacity-100 animate-blink">►</span> OPEN MENU 
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
