import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 70; // pixels to pull before trigger

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-down if window or container is at the top
    if (window.scrollY === 0 || (containerRef.current && containerRef.current.scrollTop === 0)) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && (window.scrollY === 0 || (containerRef.current && containerRef.current.scrollTop === 0))) {
      // Damped pull effect (logarithmic / square root resistance)
      const damped = Math.min(Math.pow(diff, 0.85) * 2, 100);
      setPullY(damped);
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(50);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPullY(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull Down Animated Header */}
      <div
        className="overflow-hidden transition-all duration-200 flex items-center justify-center text-xs font-mono text-zinc-400"
        style={{
          height: `${pullY}px`,
          opacity: pullY > 15 ? Math.min(pullY / 50, 1) : 0,
        }}
      >
        <div className="flex items-center gap-2 py-2">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span className="text-amber-300 font-bold">Synchronizing Live Feed...</span>
            </>
          ) : pullY >= PULL_THRESHOLD ? (
            <>
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-200">Release to Refresh</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-zinc-500 animate-bounce" />
              <span>Pull down to refresh</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: pullY > 0 && !isRefreshing ? `translateY(${pullY * 0.25}px)` : 'none',
          transition: pullY === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
