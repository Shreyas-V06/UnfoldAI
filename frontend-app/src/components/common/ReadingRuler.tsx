import React, { useEffect, useState } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ReadingRuler: React.FC = () => {
  const { readingRulerEnabled, rulerHeight } = useAccessibility();
  const [mouseY, setMouseY] = useState<number>(150);

  useEffect(() => {
    if (!readingRulerEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setMouseY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [readingRulerEnabled]);

  if (!readingRulerEnabled) return null;

  return (
    <div
      className="fixed inset-x-0 pointer-events-none z-40 transition-transform duration-75 ease-out"
      style={{
        top: `${mouseY - rulerHeight / 2}px`,
        height: `${rulerHeight}px`,
      }}
    >
      {/* Dimmed upper shade */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
      {/* Translucent focus guide line */}
      <div className="w-full h-full bg-amber-200/25 dark:bg-amber-400/15 border-y-2 border-brand-400/40 backdrop-brightness-105" />
      {/* Dimmed lower shade */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500/80 shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
    </div>
  );
};
