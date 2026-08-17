import React, { useState, useEffect, useRef } from "react";
import { PixelCharacter, CharacterState } from "./PixelCharacter";
import { DraggableObject } from "./DraggableObject";
import { PixelBook, PixelLightbulb, PixelStar } from "./PixelIcons";
import { useEcho } from "@/lib/echo/store";

interface StudyWorldProps {
  children: React.ReactNode;
  pageContext?: "dashboard" | "learn" | "assessment" | "reflection";
}

export function StudyWorld({ children, pageContext = "dashboard" }: StudyWorldProps) {
  const { userProfile, activeLearnMaterial } = useEcho();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Character States
  const [studentState, setStudentState] = useState<CharacterState>("idle");
  const [guideState, setGuideState] = useState<CharacterState>("idle");
  const [showSparkles, setShowSparkles] = useState<Record<string, boolean>>({});

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Read user preference for focus mode if available
    const focusPref = localStorage.getItem("echo-focus-mode");
    if (focusPref === "true") setIsFocusMode(true);
  }, []);

  // Sync states based on app data
  useEffect(() => {
    if (activeLearnMaterial && pageContext === "learn") {
      setStudentState("reading");
    } else {
      setStudentState("idle");
    }
  }, [activeLearnMaterial, pageContext]);

  const toggleFocusMode = () => {
    const newVal = !isFocusMode;
    setIsFocusMode(newVal);
    localStorage.setItem("echo-focus-mode", newVal.toString());
  };

  const handleCollision = (id: string, rect: DOMRect) => {
    if (!containerRef.current) return;
    
    // Very simple distance-based collision check for demo purposes
    // In a real scenario, we'd check against other specific refs.
    
    // E.g., if a lightbulb is dragged near the center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const distanceToCenter = Math.sqrt(Math.pow(rect.x - centerX, 2) + Math.pow(rect.y - centerY, 2));

    if (distanceToCenter < 150) {
      if (id === "lightbulb") {
        setStudentState("celebrating");
        setShowSparkles(prev => ({ ...prev, student: true }));
        setTimeout(() => {
          setStudentState("idle");
          setShowSparkles(prev => ({ ...prev, student: false }));
        }, 2000);
      }
    }
  };

  if (isFocusMode) {
    return (
      <div className="relative min-h-screen w-full">
        {/* Toggle Button for Focus Mode */}
        <button 
          onClick={toggleFocusMode}
          className="fixed bottom-4 right-4 z-50 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors bg-white/50 backdrop-blur-sm px-2 py-1 rounded"
        >
          Enable Study World
        </button>
        {children}
      </div>
    );
  }

  // Calculate some dynamic object counts based on level
  const numStars = isMobile ? 1 : Math.min((userProfile?.level || 1), 3);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden">
      {/* BACKGROUND PIXEL LAYER (z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
         {/* We can put subtle grid lines or static background elements here */}
      </div>

      {/* INTERACTION LAYER (z-10) */}
      <div className="absolute inset-0 z-10">
        
        {pageContext === "dashboard" && !isMobile && (
           <PixelCharacter 
             id="guide" 
             type="guide" 
             initialX={window.innerWidth - 100} 
             initialY={window.innerHeight - 150} 
             characterState={guideState} 
           />
        )}

        <PixelCharacter 
          id="student" 
          type="student" 
          initialX={50} 
          initialY={window.innerHeight - 150} 
          characterState={studentState} 
          showSparkle={showSparkles["student"]}
        />

        {!isMobile && (
          <DraggableObject id="book1" initialX={100} initialY={150} onCollision={handleCollision}>
            <PixelBook />
          </DraggableObject>
        )}

        <DraggableObject id="lightbulb" initialX={window.innerWidth - (isMobile ? 60 : 120)} initialY={100} onCollision={handleCollision}>
          <PixelLightbulb />
        </DraggableObject>

        {Array.from({ length: numStars }).map((_, i) => (
          <DraggableObject 
            key={`star-${i}`} 
            id={`star-${i}`} 
            initialX={200 + (i * 50)} 
            initialY={80} 
            bounce={false}
          >
            <PixelStar />
          </DraggableObject>
        ))}

      </div>

      {/* MAIN APP CONTENT (z-20) */}
      <div className="relative z-20 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>

      {/* Toggle Button for Focus Mode */}
      <button 
        onClick={toggleFocusMode}
        className="fixed bottom-4 right-4 z-50 text-[10px] font-mono text-primary hover:text-brand-1 transition-colors bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-primary/20"
      >
        Focus Mode (Disable Animations)
      </button>
    </div>
  );
}
