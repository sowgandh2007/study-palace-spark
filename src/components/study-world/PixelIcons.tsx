import React from 'react';

export const PixelStudent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-12 h-12 text-primary ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M7 2h10v2H7V2zm-2 2h2v4H5V4zm14 0h-2v4h2V4zM5 8h14v2H5V8zm-2 2h2v4H3v-4zm18 0h-2v4h2v-4zM5 14h14v2H5v-2zm-2 2h2v4H3v-4zm18 0h-2v4h2v-4zM7 20h10v2H7v-2z" fill="currentColor" />
    <path d="M8 9h2v2H8V9zm6 0h2v2h-2V9z" fill="white" />
  </svg>
);

export const PixelGuide = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-10 h-10 text-brand-2 ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M10 2h4v2h-4V2zM8 4h2v2H8V4zm6 0h2v2h-2V4zM6 6h2v6H6V6zm10 0h2v6h-2V6zM8 12h8v2H8v-2zM10 14h4v2h-4v-2z" fill="currentColor" />
    <path d="M9 8h2v2H9V8zm4 0h2v2h-2V8z" fill="white" />
  </svg>
);

export const PixelBook = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 text-brand-1 ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M5 4h14v2H5V4zm-2 2h2v12H3V6zm16 0h2v12h-2V6zM5 18h14v2H5v-2zm2-10h10v2H7V8zm0 4h10v2H7v-2z" fill="currentColor" />
  </svg>
);

export const PixelLightbulb = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 text-warning ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M9 2h6v2H9V2zM7 4h2v2H7V4zm8 0h2v2h-2V4zM5 6h2v6H5V6zm12 0h2v6h-2V6zM7 12h2v2H7v-2zm8 0h2v2h-2v-2zM9 14h6v2H9v-2zM10 17h4v2h-4v-2zM11 20h2v2h-2v-2z" fill="currentColor" />
  </svg>
);

export const PixelStar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 text-warning ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M11 2h2v4h-2V2zM9 6h6v2H9V6zM5 8h14v2H5V8zm-2 2h18v2H3v-2zm2 2h14v2H5v-2zm2 2h10v2H7v-2zm-2 2h4v2H5v-2zm10 0h4v2h-4v-2zm-8 2h2v2H7v-2zm8 0h2v2h-2v-2z" fill="currentColor" />
  </svg>
);

export const SparkleEffect = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 text-brand-2 ${className}`} style={{ shapeRendering: 'crispEdges' }}>
    <path d="M11 2h2v4h-2V2zm-4 4h2v2H7V6zm8 0h2v2h-2V6zM3 10h4v2H3v-2zm14 0h4v2h-4v-2zM7 14h2v2H7v-2zm8 0h2v2h-2v-2zM11 18h2v4h-2v-4z" fill="currentColor" />
  </svg>
);
