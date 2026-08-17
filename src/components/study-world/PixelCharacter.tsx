import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PixelStudent, PixelGuide, SparkleEffect } from "./PixelIcons";
import { DraggableObject } from "./DraggableObject";

export type CharacterState = "idle" | "thinking" | "celebrating" | "reading";
export type CharacterType = "student" | "guide";

interface PixelCharacterProps {
  id: string;
  type?: CharacterType;
  initialX?: number;
  initialY?: number;
  onCollision?: (id: string, rect: DOMRect) => void;
  characterState?: CharacterState;
  showSparkle?: boolean;
}

export function PixelCharacter({
  id,
  type = "student",
  initialX = 0,
  initialY = 0,
  onCollision,
  characterState = "idle",
  showSparkle = false,
}: PixelCharacterProps) {
  const [internalState, setInternalState] = useState<CharacterState>(characterState);
  
  useEffect(() => {
    setInternalState(characterState);
  }, [characterState]);

  // Bounce animation when celebrating
  const animationVariants = {
    idle: { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    thinking: { rotate: [-5, 5, -5], transition: { repeat: Infinity, duration: 1.5 } },
    celebrating: { y: [0, -15, 0], scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.6 } },
    reading: { y: [0, -1, 0], transition: { repeat: Infinity, duration: 0.5 } }
  };

  return (
    <DraggableObject id={id} initialX={initialX} initialY={initialY} onCollision={onCollision}>
      <div className="relative">
        <motion.div animate={animationVariants[internalState]}>
          {type === "student" ? <PixelStudent /> : <PixelGuide />}
        </motion.div>
        
        <AnimatePresence>
          {showSparkle && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: -20 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-4 -right-4"
            >
              <SparkleEffect />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {internalState === "thinking" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: -25 }}
              exit={{ opacity: 0 }}
              className="absolute -top-6 -right-2 text-xl"
            >
              💭
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DraggableObject>
  );
}
