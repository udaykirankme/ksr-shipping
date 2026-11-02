"use client";

import { useEffect, useState } from "react";

export function NavigationProgress({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let animFrame: number;

    if (active) {
      setVisible(true);
      setProgress(15);

      // Smooth step advancement
      const startTime = Date.now();
      const step = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
          setProgress(prev => Math.min(prev + 2, 60));
          animFrame = requestAnimationFrame(step);
        } else if (elapsed < 800) {
          setProgress(prev => Math.min(prev + 0.8, 85));
          animFrame = requestAnimationFrame(step);
        } else {
          setProgress(prev => Math.min(prev + 0.2, 95));
          animFrame = requestAnimationFrame(step);
        }
      };
      animFrame = requestAnimationFrame(step);
    } else {
      if (progress > 0) {
        setProgress(100);
        timer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      } else {
        setVisible(false);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-orange-100 overflow-hidden pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 transition-all ease-out duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

