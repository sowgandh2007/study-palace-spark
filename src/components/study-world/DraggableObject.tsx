import React, { useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";

interface DraggableObjectProps {
  id: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  onCollision?: (id: string, rect: DOMRect) => void;
  className?: string;
  bounce?: boolean;
}

export function DraggableObject({
  id,
  children,
  initialX = 0,
  initialY = 0,
  onCollision,
  className = "",
  bounce = true
}: DraggableObjectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onCollision && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      onCollision(id, rect);
    }
  };

  return (
    <motion.div
      ref={ref}
      drag
      dragMomentum={false}
      initial={{ x: initialX, y: initialY }}
      whileHover={{ scale: 1.1 }}
      whileDrag={{ scale: 1.2, zIndex: 50 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className={`absolute cursor-grab active:cursor-grabbing touch-none select-none drop-shadow-md ${className}`}
      style={{
        filter: isDragging ? 'drop-shadow(4px 4px 0px rgba(0,0,0,0.2))' : 'drop-shadow(2px 2px 0px rgba(0,0,0,0.15))'
      }}
    >
      {children}
    </motion.div>
  );
}
